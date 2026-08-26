package com.example.data.worker

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.*
import com.example.data.local.AppDatabase
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import timber.log.Timber
import java.util.concurrent.TimeUnit

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val database: AppDatabase
) : CoroutineWorker(appContext, workerParams) {

    private val firestore: FirebaseFirestore? = runCatching { FirebaseFirestore.getInstance() }.getOrNull()
    private val moshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val firestoreInstance = firestore
        if (firestoreInstance == null) {
            Timber.w("SyncWorker: Firestore unavailable, retrying later")
            return@withContext Result.retry()
        }

        val pendingMutationDao = database.pendingMutationDao()
        val pendingList = pendingMutationDao.getAllPendingMutations()

        if (pendingList.isEmpty()) {
            return@withContext Result.success()
        }

        Timber.d("SyncWorker: Processing ${pendingList.size} pending mutations")
        val propertyRef = firestoreInstance.collection("properties").document("lewi_house_main")

        for (mutation in pendingList) {
            try {
                val collectionName = when (mutation.entityType) {
                    "ROOM" -> "rooms"
                    "RESIDENT" -> "residents"
                    "PAYMENT" -> "payments"
                    "METER" -> "meters"
                    "TOKEN" -> "tokens"
                    "TICKET" -> "tickets"
                    "FEEDBACK" -> "feedbacks"
                    "SURVEY" -> "surveys"
                    "NOTIFICATION" -> "notifications"
                    else -> null
                }

                if (collectionName != null) {
                    val docRef = propertyRef.collection(collectionName).document(mutation.id)
                    when (mutation.action) {
                        "INSERT", "UPDATE" -> {
                            val mapType = com.squareup.moshi.Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
                            val adapter = moshi.adapter<Map<String, Any>>(mapType)
                            val map = adapter.fromJson(mutation.payloadJson) ?: emptyMap()
                            docRef.set(map, SetOptions.merge()).await()
                        }
                        "DELETE" -> {
                            docRef.delete().await()
                        }
                    }
                }
                // Successfully synced to cloud, remove from local queue
                pendingMutationDao.deleteMutationById(mutation.id)
            } catch (e: Exception) {
                Timber.e(e, "SyncWorker: Failed to process mutation ${mutation.id}")
                pendingMutationDao.incrementRetryCount(mutation.id)
                if (mutation.retryCount >= 5) {
                    // Drop permanently failing mutation to avoid head-of-line blocking
                    pendingMutationDao.deleteMutationById(mutation.id)
                } else {
                    return@withContext Result.retry()
                }
            }
        }

        Result.success()
    }

    companion object {
        const val WORK_NAME = "lewi_house_sync_worker"

        fun enqueueSync(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
                .setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
                .build()

            WorkManager.getInstance(context).enqueueUniqueWork(
                WORK_NAME,
                ExistingWorkPolicy.REPLACE,
                syncRequest
            )
        }
    }
}
