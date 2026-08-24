package com.example.data.repository

import com.example.data.local.AppDatabase
import com.example.data.local.InitialData
import com.example.data.model.*
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.PersistentCacheSettings
import com.google.firebase.firestore.SetOptions
import com.google.firebase.firestore.firestoreSettings
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import kotlin.random.Random

class LewiHouseFirestoreRepository(
    private val firestore: FirebaseFirestore? = try { FirebaseFirestore.getInstance() } catch (_: Exception) { null },
    @Suppress("unused")
    private val localDb: AppDatabase? = null,
    private val propertyId: String = "lewi_house_main"
) {

    init {
        // Configure persistent cache settings for offline persistence
        firestore?.let {
            runCatching {
                it.firestoreSettings = firestoreSettings {
                    setLocalCacheSettings(
                        PersistentCacheSettings.newBuilder().build()
                    )
                }
            }
        }
    }

    private val propertyRef get() = firestore?.collection("properties")?.document(propertyId)

    val isCloudEnabled: Boolean
        get() = firestore != null

    // Fallback Initial Data Lists mapped to domain models
    private val defaultRooms: List<RoomUnit> get() = InitialData.rooms.map { it.toDomain() }
    private val defaultResidents: List<Resident> get() = InitialData.residents.map { it.toDomain() }
    private val defaultPayments: List<Payment> get() = InitialData.payments.map { it.toDomain() }
    private val defaultMeters: List<ElectricityMeter> get() = InitialData.meters.map { it.toDomain() }
    private val defaultTokens: List<ElectricityToken> get() = InitialData.tokens.map { it.toDomain() }
    private val defaultTickets: List<MaintenanceTicket> get() = InitialData.tickets.map { it.toDomain() }
    private val defaultFeedbacks: List<ServiceFeedback> get() = InitialData.feedbacks.map { it.toDomain() }
    private val defaultSurveys: List<SatisfactionSurvey> get() = InitialData.surveys.map { it.toDomain() }
    private val defaultNotifications: List<AppNotification> get() = InitialData.notifications.map { it.toDomain() }

    // =========================================================================
    // Real-Time Reactive Snapshot Flows (Multi-User Live Synchronization)
    // =========================================================================

    val allRooms: Flow<List<RoomUnit>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(defaultRooms)
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("rooms").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null || snapshot.isEmpty) {
                trySend(defaultRooms)
                return@addSnapshotListener
            }
            val list = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    RoomUnit(
                        id = doc.id,
                        roomNumber = doc.getString("roomNumber") ?: "",
                        type = UnitType.valueOf(doc.getString("type") ?: UnitType.STANDARD.name),
                        floor = doc.getLong("floor")?.toInt() ?: 1,
                        monthlyRate = doc.getDouble("monthlyRate") ?: 3000000.0,
                        status = UnitStatus.valueOf(doc.getString("status") ?: UnitStatus.VACANT.name),
                        amenities = (doc.get("amenities") as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList(),
                        sizeSqm = doc.getDouble("sizeSqm") ?: 20.0,
                        electricityMeterId = doc.getString("electricityMeterId") ?: "",
                        currentResidentId = doc.getString("currentResidentId"),
                        currentResidentName = doc.getString("currentResidentName"),
                        notes = doc.getString("notes") ?: ""
                    )
                }.getOrNull()
            }
            trySend(if (list.isNotEmpty()) list else defaultRooms)
        }
        awaitClose { listener.remove() }
    }

    val allResidents: Flow<List<Resident>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(defaultResidents)
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("residents").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null || snapshot.isEmpty) {
                trySend(defaultResidents)
                return@addSnapshotListener
            }
            val list = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    Resident(
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
                        status = ResidentStatus.valueOf(doc.getString("status") ?: ResidentStatus.ACTIVE.name),
                        avatarIndex = doc.getLong("avatarIndex")?.toInt() ?: 0
                    )
                }.getOrNull()
            }
            trySend(if (list.isNotEmpty()) list else defaultResidents)
        }
        awaitClose { listener.remove() }
    }

    val allPayments: Flow<List<Payment>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(defaultPayments)
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("payments").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null || snapshot.isEmpty) {
                trySend(defaultPayments)
                return@addSnapshotListener
            }
            val list = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    Payment(
                        id = doc.id,
                        residentId = doc.getString("residentId") ?: "",
                        residentName = doc.getString("residentName") ?: "",
                        roomNumber = doc.getString("roomNumber") ?: "",
                        amount = doc.getDouble("amount") ?: 0.0,
                        type = PaymentType.valueOf(doc.getString("type") ?: PaymentType.RENT.name),
                        status = PaymentStatus.valueOf(doc.getString("status") ?: PaymentStatus.PAID.name),
                        date = doc.getString("date") ?: "",
                        dueDate = doc.getString("dueDate") ?: "",
                        paymentMethod = PaymentMethod.valueOf(doc.getString("paymentMethod") ?: PaymentMethod.BANK_TRANSFER.name),
                        receiptRef = doc.getString("receiptRef") ?: "",
                        notes = doc.getString("notes") ?: ""
                    )
                }.getOrNull()
            }
            trySend(if (list.isNotEmpty()) list else defaultPayments)
        }
        awaitClose { listener.remove() }
    }

    val allMeters: Flow<List<ElectricityMeter>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(defaultMeters)
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("electricity_meters").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null || snapshot.isEmpty) {
                trySend(defaultMeters)
                return@addSnapshotListener
            }
            val list = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    ElectricityMeter(
                        id = doc.id,
                        roomNumber = doc.getString("roomNumber") ?: "",
                        meterNumber = doc.getString("meterNumber") ?: "",
                        lastReadingKwh = doc.getDouble("lastReadingKwh") ?: 0.0,
                        currentReadingKwh = doc.getDouble("currentReadingKwh") ?: 0.0,
                        readingDate = doc.getString("readingDate") ?: "",
                        tariffPerKwh = doc.getDouble("tariffPerKwh") ?: 1699.53,
                        isBilled = doc.getBoolean("isBilled") ?: false
                    )
                }.getOrNull()
            }
            trySend(if (list.isNotEmpty()) list else defaultMeters)
        }
        awaitClose { listener.remove() }
    }

    val allTokens: Flow<List<ElectricityToken>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(defaultTokens)
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("electricity_tokens").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null || snapshot.isEmpty) {
                trySend(defaultTokens)
                return@addSnapshotListener
            }
            val list = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    ElectricityToken(
                        id = doc.id,
                        roomNumber = doc.getString("roomNumber") ?: "",
                        meterNumber = doc.getString("meterNumber") ?: "",
                        tokenCode = doc.getString("tokenCode") ?: "",
                        amountRp = doc.getDouble("amountRp") ?: 0.0,
                        kwhAmount = doc.getDouble("kwhAmount") ?: 0.0,
                        generatedAt = doc.getString("generatedAt") ?: "",
                        issuedBy = doc.getString("issuedBy") ?: "",
                        status = TokenStatus.valueOf(doc.getString("status") ?: TokenStatus.ISSUED.name),
                        residentName = doc.getString("residentName") ?: ""
                    )
                }.getOrNull()
            }
            trySend(if (list.isNotEmpty()) list else defaultTokens)
        }
        awaitClose { listener.remove() }
    }

    val allTickets: Flow<List<MaintenanceTicket>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(defaultTickets)
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("maintenance_tickets").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null || snapshot.isEmpty) {
                trySend(defaultTickets)
                return@addSnapshotListener
            }
            val list = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    MaintenanceTicket(
                        id = doc.id,
                        roomNumber = doc.getString("roomNumber") ?: "",
                        residentId = doc.getString("residentId") ?: "",
                        residentName = doc.getString("residentName") ?: "",
                        title = doc.getString("title") ?: "",
                        category = MaintenanceCategory.valueOf(doc.getString("category") ?: MaintenanceCategory.OTHER.name),
                        description = doc.getString("description") ?: "",
                        priority = MaintenancePriority.valueOf(doc.getString("priority") ?: MaintenancePriority.MEDIUM.name),
                        status = MaintenanceStatus.valueOf(doc.getString("status") ?: MaintenanceStatus.REPORTED.name),
                        reportedDate = doc.getString("reportedDate") ?: "",
                        resolvedDate = doc.getString("resolvedDate"),
                        assignedTechnician = doc.getString("assignedTechnician"),
                        estimatedCost = doc.getDouble("estimatedCost"),
                        photoEvidenceDesc = doc.getString("photoEvidenceDesc"),
                        notes = doc.getString("notes")
                    )
                }.getOrNull()
            }
            trySend(if (list.isNotEmpty()) list else defaultTickets)
        }
        awaitClose { listener.remove() }
    }

    val allFeedbacks: Flow<List<ServiceFeedback>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(defaultFeedbacks)
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("service_feedbacks").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null || snapshot.isEmpty) {
                trySend(defaultFeedbacks)
                return@addSnapshotListener
            }
            val list = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    ServiceFeedback(
                        id = doc.id,
                        ticketId = doc.getString("ticketId") ?: "",
                        ticketTitle = doc.getString("ticketTitle") ?: "",
                        residentId = doc.getString("residentId") ?: "",
                        residentName = doc.getString("residentName") ?: "",
                        roomNumber = doc.getString("roomNumber") ?: "",
                        technicianName = doc.getString("technicianName"),
                        rating = doc.getLong("rating")?.toInt() ?: 5,
                        aspects = (doc.get("aspects") as? List<*>)?.mapNotNull { it?.toString() } ?: emptyList(),
                        comment = doc.getString("comment") ?: "",
                        createdAt = doc.getString("createdAt") ?: ""
                    )
                }.getOrNull()
            }
            trySend(if (list.isNotEmpty()) list else defaultFeedbacks)
        }
        awaitClose { listener.remove() }
    }

    val allSurveys: Flow<List<SatisfactionSurvey>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(defaultSurveys)
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("satisfaction_surveys").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null || snapshot.isEmpty) {
                trySend(defaultSurveys)
                return@addSnapshotListener
            }
            val list = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    SatisfactionSurvey(
                        id = doc.id,
                        residentId = doc.getString("residentId") ?: "",
                        residentName = doc.getString("residentName") ?: "",
                        roomNumber = doc.getString("roomNumber") ?: "",
                        surveyPeriod = doc.getString("surveyPeriod") ?: "",
                        overallRating = doc.getLong("overallRating")?.toInt() ?: 5,
                        cleanlinessRating = doc.getLong("cleanlinessRating")?.toInt() ?: 5,
                        staffResponsivenessRating = doc.getLong("staffResponsivenessRating")?.toInt() ?: 5,
                        amenitiesRating = doc.getLong("amenitiesRating")?.toInt() ?: 5,
                        securityRating = doc.getLong("securityRating")?.toInt() ?: 5,
                        favoriteAspect = doc.getString("favoriteAspect") ?: "",
                        suggestions = doc.getString("suggestions") ?: "",
                        submittedAt = doc.getString("submittedAt") ?: ""
                    )
                }.getOrNull()
            }
            trySend(if (list.isNotEmpty()) list else defaultSurveys)
        }
        awaitClose { listener.remove() }
    }

    val allNotifications: Flow<List<AppNotification>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(defaultNotifications)
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("notifications").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null || snapshot.isEmpty) {
                trySend(defaultNotifications)
                return@addSnapshotListener
            }
            val list = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    AppNotification(
                        id = doc.id,
                        recipientResidentId = doc.getString("recipientResidentId"),
                        recipientName = doc.getString("recipientName"),
                        title = doc.getString("title") ?: "",
                        message = doc.getString("message") ?: "",
                        category = NotificationCategory.valueOf(doc.getString("category") ?: NotificationCategory.ANNOUNCEMENT.name),
                        priority = NotificationPriority.valueOf(doc.getString("priority") ?: NotificationPriority.NORMAL.name),
                        timestamp = doc.getString("timestamp") ?: "",
                        isRead = doc.getBoolean("isRead") ?: false,
                        actionType = doc.getString("actionType")?.let { NotificationAction.valueOf(it) },
                        actionPayload = doc.getString("actionPayload")
                    )
                }.getOrNull()
            }
            trySend(if (list.isNotEmpty()) list else defaultNotifications)
        }
        awaitClose { listener.remove() }
    }

    // =========================================================================
    // Mutation Operations & Atomic Batch Sync
    // =========================================================================

    suspend fun ensureSeedData() {
        val ref = propertyRef ?: return
        runCatching {
            val testDoc = ref.collection("rooms").document("room_101").get().await()
            if (!testDoc.exists()) {
                val batch = firestore?.batch() ?: return

                defaultRooms.forEach { room ->
                    val roomMap = hashMapOf(
                        "id" to room.id,
                        "roomNumber" to room.roomNumber,
                        "type" to room.type.name,
                        "floor" to room.floor,
                        "monthlyRate" to room.monthlyRate,
                        "status" to room.status.name,
                        "amenities" to room.amenities,
                        "sizeSqm" to room.sizeSqm,
                        "electricityMeterId" to room.electricityMeterId,
                        "currentResidentId" to room.currentResidentId,
                        "currentResidentName" to room.currentResidentName,
                        "notes" to room.notes
                    )
                    batch.set(ref.collection("rooms").document(room.id), roomMap, SetOptions.merge())
                }

                defaultResidents.forEach { res ->
                    val resMap = hashMapOf(
                        "id" to res.id,
                        "fullName" to res.fullName,
                        "email" to res.email,
                        "phone" to res.phone,
                        "roomNumber" to res.roomNumber,
                        "moveInDate" to res.moveInDate,
                        "leaseEndDate" to res.leaseEndDate,
                        "monthlyRent" to res.monthlyRent,
                        "depositAmount" to res.depositAmount,
                        "outstandingDebt" to res.outstandingDebt,
                        "emergencyContact" to res.emergencyContact,
                        "emergencyPhone" to res.emergencyPhone,
                        "ktpNumber" to res.ktpNumber,
                        "status" to res.status.name,
                        "avatarIndex" to res.avatarIndex
                    )
                    batch.set(ref.collection("residents").document(res.id), resMap, SetOptions.merge())
                }

                defaultPayments.forEach { pay ->
                    val payMap = hashMapOf(
                        "id" to pay.id,
                        "residentId" to pay.residentId,
                        "residentName" to pay.residentName,
                        "roomNumber" to pay.roomNumber,
                        "amount" to pay.amount,
                        "type" to pay.type.name,
                        "status" to pay.status.name,
                        "date" to pay.date,
                        "dueDate" to pay.dueDate,
                        "paymentMethod" to pay.paymentMethod.name,
                        "receiptRef" to pay.receiptRef,
                        "notes" to pay.notes
                    )
                    batch.set(ref.collection("payments").document(pay.id), payMap, SetOptions.merge())
                }

                defaultTickets.forEach { ticket ->
                    val ticketMap = hashMapOf(
                        "id" to ticket.id,
                        "roomNumber" to ticket.roomNumber,
                        "residentId" to ticket.residentId,
                        "residentName" to ticket.residentName,
                        "title" to ticket.title,
                        "category" to ticket.category.name,
                        "description" to ticket.description,
                        "priority" to ticket.priority.name,
                        "status" to ticket.status.name,
                        "reportedDate" to ticket.reportedDate,
                        "resolvedDate" to ticket.resolvedDate,
                        "assignedTechnician" to ticket.assignedTechnician,
                        "estimatedCost" to ticket.estimatedCost,
                        "photoEvidenceDesc" to ticket.photoEvidenceDesc,
                        "notes" to ticket.notes
                    )
                    batch.set(ref.collection("maintenance_tickets").document(ticket.id), ticketMap, SetOptions.merge())
                }

                defaultNotifications.forEach { notif ->
                    val notifMap = hashMapOf(
                        "id" to notif.id,
                        "recipientResidentId" to notif.recipientResidentId,
                        "recipientName" to notif.recipientName,
                        "title" to notif.title,
                        "message" to notif.message,
                        "category" to notif.category.name,
                        "priority" to notif.priority.name,
                        "timestamp" to notif.timestamp,
                        "isRead" to notif.isRead,
                        "actionType" to notif.actionType?.name,
                        "actionPayload" to notif.actionPayload
                    )
                    batch.set(ref.collection("notifications").document(notif.id), notifMap, SetOptions.merge())
                }

                batch.commit().await()
            }
        }
    }

    suspend fun saveRoom(room: RoomUnit) {
        val ref = propertyRef ?: return
        val roomMap = hashMapOf(
            "id" to room.id,
            "roomNumber" to room.roomNumber,
            "type" to room.type.name,
            "floor" to room.floor,
            "monthlyRate" to room.monthlyRate,
            "status" to room.status.name,
            "amenities" to room.amenities,
            "sizeSqm" to room.sizeSqm,
            "electricityMeterId" to room.electricityMeterId,
            "currentResidentId" to room.currentResidentId,
            "currentResidentName" to room.currentResidentName,
            "notes" to room.notes
        )
        runCatching { ref.collection("rooms").document(room.id).set(roomMap, SetOptions.merge()).await() }
    }

    suspend fun updateRoomStatus(roomId: String, newStatus: UnitStatus) {
        val ref = propertyRef ?: return
        runCatching { ref.collection("rooms").document(roomId).update("status", newStatus.name).await() }
    }

    suspend fun deleteRoom(roomId: String) {
        val ref = propertyRef ?: return
        runCatching { ref.collection("rooms").document(roomId).delete().await() }
    }

    suspend fun saveResident(resident: Resident) {
        val ref = propertyRef ?: return
        val batch = firestore?.batch() ?: return
        val resMap = hashMapOf(
            "id" to resident.id,
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
        batch.set(ref.collection("residents").document(resident.id), resMap, SetOptions.merge())

        val roomQuery = runCatching {
            ref.collection("rooms").whereEqualTo("roomNumber", resident.roomNumber).get().await()
        }.getOrNull()

        roomQuery?.documents?.firstOrNull()?.let { doc ->
            batch.update(
                doc.reference,
                mapOf(
                    "status" to UnitStatus.OCCUPIED.name,
                    "currentResidentId" to resident.id,
                    "currentResidentName" to resident.fullName
                )
            )
        }

        runCatching { batch.commit().await() }
    }

    suspend fun deleteResident(residentId: String) {
        val ref = propertyRef ?: return
        runCatching { ref.collection("residents").document(residentId).delete().await() }
    }

    suspend fun savePayment(payment: Payment) {
        val ref = propertyRef ?: return
        val payMap = hashMapOf(
            "id" to payment.id,
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
        runCatching { ref.collection("payments").document(payment.id).set(payMap, SetOptions.merge()).await() }
    }

    suspend fun updatePayment(payment: Payment) {
        savePayment(payment)
    }

    suspend fun saveMeterReading(roomNumber: String, currentKwh: Double) {
        val ref = propertyRef ?: return
        val nowFormatted = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val meterId = "m_$roomNumber"
        val meterMap = hashMapOf(
            "id" to meterId,
            "roomNumber" to roomNumber,
            "meterNumber" to "PLN-$roomNumber-${Random.nextInt(10000, 99999)}",
            "lastReadingKwh" to currentKwh,
            "currentReadingKwh" to currentKwh,
            "readingDate" to nowFormatted,
            "tariffPerKwh" to 1699.53,
            "isBilled" to false
        )
        runCatching { ref.collection("electricity_meters").document(meterId).set(meterMap, SetOptions.merge()).await() }
    }

    suspend fun issueElectricityToken(
        roomNumber: String,
        amountRp: Double,
        residentName: String
    ): ElectricityToken {
        val ref = propertyRef
        val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
        val tariff = 1699.53
        val kwh = (amountRp / tariff)

        val part1 = Random.nextInt(1000, 9999)
        val part2 = Random.nextInt(1000, 9999)
        val part3 = Random.nextInt(1000, 9999)
        val part4 = Random.nextInt(1000, 9999)
        val part5 = Random.nextInt(1000, 9999)
        val tokenCode = "$part1-$part2-$part3-$part4-$part5"

        val token = ElectricityToken(
            id = "tok_${UUID.randomUUID().toString().take(8)}",
            roomNumber = roomNumber,
            meterNumber = "PLN-$roomNumber-00000",
            tokenCode = tokenCode,
            amountRp = amountRp,
            kwhAmount = kwh,
            generatedAt = nowFormatted,
            issuedBy = "Admin Lewi House",
            status = TokenStatus.ISSUED,
            residentName = residentName
        )

        if (ref != null) {
            val tokenMap = hashMapOf(
                "id" to token.id,
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
            runCatching { ref.collection("electricity_tokens").document(token.id).set(tokenMap).await() }
        }
        return token
    }

    suspend fun saveMaintenanceTicket(ticket: MaintenanceTicket) {
        val ref = propertyRef ?: return
        val ticketMap = hashMapOf(
            "id" to ticket.id,
            "roomNumber" to ticket.roomNumber,
            "residentId" to ticket.residentId,
            "residentName" to ticket.residentName,
            "title" to ticket.title,
            "category" to ticket.category.name,
            "description" to ticket.description,
            "priority" to ticket.priority.name,
            "status" to ticket.status.name,
            "reportedDate" to ticket.reportedDate,
            "resolvedDate" to ticket.resolvedDate,
            "assignedTechnician" to ticket.assignedTechnician,
            "estimatedCost" to ticket.estimatedCost,
            "photoEvidenceDesc" to ticket.photoEvidenceDesc,
            "notes" to ticket.notes
        )
        runCatching { ref.collection("maintenance_tickets").document(ticket.id).set(ticketMap, SetOptions.merge()).await() }
    }

    suspend fun updateMaintenanceTicket(ticket: MaintenanceTicket) {
        saveMaintenanceTicket(ticket)
    }

    suspend fun executeRoomTransfer(calculation: RoomTransferCalculation) {
        val ref = propertyRef ?: return
        val batch = firestore?.batch() ?: return

        // 1. Vacate old room
        val oldRoomQuery = runCatching {
            ref.collection("rooms").whereEqualTo("roomNumber", calculation.fromRoomNumber).get().await()
        }.getOrNull()

        oldRoomQuery?.documents?.firstOrNull()?.let { doc ->
            batch.update(
                doc.reference,
                mapOf(
                    "status" to UnitStatus.VACANT.name,
                    "currentResidentId" to null,
                    "currentResidentName" to null
                )
            )
        }

        // 2. Assign new room
        val newRoomQuery = runCatching {
            ref.collection("rooms").whereEqualTo("roomNumber", calculation.toRoomNumber).get().await()
        }.getOrNull()

        newRoomQuery?.documents?.firstOrNull()?.let { doc ->
            batch.update(
                doc.reference,
                mapOf(
                    "status" to UnitStatus.OCCUPIED.name,
                    "currentResidentId" to calculation.residentId,
                    "currentResidentName" to calculation.residentName
                )
            )
        }

        // 3. Update resident document
        val resDoc = ref.collection("residents").document(calculation.residentId)
        batch.update(
            resDoc,
            mapOf(
                "roomNumber" to calculation.toRoomNumber,
                "monthlyRent" to calculation.toRoomMonthlyRate,
                "depositAmount" to calculation.requiredNewDeposit,
                "outstandingDebt" to if (calculation.isPayable()) calculation.totalNetPayableOrRefund else 0.0
            )
        )

        // 4. Record transfer transaction ledger
        val nowFormatted = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val transferPayment = Payment(
            id = "pay_trf_${UUID.randomUUID().toString().take(8)}",
            residentId = calculation.residentId,
            residentName = calculation.residentName,
            roomNumber = calculation.toRoomNumber,
            amount = calculation.totalNetPayableOrRefund,
            type = PaymentType.TRANSFER_ADJUSTMENT,
            status = if (calculation.isPayable()) PaymentStatus.PENDING else PaymentStatus.PAID,
            date = nowFormatted,
            dueDate = nowFormatted,
            paymentMethod = PaymentMethod.BANK_TRANSFER,
            receiptRef = "TRF-${calculation.fromRoomNumber}-TO-${calculation.toRoomNumber}",
            notes = "Prorated Room Transfer (${calculation.daysOccupiedInOldRoom}d used in Room ${calculation.fromRoomNumber}, ${calculation.remainingDaysInBillingCycle}d in Room ${calculation.toRoomNumber})"
        )

        val payMap = hashMapOf(
            "id" to transferPayment.id,
            "residentId" to transferPayment.residentId,
            "residentName" to transferPayment.residentName,
            "roomNumber" to transferPayment.roomNumber,
            "amount" to transferPayment.amount,
            "type" to transferPayment.type.name,
            "status" to transferPayment.status.name,
            "date" to transferPayment.date,
            "dueDate" to transferPayment.dueDate,
            "paymentMethod" to transferPayment.paymentMethod.name,
            "receiptRef" to transferPayment.receiptRef,
            "notes" to transferPayment.notes
        )
        batch.set(ref.collection("payments").document(transferPayment.id), payMap)

        runCatching { batch.commit().await() }
    }

    suspend fun saveServiceFeedback(feedback: ServiceFeedback) {
        val ref = propertyRef ?: return
        val fbMap = hashMapOf(
            "id" to feedback.id,
            "ticketId" to feedback.ticketId,
            "ticketTitle" to feedback.ticketTitle,
            "residentId" to feedback.residentId,
            "residentName" to feedback.residentName,
            "roomNumber" to feedback.roomNumber,
            "technicianName" to feedback.technicianName,
            "rating" to feedback.rating,
            "aspects" to feedback.aspects,
            "comment" to feedback.comment,
            "createdAt" to feedback.createdAt
        )
        runCatching { ref.collection("service_feedbacks").document(feedback.id).set(fbMap).await() }
    }

    suspend fun saveSatisfactionSurvey(survey: SatisfactionSurvey) {
        val ref = propertyRef ?: return
        val surveyMap = hashMapOf(
            "id" to survey.id,
            "residentId" to survey.residentId,
            "residentName" to survey.residentName,
            "roomNumber" to survey.roomNumber,
            "surveyPeriod" to survey.surveyPeriod,
            "overallRating" to survey.overallRating,
            "cleanlinessRating" to survey.cleanlinessRating,
            "staffResponsivenessRating" to survey.staffResponsivenessRating,
            "amenitiesRating" to survey.amenitiesRating,
            "securityRating" to survey.securityRating,
            "favoriteAspect" to survey.favoriteAspect,
            "suggestions" to survey.suggestions,
            "submittedAt" to survey.submittedAt
        )
        runCatching { ref.collection("satisfaction_surveys").document(survey.id).set(surveyMap).await() }
    }

    suspend fun sendNotification(notification: AppNotification) {
        val ref = propertyRef ?: return
        val notifMap = hashMapOf(
            "id" to notification.id,
            "recipientResidentId" to notification.recipientResidentId,
            "recipientName" to notification.recipientName,
            "title" to notification.title,
            "message" to notification.message,
            "category" to notification.category.name,
            "priority" to notification.priority.name,
            "timestamp" to notification.timestamp,
            "isRead" to notification.isRead,
            "actionType" to notification.actionType?.name,
            "actionPayload" to notification.actionPayload
        )
        runCatching { ref.collection("notifications").document(notification.id).set(notifMap).await() }
    }

    suspend fun markNotificationAsRead(notificationId: String) {
        val ref = propertyRef ?: return
        runCatching { ref.collection("notifications").document(notificationId).update("isRead", true).await() }
    }

    suspend fun markAllNotificationsAsRead(residentId: String?) {
        val ref = propertyRef ?: return
        runCatching {
            val query = if (residentId != null) {
                ref.collection("notifications").whereEqualTo("recipientResidentId", residentId).get().await()
            } else {
                ref.collection("notifications").get().await()
            }
            val batch = firestore?.batch() ?: return@runCatching
            query.documents.forEach { doc ->
                batch.update(doc.reference, "isRead", true)
            }
            batch.commit().await()
        }
    }

    suspend fun deleteNotification(notificationId: String) {
        val ref = propertyRef ?: return
        runCatching { ref.collection("notifications").document(notificationId).delete().await() }
    }

    // =========================================================================
    // Real-Time Reactive Chat Snapshot Flows
    // =========================================================================

    fun getChatMessagesFlow(tenantId: String): Flow<List<ChatMessage>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("chats")
            .document(tenantId)
            .collection("messages")
            .orderBy("timestamp")
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }

                val list = snapshot.documents.mapNotNull { doc ->
                    try {
                        ChatMessage(
                            id = doc.getString("id") ?: doc.id,
                            tenantId = doc.getString("tenantId") ?: tenantId,
                            senderId = doc.getString("senderId") ?: "",
                            senderName = doc.getString("senderName") ?: "",
                            senderRole = try {
                                ChatSenderRole.valueOf(doc.getString("senderRole") ?: "TENANT")
                            } catch (_: Exception) { ChatSenderRole.TENANT },
                            text = doc.getString("text") ?: "",
                            timestamp = doc.getString("timestamp") ?: "",
                            isRead = doc.getBoolean("isRead") ?: false,
                            readByAdmin = doc.getBoolean("readByAdmin") ?: false,
                            readByTenant = doc.getBoolean("readByTenant") ?: false
                        )
                    } catch (_: Exception) {
                        null
                    }
                }
                trySend(list)
            }

        awaitClose { listener.remove() }
    }

    fun getAllChatThreadsFlow(): Flow<List<ChatThread>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("chat_threads")
            .orderBy("lastTimestamp", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null || snapshot == null) {
                    trySend(emptyList())
                    return@addSnapshotListener
                }

                val list = snapshot.documents.mapNotNull { doc ->
                    try {
                        ChatThread(
                            tenantId = doc.getString("tenantId") ?: doc.id,
                            tenantName = doc.getString("tenantName") ?: "Penghuni",
                            roomNumber = doc.getString("roomNumber"),
                            lastMessage = doc.getString("lastMessage"),
                            lastTimestamp = doc.getString("lastTimestamp"),
                            unreadCount = (doc.getLong("unreadCount") ?: 0L).toInt()
                        )
                    } catch (_: Exception) {
                        null
                    }
                }
                trySend(list)
            }

        awaitClose { listener.remove() }
    }

    suspend fun sendChatMessage(message: ChatMessage) {
        val ref = propertyRef ?: return
        val msgMap = hashMapOf(
            "id" to message.id,
            "tenantId" to message.tenantId,
            "senderId" to message.senderId,
            "senderName" to message.senderName,
            "senderRole" to message.senderRole.name,
            "text" to message.text,
            "timestamp" to message.timestamp,
            "isRead" to message.isRead,
            "readByAdmin" to message.readByAdmin,
            "readByTenant" to message.readByTenant
        )

        runCatching {
            // Save message to chat subcollection
            ref.collection("chats")
                .document(message.tenantId)
                .collection("messages")
                .document(message.id)
                .set(msgMap)
                .await()

            // Update thread metadata
            val threadMap = hashMapOf(
                "tenantId" to message.tenantId,
                "tenantName" to (if (message.senderRole == ChatSenderRole.TENANT) message.senderName else "Penghuni"),
                "lastMessage" to message.text,
                "lastTimestamp" to message.timestamp,
                "unreadCount" to if (message.senderRole == ChatSenderRole.TENANT) 1L else 0L
            )
            ref.collection("chat_threads")
                .document(message.tenantId)
                .set(threadMap, SetOptions.merge())
                .await()

            // Send notification to the other party
            val notif = AppNotification(
                id = UUID.randomUUID().toString(),
                recipientResidentId = if (message.senderRole == ChatSenderRole.ADMIN) message.tenantId else null,
                recipientName = if (message.senderRole == ChatSenderRole.ADMIN) null else "Admin",
                title = if (message.senderRole == ChatSenderRole.ADMIN) "Pesan dari Pengelola" else "Pesan dari ${message.senderName}",
                message = message.text.take(120),
                category = NotificationCategory.CHAT,
                priority = NotificationPriority.IMPORTANT,
                timestamp = message.timestamp,
                isRead = false,
                actionType = NotificationAction.OPEN_CHAT,
                actionPayload = message.tenantId
            )
            sendNotification(notif)
        }
    }

    suspend fun markChatMessagesAsRead(tenantId: String, byAdmin: Boolean) {
        val ref = propertyRef ?: return
        runCatching {
            val fieldToUpdate = if (byAdmin) "readByAdmin" else "readByTenant"
            val query = ref.collection("chats")
                .document(tenantId)
                .collection("messages")
                .whereEqualTo(fieldToUpdate, false)
                .get()
                .await()

            val batch = firestore?.batch() ?: return@runCatching
            query.documents.forEach { doc ->
                batch.update(doc.reference, fieldToUpdate, true)
                batch.update(doc.reference, "isRead", true)
            }

            if (byAdmin) {
                val threadRef = ref.collection("chat_threads").document(tenantId)
                batch.update(threadRef, "unreadCount", 0L)
            }

            batch.commit().await()
        }
    }
}
