package com.example.data.local

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import com.example.data.model.UnitStatus
import com.example.data.model.UnitType
import kotlinx.coroutines.flow.first
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
class RoomDaoTest {

    private lateinit var database: AppDatabase
    private lateinit var roomDao: RoomDao
    private lateinit var pendingMutationDao: PendingMutationDao

    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, AppDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        roomDao = database.roomDao()
        pendingMutationDao = database.pendingMutationDao()
    }

    @After
    fun teardown() {
        database.close()
    }

    @Test
    fun insertAndQueryRoom() = runBlocking {
        val room = RoomEntity(
            id = "room_test_101",
            roomNumber = "101",
            type = UnitType.STANDARD.name,
            floor = 1,
            monthlyRate = 3500000.0,
            status = UnitStatus.VACANT.name,
            amenities = "AC,WiFi,Bathroom",
            sizeSqm = 24.0,
            electricityMeterId = "m_101",
            currentResidentId = null,
            currentResidentName = null,
            notes = "Test room"
        )

        roomDao.insertRoom(room)

        val retrieved = roomDao.getRoomById("room_test_101")
        assertNotNull(retrieved)
        assertEquals("101", retrieved?.roomNumber)
        assertEquals(3500000.0, retrieved?.monthlyRate ?: 0.0, 0.01)

        val allRooms = roomDao.getAllRooms().first()
        assertEquals(1, allRooms.size)
        assertEquals("101", allRooms[0].roomNumber)
    }

    @Test
    fun updateRoomStatus() = runBlocking {
        val room = RoomEntity(
            id = "room_test_102",
            roomNumber = "102",
            type = UnitType.DELUXE.name,
            floor = 2,
            monthlyRate = 4200000.0,
            status = UnitStatus.VACANT.name,
            amenities = "AC,WiFi,Balcony",
            sizeSqm = 30.0,
            electricityMeterId = "m_102",
            currentResidentId = null,
            currentResidentName = null,
            notes = ""
        )

        roomDao.insertRoom(room)
        val updated = room.copy(status = UnitStatus.OCCUPIED.name, currentResidentName = "Budi")
        roomDao.updateRoom(updated)

        val retrieved = roomDao.getRoomById("room_test_102")
        assertEquals(UnitStatus.OCCUPIED.name, retrieved?.status)
        assertEquals("Budi", retrieved?.currentResidentName)
    }

    @Test
    fun pendingMutationOutboxQueue() = runBlocking {
        val mutation = PendingMutationEntity(
            id = "mut_001",
            entityType = "ROOM",
            action = "INSERT",
            payloadJson = "{\"roomNumber\":\"105\"}"
        )

        pendingMutationDao.insertMutation(mutation)
        var list = pendingMutationDao.getAllPendingMutations()
        assertEquals(1, list.size)
        assertEquals("mut_001", list[0].id)

        pendingMutationDao.deleteMutationById("mut_001")
        list = pendingMutationDao.getAllPendingMutations()
        assertTrue(list.isEmpty())
    }
}
