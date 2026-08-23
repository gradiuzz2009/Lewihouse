package com.example.data.repository

import com.example.data.local.*
import com.example.data.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import kotlin.random.Random

class LewiHouseRepository(
    private val db: AppDatabase,
    private val firestoreRepo: LewiHouseFirestoreRepository = LewiHouseFirestoreRepository(localDb = db)
) {

    val allRooms: Flow<List<RoomUnit>> = if (firestoreRepo.isCloudEnabled) {
        firestoreRepo.allRooms
    } else {
        db.roomDao().getAllRooms().map { list -> list.map { it.toDomain() } }
    }

    val allResidents: Flow<List<Resident>> = if (firestoreRepo.isCloudEnabled) {
        firestoreRepo.allResidents
    } else {
        db.residentDao().getAllResidents().map { list -> list.map { it.toDomain() } }
    }

    val allPayments: Flow<List<Payment>> = if (firestoreRepo.isCloudEnabled) {
        firestoreRepo.allPayments
    } else {
        db.paymentDao().getAllPayments().map { list -> list.map { it.toDomain() } }
    }

    val allMeters: Flow<List<ElectricityMeter>> = if (firestoreRepo.isCloudEnabled) {
        firestoreRepo.allMeters
    } else {
        db.electricityMeterDao().getAllMeters().map { list -> list.map { it.toDomain() } }
    }

    val allTokens: Flow<List<ElectricityToken>> = if (firestoreRepo.isCloudEnabled) {
        firestoreRepo.allTokens
    } else {
        db.electricityTokenDao().getAllTokens().map { list -> list.map { it.toDomain() } }
    }

    val allTickets: Flow<List<MaintenanceTicket>> = if (firestoreRepo.isCloudEnabled) {
        firestoreRepo.allTickets
    } else {
        db.maintenanceTicketDao().getAllTickets().map { list -> list.map { it.toDomain() } }
    }

    val allFeedbacks: Flow<List<ServiceFeedback>> = if (firestoreRepo.isCloudEnabled) {
        firestoreRepo.allFeedbacks
    } else {
        db.serviceFeedbackDao().getAllFeedbacks().map { list -> list.map { it.toDomain() } }
    }

    val allSurveys: Flow<List<SatisfactionSurvey>> = if (firestoreRepo.isCloudEnabled) {
        firestoreRepo.allSurveys
    } else {
        db.satisfactionSurveyDao().getAllSurveys().map { list -> list.map { it.toDomain() } }
    }

    val allNotifications: Flow<List<AppNotification>> = if (firestoreRepo.isCloudEnabled) {
        firestoreRepo.allNotifications
    } else {
        db.appNotificationDao().getAllNotifications().map { list -> list.map { it.toDomain() } }
    }

    suspend fun authenticateTenant(identifier: String): Resident? {
        return db.residentDao().findResidentByIdentifier(identifier.trim())?.toDomain()
    }

    suspend fun ensureSeedData() {
        // Seed Room DB
        val existingRooms = db.roomDao().getRoomById("room_101")
        if (existingRooms == null) {
            db.roomDao().insertRooms(InitialData.rooms)
            db.residentDao().insertResidents(InitialData.residents)
            db.paymentDao().insertPayments(InitialData.payments)
            db.electricityMeterDao().insertMeters(InitialData.meters)
            db.electricityTokenDao().insertTokens(InitialData.tokens)
            db.maintenanceTicketDao().insertTickets(InitialData.tickets)
            db.serviceFeedbackDao().insertFeedbacks(InitialData.feedbacks)
            db.satisfactionSurveyDao().insertSurveys(InitialData.surveys)
            db.appNotificationDao().insertNotifications(InitialData.notifications)
        }
        // Seed Cloud Firestore
        firestoreRepo.ensureSeedData()
    }

    suspend fun saveRoom(room: RoomUnit) {
        db.roomDao().insertRoom(RoomEntity.fromDomain(room))
        firestoreRepo.saveRoom(room)
    }

    suspend fun updateRoomStatus(roomId: String, newStatus: UnitStatus) {
        val existing = db.roomDao().getRoomById(roomId)
        if (existing != null) {
            db.roomDao().updateRoom(existing.copy(status = newStatus.name))
        }
        firestoreRepo.updateRoomStatus(roomId, newStatus)
    }

    suspend fun deleteRoom(roomId: String) {
        db.roomDao().deleteRoomById(roomId)
        firestoreRepo.deleteRoom(roomId)
    }

    suspend fun saveResident(resident: Resident) {
        db.residentDao().insertResident(ResidentEntity.fromDomain(resident))
        val room = db.roomDao().getRoomByNumber(resident.roomNumber)
        if (room != null) {
            db.roomDao().updateRoom(
                room.copy(
                    status = UnitStatus.OCCUPIED.name,
                    currentResidentId = resident.id,
                    currentResidentName = resident.fullName
                )
            )
        }
        firestoreRepo.saveResident(resident)
    }

    suspend fun deleteResident(residentId: String) {
        val resident = db.residentDao().getResidentById(residentId)
        if (resident != null) {
            val room = db.roomDao().getRoomByNumber(resident.roomNumber)
            if (room != null && room.currentResidentId == residentId) {
                db.roomDao().updateRoom(
                    room.copy(
                        status = UnitStatus.VACANT.name,
                        currentResidentId = null,
                        currentResidentName = null
                    )
                )
            }
        }
        db.residentDao().deleteResidentById(residentId)
        firestoreRepo.deleteResident(residentId)
    }

    suspend fun savePayment(payment: Payment) {
        db.paymentDao().insertPayment(PaymentEntity.fromDomain(payment))
        firestoreRepo.savePayment(payment)
    }

    suspend fun updatePayment(payment: Payment) {
        db.paymentDao().updatePayment(PaymentEntity.fromDomain(payment))
        firestoreRepo.updatePayment(payment)
    }

    suspend fun saveMeterReading(roomNumber: String, currentKwh: Double) {
        val existing = db.electricityMeterDao().getMeterByRoom(roomNumber)
        val nowFormatted = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        if (existing != null) {
            db.electricityMeterDao().updateMeter(
                existing.copy(
                    lastReadingKwh = existing.currentReadingKwh,
                    currentReadingKwh = currentKwh,
                    readingDate = nowFormatted,
                    isBilled = false
                )
            )
        } else {
            val meterId = "PLN-$roomNumber-${Random.nextInt(10000, 99999)}"
            db.electricityMeterDao().insertMeter(
                ElectricityMeterEntity(
                    id = "m_$roomNumber",
                    roomNumber = roomNumber,
                    meterNumber = meterId,
                    lastReadingKwh = currentKwh,
                    currentReadingKwh = currentKwh,
                    readingDate = nowFormatted,
                    tariffPerKwh = 1699.53,
                    isBilled = false
                )
            )
        }
        firestoreRepo.saveMeterReading(roomNumber, currentKwh)
    }

    suspend fun issueElectricityToken(
        roomNumber: String,
        amountRp: Double,
        residentName: String
    ): ElectricityToken {
        val meter = db.electricityMeterDao().getMeterByRoom(roomNumber)
        val meterNum = meter?.meterNumber ?: "PLN-$roomNumber-00000"
        val tariff = meter?.tariffPerKwh ?: 1699.53
        val kwh = (amountRp / tariff)

        val part1 = Random.nextInt(1000, 9999)
        val part2 = Random.nextInt(1000, 9999)
        val part3 = Random.nextInt(1000, 9999)
        val part4 = Random.nextInt(1000, 9999)
        val part5 = Random.nextInt(1000, 9999)
        val tokenCode = "$part1-$part2-$part3-$part4-$part5"

        val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
        val token = ElectricityToken(
            id = "tok_${UUID.randomUUID().toString().take(8)}",
            roomNumber = roomNumber,
            meterNumber = meterNum,
            tokenCode = tokenCode,
            amountRp = amountRp,
            kwhAmount = kwh,
            generatedAt = nowFormatted,
            issuedBy = "Admin Lewi House",
            status = TokenStatus.ISSUED,
            residentName = residentName
        )
        db.electricityTokenDao().insertToken(ElectricityTokenEntity.fromDomain(token))
        firestoreRepo.issueElectricityToken(roomNumber, amountRp, residentName)
        return token
    }

    suspend fun saveMaintenanceTicket(ticket: MaintenanceTicket) {
        db.maintenanceTicketDao().insertTicket(MaintenanceTicketEntity.fromDomain(ticket))
        firestoreRepo.saveMaintenanceTicket(ticket)
    }

    suspend fun updateMaintenanceTicket(ticket: MaintenanceTicket) {
        db.maintenanceTicketDao().updateTicket(MaintenanceTicketEntity.fromDomain(ticket))
        firestoreRepo.updateMaintenanceTicket(ticket)
    }

    suspend fun executeRoomTransfer(calculation: RoomTransferCalculation) {
        // Local Room DB
        val oldRoom = db.roomDao().getRoomByNumber(calculation.fromRoomNumber)
        if (oldRoom != null) {
            db.roomDao().updateRoom(
                oldRoom.copy(
                    status = UnitStatus.VACANT.name,
                    currentResidentId = null,
                    currentResidentName = null
                )
            )
        }

        val newRoom = db.roomDao().getRoomByNumber(calculation.toRoomNumber)
        if (newRoom != null) {
            db.roomDao().updateRoom(
                newRoom.copy(
                    status = UnitStatus.OCCUPIED.name,
                    currentResidentId = calculation.residentId,
                    currentResidentName = calculation.residentName
                )
            )
        }

        val resident = db.residentDao().getResidentById(calculation.residentId)
        if (resident != null) {
            val updatedResident = resident.copy(
                roomNumber = calculation.toRoomNumber,
                monthlyRent = calculation.toRoomMonthlyRate,
                depositAmount = calculation.requiredNewDeposit,
                outstandingDebt = if (calculation.isPayable()) calculation.totalNetPayableOrRefund else 0.0
            )
            db.residentDao().updateResident(updatedResident)
        }

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
        db.paymentDao().insertPayment(PaymentEntity.fromDomain(transferPayment))

        // Cloud Firestore Atomic Sync
        firestoreRepo.executeRoomTransfer(calculation)
    }

    suspend fun saveServiceFeedback(feedback: ServiceFeedback) {
        db.serviceFeedbackDao().insertFeedback(ServiceFeedbackEntity.fromDomain(feedback))
        firestoreRepo.saveServiceFeedback(feedback)
    }

    suspend fun getFeedbackForTicket(ticketId: String): ServiceFeedback? {
        return db.serviceFeedbackDao().getFeedbackByTicketId(ticketId)?.toDomain()
    }

    suspend fun saveSatisfactionSurvey(survey: SatisfactionSurvey) {
        db.satisfactionSurveyDao().insertSurvey(SatisfactionSurveyEntity.fromDomain(survey))
        firestoreRepo.saveSatisfactionSurvey(survey)
    }

    suspend fun sendNotification(notification: AppNotification) {
        db.appNotificationDao().insertNotification(AppNotificationEntity.fromDomain(notification))
        firestoreRepo.sendNotification(notification)
    }

    suspend fun markNotificationAsRead(notificationId: String) {
        db.appNotificationDao().markAsRead(notificationId)
        firestoreRepo.markNotificationAsRead(notificationId)
    }

    suspend fun markAllNotificationsAsRead(residentId: String?) {
        if (residentId != null) {
            db.appNotificationDao().markAllAsReadForResident(residentId)
        } else {
            db.appNotificationDao().markAllAsRead()
        }
        firestoreRepo.markAllNotificationsAsRead(residentId)
    }

    suspend fun deleteNotification(notificationId: String) {
        db.appNotificationDao().deleteNotification(notificationId)
        firestoreRepo.deleteNotification(notificationId)
    }
}

