package com.example.data.repository

import android.content.Context
import com.example.data.local.*
import com.example.data.model.*
import com.example.data.worker.SyncWorker
import com.google.firebase.firestore.FirebaseFirestore
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import timber.log.Timber
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.random.Random

interface FinanceRepository {
    val allPayments: Flow<List<Payment>>
    val allMeters: Flow<List<ElectricityMeter>>
    val allTokens: Flow<List<ElectricityToken>>
    suspend fun savePayment(payment: Payment)
    suspend fun updatePayment(payment: Payment)
    suspend fun saveMeterReading(roomNumber: String, currentKwh: Double)
    suspend fun saveElectricityToken(token: ElectricityToken)
    suspend fun getMeterByRoom(roomNumber: String): ElectricityMeter?
}

@Singleton
class OfflineFirstFinanceRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val database: AppDatabase
) : FinanceRepository {

    private val firestore: FirebaseFirestore? = runCatching { FirebaseFirestore.getInstance() }.getOrNull()
    private val moshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
    private val repositoryScope = CoroutineScope(Dispatchers.IO)

    init {
        startRealtimeFinanceSync()
    }

    override val allPayments: Flow<List<Payment>> =
        database.paymentDao().getAllPayments().map { list -> list.map { it.toDomain() } }

    override val allMeters: Flow<List<ElectricityMeter>> =
        database.electricityMeterDao().getAllMeters().map { list -> list.map { it.toDomain() } }

    override val allTokens: Flow<List<ElectricityToken>> =
        database.electricityTokenDao().getAllTokens().map { list -> list.map { it.toDomain() } }

    override suspend fun getMeterByRoom(roomNumber: String): ElectricityMeter? {
        return database.electricityMeterDao().getMeterByRoom(roomNumber)?.toDomain()
    }

    override suspend fun savePayment(payment: Payment) {
        database.paymentDao().insertPayment(PaymentEntity.fromDomain(payment))
        enqueueMutation(
            id = payment.id,
            entityType = "PAYMENT",
            action = "INSERT",
            payload = mapOf(
                "residentId" to payment.residentId,
                "residentName" to payment.residentName,
                "roomNumber" to payment.roomNumber,
                "amount" to payment.amount,
                "type" to payment.type.name,
                "status" to payment.status.name,
                "date" to payment.date,
                "dueDate" to payment.dueDate,
                "paymentMethod" to payment.paymentMethod.name,
                "receiptRef" to payment.receiptRef,
                "notes" to payment.notes
            )
        )
    }

    override suspend fun updatePayment(payment: Payment) {
        database.paymentDao().updatePayment(PaymentEntity.fromDomain(payment))
        enqueueMutation(
            id = payment.id,
            entityType = "PAYMENT",
            action = "UPDATE",
            payload = mapOf(
                "status" to payment.status.name,
                "receiptRef" to payment.receiptRef,
                "notes" to payment.notes
            )
        )
    }

    override suspend fun saveMeterReading(roomNumber: String, currentKwh: Double) {
        val existing = database.electricityMeterDao().getMeterByRoom(roomNumber)
        val nowFormatted = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val meterId = existing?.id ?: "m_$roomNumber"
        val meterNum = existing?.meterNumber ?: "PLN-$roomNumber-${Random.nextInt(10000, 99999)}"
        val lastKwh = existing?.currentReadingKwh ?: currentKwh

        val updatedEntity = ElectricityMeterEntity(
            id = meterId,
            roomNumber = roomNumber,
            meterNumber = meterNum,
            lastReadingKwh = lastKwh,
            currentReadingKwh = currentKwh,
            readingDate = nowFormatted,
            tariffPerKwh = existing?.tariffPerKwh ?: 1699.53,
            isBilled = false
        )
        database.electricityMeterDao().insertMeter(updatedEntity)

        enqueueMutation(
            id = meterId,
            entityType = "METER",
            action = "UPDATE",
            payload = mapOf(
                "roomNumber" to roomNumber,
                "meterNumber" to meterNum,
                "lastReadingKwh" to lastKwh,
                "currentReadingKwh" to currentKwh,
                "readingDate" to nowFormatted,
                "tariffPerKwh" to 1699.53,
                "isBilled" to false
            )
        )
    }

    override suspend fun saveElectricityToken(token: ElectricityToken) {
        database.electricityTokenDao().insertToken(ElectricityTokenEntity.fromDomain(token))
        enqueueMutation(
            id = token.id,
            entityType = "TOKEN",
            action = "INSERT",
            payload = mapOf(
                "roomNumber" to token.roomNumber,
                "meterNumber" to token.meterNumber,
                "tokenCode" to token.tokenCode,
                "amountRp" to token.amountRp,
                "kwhAmount" to token.kwhAmount,
                "generatedAt" to token.generatedAt,
                "issuedBy" to token.issuedBy,
                "status" to token.status.name,
                "residentName" to token.residentName
            )
        )
    }

    private fun startRealtimeFinanceSync() {
        val firestoreInstance = firestore ?: return
        val propertyRef = firestoreInstance.collection("properties").document("lewi_house_main")

        propertyRef.collection("payments").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null) return@addSnapshotListener
            repositoryScope.launch {
                val list = snapshot.documents.mapNotNull { doc ->
                    runCatching {
                        PaymentEntity(
                            id = doc.id,
                            residentId = doc.getString("residentId") ?: "",
                            residentName = doc.getString("residentName") ?: "",
                            roomNumber = doc.getString("roomNumber") ?: "",
                            amount = doc.getDouble("amount") ?: 0.0,
                            type = doc.getString("type") ?: PaymentType.RENT.name,
                            status = doc.getString("status") ?: PaymentStatus.PENDING.name,
                            date = doc.getString("date") ?: "",
                            dueDate = doc.getString("dueDate") ?: "",
                            paymentMethod = doc.getString("paymentMethod") ?: PaymentMethod.BANK_TRANSFER.name,
                            receiptRef = doc.getString("receiptRef") ?: "",
                            notes = doc.getString("notes") ?: ""
                        )
                    }.getOrNull()
                }
                if (list.isNotEmpty()) database.paymentDao().insertPayments(list)
            }
        }

        propertyRef.collection("tokens").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null) return@addSnapshotListener
            repositoryScope.launch {
                val list = snapshot.documents.mapNotNull { doc ->
                    runCatching {
                        ElectricityTokenEntity(
                            id = doc.id,
                            roomNumber = doc.getString("roomNumber") ?: "",
                            meterNumber = doc.getString("meterNumber") ?: "",
                            tokenCode = doc.getString("tokenCode") ?: "",
                            amountRp = doc.getDouble("amountRp") ?: 0.0,
                            kwhAmount = doc.getDouble("kwhAmount") ?: 0.0,
                            generatedAt = doc.getString("generatedAt") ?: "",
                            issuedBy = doc.getString("issuedBy") ?: "",
                            status = doc.getString("status") ?: TokenStatus.ISSUED.name,
                            residentName = doc.getString("residentName") ?: ""
                        )
                    }.getOrNull()
                }
                if (list.isNotEmpty()) database.electricityTokenDao().insertTokens(list)
            }
        }
    }

    private suspend fun enqueueMutation(
        id: String,
        entityType: String,
        action: String,
        payload: Map<String, Any>
    ) {
        val mapType = com.squareup.moshi.Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
        val adapter = moshi.adapter<Map<String, Any>>(mapType)
        val json = adapter.toJson(payload)

        database.pendingMutationDao().insertMutation(
            PendingMutationEntity(
                id = id,
                entityType = entityType,
                action = action,
                payloadJson = json
            )
        )
        SyncWorker.enqueueSync(context)
    }
}
