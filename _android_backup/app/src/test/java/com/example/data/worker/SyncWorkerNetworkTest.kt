package com.example.data.worker

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.local.AppDatabase
import com.example.data.local.PendingMutationEntity
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(manifest = Config.NONE)
class SyncWorkerNetworkTest {

    private lateinit var database: AppDatabase

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
    }

    @After
    fun teardown() {
        database.close()
    }

    @Test
    fun testOfflineOutboxQueueingAndRetry() = runBlocking {
        val pendingDao = database.pendingMutationDao()

        // 1. Enqueue offline mutations
        val mutation1 = PendingMutationEntity(
            id = "mut_room_101",
            entityType = "ROOM",
            action = "UPDATE",
            payloadJson = "{\"status\":\"OCCUPIED\"}"
        )
        val mutation2 = PendingMutationEntity(
            id = "mut_ticket_202",
            entityType = "TICKET",
            action = "INSERT",
            payloadJson = "{\"title\":\"AC Leaking\",\"urgency\":\"HIGH\"}"
        )

        pendingDao.insertMutation(mutation1)
        pendingDao.insertMutation(mutation2)

        var list = pendingDao.getAllPendingMutations()
        assertEquals(2, list.size)

        // 2. Simulate failure & retry count increment
        pendingDao.incrementRetryCount("mut_room_101")
        val updated = pendingDao.getAllPendingMutations().first { it.id == "mut_room_101" }
        assertEquals(1, updated.retryCount)

        // 3. Simulate successful sync execution -> mutation deletion
        pendingDao.deleteMutationById("mut_room_101")
        pendingDao.deleteMutationById("mut_ticket_202")

        list = pendingDao.getAllPendingMutations()
        assertTrue(list.isEmpty())
    }
}
