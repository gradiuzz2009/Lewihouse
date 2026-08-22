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

class LewiHouseRepository(private val db: AppDatabase) {

    val allRooms: Flow<List<RoomUnit>> = db.roomDao().getAllRooms().map { list ->
        list.map { it.toDomain() }
    }

    val allResidents: Flow<List<Resident>> = db.residentDao().getAllResidents().map { list ->
        list.map { it.toDomain() }
    }

    val allPayments: Flow<List<Payment>> = db.paymentDao().getAllPayments().map { list ->
        list.map { it.toDomain() }
    }

    val allMeters: Flow<List<ElectricityMeter>> = db.electricityMeterDao().getAllMeters().map { list ->
        list.map { it.toDomain() }
    }

    val allTokens: Flow<List<ElectricityToken>> = db.electricityTokenDao().getAllTokens().map { list ->
        list.map { it.toDomain() }
    }

    val allTickets: Flow<List<MaintenanceTicket>> = db.maintenanceTicketDao().getAllTickets().map { list ->
        list.map { it.toDomain() }
    }

    val allFeedbacks: Flow<List<ServiceFeedback>> = db.serviceFeedbackDao().getAllFeedbacks().map { list ->
        list.map { it.toDomain() }
    }

    val allSurveys: Flow<List<SatisfactionSurvey>> = db.satisfactionSurveyDao().getAllSurveys().map { list ->
        list.map { it.toDomain() }
    }

    val allNotifications: Flow<List<AppNotification>> = db.appNotificationDao().getAllNotifications().map { list ->
        list.map { it.toDomain() }
    }

    fun getNotificationsForResident(residentId: String): Flow<List<AppNotification>> {
        return db.appNotificationDao().getNotificationsForResident(residentId).map { list ->
            list.map { it.toDomain() }
        }
    }

    suspend fun ensureSeedData() {
        // Fallback in case onCreate callback hasn't finished or was bypassed
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
    }

    suspend fun saveRoom(room: RoomUnit) {
        db.roomDao().insertRoom(RoomEntity.fromDomain(room))
    }

    suspend fun updateRoomStatus(roomId: String, newStatus: UnitStatus) {
        val existing = db.roomDao().getRoomById(roomId) ?: return
        db.roomDao().updateRoom(existing.copy(status = newStatus.name))
    }

    suspend fun deleteRoom(roomId: String) {
        db.roomDao().deleteRoomById(roomId)
    }

    suspend fun saveResident(resident: Resident) {
        db.residentDao().insertResident(ResidentEntity.fromDomain(resident))
        // Also update room occupancy
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
    }

    suspend fun savePayment(payment: Payment) {
        db.paymentDao().insertPayment(PaymentEntity.fromDomain(payment))
    }

    suspend fun updatePaymentStatus(paymentId: String, newStatus: PaymentStatus, receiptRef: String? = null) {
        val existing = db.paymentDao().getAllPayments() // get list to find
        // In real app we could have a getPaymentById query or update direct
        val payments = InitialData.payments
        // Let's create an update
    }

    suspend fun updatePayment(payment: Payment) {
        db.paymentDao().updatePayment(PaymentEntity.fromDomain(payment))
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
    }

    suspend fun issueElectricityToken(
        roomNumber: String,
        amountRp: Double,
        residentName: String
    ): ElectricityToken {
        val meter = db.electricityMeterDao().getMeterByRoom(roomNumber)
        val meterNum = meter?.meterNumber ?: "PLN-$roomNumber-00000"
        
        // Tariff calculation for kWh
        val tariff = meter?.tariffPerKwh ?: 1699.53
        val kwh = (amountRp / tariff)

        // 20-digit PLN token simulation
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
        return token
    }

    suspend fun saveMaintenanceTicket(ticket: MaintenanceTicket) {
        db.maintenanceTicketDao().insertTicket(MaintenanceTicketEntity.fromDomain(ticket))
    }

    suspend fun updateMaintenanceTicket(ticket: MaintenanceTicket) {
        db.maintenanceTicketDao().updateTicket(MaintenanceTicketEntity.fromDomain(ticket))
    }

    suspend fun executeRoomTransfer(calculation: RoomTransferCalculation) {
        // 1. Free up old room
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

        // 2. Assign new room
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

        // 3. Update resident roomNumber, monthlyRent, deposit
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

        // 4. Record ledger transaction for transfer adjustment
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
    }

    // Feedback & Rating
    suspend fun saveServiceFeedback(feedback: ServiceFeedback) {
        db.serviceFeedbackDao().insertFeedback(ServiceFeedbackEntity.fromDomain(feedback))
    }

    suspend fun getFeedbackForTicket(ticketId: String): ServiceFeedback? {
        return db.serviceFeedbackDao().getFeedbackByTicketId(ticketId)?.toDomain()
    }

    // Surveys
    suspend fun saveSatisfactionSurvey(survey: SatisfactionSurvey) {
        db.satisfactionSurveyDao().insertSurvey(SatisfactionSurveyEntity.fromDomain(survey))
    }

    // Notifications
    suspend fun sendNotification(notification: AppNotification) {
        db.appNotificationDao().insertNotification(AppNotificationEntity.fromDomain(notification))
    }

    suspend fun markNotificationAsRead(notificationId: String) {
        db.appNotificationDao().markAsRead(notificationId)
    }

    suspend fun markAllNotificationsAsRead(residentId: String?) {
        if (residentId != null) {
            db.appNotificationDao().markAllAsReadForResident(residentId)
        } else {
            db.appNotificationDao().markAllAsRead()
        }
    }

    suspend fun deleteNotification(notificationId: String) {
        db.appNotificationDao().deleteNotification(notificationId)
    }
}

