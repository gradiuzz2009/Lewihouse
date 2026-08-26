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
import javax.inject.Inject
import javax.inject.Singleton

interface RoomRepository {
    val allRooms: Flow<List<RoomUnit>>
    val allResidents: Flow<List<Resident>>
    suspend fun getRoomById(id: String): RoomUnit?
    suspend fun getRoomByNumber(roomNumber: String): RoomUnit?
    suspend fun saveRoom(room: RoomUnit)
    suspend fun updateRoomStatus(roomId: String, newStatus: UnitStatus)
    suspend fun deleteRoom(roomId: String)
    suspend fun saveResident(resident: Resident)
    suspend fun deleteResident(residentId: String)
    suspend fun getResidentById(residentId: String): Resident?
    suspend fun authenticateTenant(identifier: String): Resident?
    suspend fun ensureInitialData()
}

@Singleton
class OfflineFirstRoomRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val database: AppDatabase
) : RoomRepository {

    private val firestore: FirebaseFirestore? = runCatching { FirebaseFirestore.getInstance() }.getOrNull()
    private val moshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()
    private val repositoryScope = CoroutineScope(Dispatchers.IO)

    init {
        startRealtimeFirestoreSync()
    }

    // SSOT: Always stream from Room Database
    override val allRooms: Flow<List<RoomUnit>> =
        database.roomDao().getAllRooms().map { list -> list.map { it.toDomain() } }

    override val allResidents: Flow<List<Resident>> =
        database.residentDao().getAllResidents().map { list -> list.map { it.toDomain() } }

    override suspend fun getRoomById(id: String): RoomUnit? {
        return database.roomDao().getRoomById(id)?.toDomain()
    }

    override suspend fun getRoomByNumber(roomNumber: String): RoomUnit? {
        return database.roomDao().getRoomByNumber(roomNumber)?.toDomain()
    }

    override suspend fun getResidentById(residentId: String): Resident? {
        return database.residentDao().getResidentById(residentId)?.toDomain()
    }

    override suspend fun authenticateTenant(identifier: String): Resident? {
        return database.residentDao().findResidentByIdentifier(identifier.trim())?.toDomain()
    }

    override suspend fun saveRoom(room: RoomUnit) {
        database.roomDao().insertRoom(RoomEntity.fromDomain(room))
        enqueueMutation(
            id = room.id,
            entityType = "ROOM",
            action = "INSERT",
            payload = mapOf(
                "roomNumber" to room.roomNumber,
                "type" to room.type.name,
                "floor" to room.floor,
                "monthlyRate" to room.monthlyRate,
                "status" to room.status.name,
                "amenities" to room.amenities,
                "sizeSqm" to room.sizeSqm,
                "electricityMeterId" to room.electricityMeterId,
                "currentResidentId" to (room.currentResidentId ?: ""),
                "currentResidentName" to (room.currentResidentName ?: ""),
                "notes" to room.notes
            )
        )
    }

    override suspend fun updateRoomStatus(roomId: String, newStatus: UnitStatus) {
        val existing = database.roomDao().getRoomById(roomId) ?: return
        val updated = existing.copy(status = newStatus.name)
        database.roomDao().updateRoom(updated)
        enqueueMutation(
            id = roomId,
            entityType = "ROOM",
            action = "UPDATE",
            payload = mapOf("status" to newStatus.name)
        )
    }

    override suspend fun deleteRoom(roomId: String) {
        database.roomDao().deleteRoomById(roomId)
        enqueueMutation(
            id = roomId,
            entityType = "ROOM",
            action = "DELETE",
            payload = emptyMap()
        )
    }

    override suspend fun saveResident(resident: Resident) {
        database.residentDao().insertResident(ResidentEntity.fromDomain(resident))
        val room = database.roomDao().getRoomByNumber(resident.roomNumber)
        if (room != null) {
            database.roomDao().updateRoom(
                room.copy(
                    status = UnitStatus.OCCUPIED.name,
                    currentResidentId = resident.id,
                    currentResidentName = resident.fullName
                )
            )
        }
        enqueueMutation(
            id = resident.id,
            entityType = "RESIDENT",
            action = "INSERT",
            payload = mapOf(
                "fullName" to resident.fullName,
                "email" to resident.email,
                "phone" to resident.phone,
                "roomNumber" to resident.roomNumber,
                "moveInDate" to resident.moveInDate,
                "leaseEndDate" to resident.leaseEndDate,
                "monthlyRent" to resident.monthlyRent,
                "depositAmount" to resident.depositAmount,
                "outstandingDebt" to resident.outstandingDebt,
                "emergencyContact" to resident.emergencyContact,
                "emergencyPhone" to resident.emergencyPhone,
                "ktpNumber" to resident.ktpNumber,
                "status" to resident.status.name,
                "avatarIndex" to resident.avatarIndex
            )
        )
    }

    override suspend fun deleteResident(residentId: String) {
        val resident = database.residentDao().getResidentById(residentId)
        if (resident != null) {
            val room = database.roomDao().getRoomByNumber(resident.roomNumber)
            if (room != null && room.currentResidentId == residentId) {
                database.roomDao().updateRoom(
                    room.copy(
                        status = UnitStatus.VACANT.name,
                        currentResidentId = null,
                        currentResidentName = null
                    )
                )
            }
        }
        database.residentDao().deleteResidentById(residentId)
        enqueueMutation(
            id = residentId,
            entityType = "RESIDENT",
            action = "DELETE",
            payload = emptyMap()
        )
    }

    override suspend fun ensureInitialData() {
        if (database.roomDao().getRoomById("room_101") == null) {
            database.roomDao().insertRooms(InitialData.rooms)
            database.residentDao().insertResidents(InitialData.residents)
            database.paymentDao().insertPayments(InitialData.payments)
            database.electricityMeterDao().insertMeters(InitialData.meters)
            database.electricityTokenDao().insertTokens(InitialData.tokens)
            database.maintenanceTicketDao().insertTickets(InitialData.tickets)
            database.serviceFeedbackDao().insertFeedbacks(InitialData.feedbacks)
            database.satisfactionSurveyDao().insertSurveys(InitialData.surveys)
            database.appNotificationDao().insertNotifications(InitialData.notifications)
        }
    }

    private fun startRealtimeFirestoreSync() {
        val firestoreInstance = firestore ?: return
        val propertyRef = firestoreInstance.collection("properties").document("lewi_house_main")

        // Sync Rooms from Firestore into Room DB
        propertyRef.collection("rooms").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null) {
                Timber.w(error, "Firestore rooms listener error")
                return@addSnapshotListener
            }
            repositoryScope.launch {
                val roomEntities = snapshot.documents.mapNotNull { doc ->
                    runCatching {
                        RoomEntity(
                            id = doc.id,
                            roomNumber = doc.getString("roomNumber") ?: "",
                            type = doc.getString("type") ?: UnitType.STANDARD.name,
                            floor = doc.getLong("floor")?.toInt() ?: 1,
                            monthlyRate = doc.getDouble("monthlyRate") ?: 3000000.0,
                            status = doc.getString("status") ?: UnitStatus.VACANT.name,
                            amenities = (doc.get("amenities") as? List<*>)?.joinToString(",") ?: "",
                            sizeSqm = doc.getDouble("sizeSqm") ?: 20.0,
                            electricityMeterId = doc.getString("electricityMeterId") ?: "",
                            currentResidentId = doc.getString("currentResidentId"),
                            currentResidentName = doc.getString("currentResidentName"),
                            notes = doc.getString("notes") ?: ""
                        )
                    }.getOrNull()
                }
                if (roomEntities.isNotEmpty()) {
                    database.roomDao().insertRooms(roomEntities)
                }
            }
        }

        // Sync Residents from Firestore into Room DB
        propertyRef.collection("residents").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null) {
                Timber.w(error, "Firestore residents listener error")
                return@addSnapshotListener
            }
            repositoryScope.launch {
                val residentEntities = snapshot.documents.mapNotNull { doc ->
                    runCatching {
                        ResidentEntity(
                            id = doc.id,
                            fullName = doc.getString("fullName") ?: "",
                            email = doc.getString("email") ?: "",
                            phone = doc.getString("phone") ?: "",
                            roomNumber = doc.getString("roomNumber") ?: "",
                            moveInDate = doc.getString("moveInDate") ?: "",
                            leaseEndDate = doc.getString("leaseEndDate") ?: "",
                            monthlyRent = doc.getDouble("monthlyRent") ?: 0.0,
                            depositAmount = doc.getDouble("depositAmount") ?: 0.0,
                            outstandingDebt = doc.getDouble("outstandingDebt") ?: 0.0,
                            emergencyContact = doc.getString("emergencyContact") ?: "",
                            emergencyPhone = doc.getString("emergencyPhone") ?: "",
                            ktpNumber = doc.getString("ktpNumber") ?: "",
                            status = doc.getString("status") ?: ResidentStatus.ACTIVE.name,
                            avatarIndex = doc.getLong("avatarIndex")?.toInt() ?: 0
                        )
                    }.getOrNull()
                }
                if (residentEntities.isNotEmpty()) {
                    database.residentDao().insertResidents(residentEntities)
                }
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
