package com.example.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface RoomDao {
    @Query("SELECT * FROM rooms ORDER BY floor ASC, roomNumber ASC")
    fun getAllRooms(): Flow<List<RoomEntity>>

    @Query("SELECT * FROM rooms WHERE id = :id LIMIT 1")
    suspend fun getRoomById(id: String): RoomEntity?

    @Query("SELECT * FROM rooms WHERE roomNumber = :roomNumber LIMIT 1")
    suspend fun getRoomByNumber(roomNumber: String): RoomEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRoom(room: RoomEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRooms(rooms: List<RoomEntity>)

    @Update
    suspend fun updateRoom(room: RoomEntity)

    @Query("DELETE FROM rooms WHERE id = :id")
    suspend fun deleteRoomById(id: String)
}

@Dao
interface ResidentDao {
    @Query("SELECT * FROM residents ORDER BY roomNumber ASC")
    fun getAllResidents(): Flow<List<ResidentEntity>>

    @Query("SELECT * FROM residents WHERE id = :id LIMIT 1")
    suspend fun getResidentById(id: String): ResidentEntity?

    @Query("SELECT * FROM residents WHERE roomNumber = :identifier OR email = :identifier OR phone = :identifier LIMIT 1")
    suspend fun findResidentByIdentifier(identifier: String): ResidentEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertResident(resident: ResidentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertResidents(residents: List<ResidentEntity>)

    @Update
    suspend fun updateResident(resident: ResidentEntity)

    @Query("DELETE FROM residents WHERE id = :id")
    suspend fun deleteResidentById(id: String)
}

@Dao
interface PaymentDao {
    @Query("SELECT * FROM payments ORDER BY date DESC")
    fun getAllPayments(): Flow<List<PaymentEntity>>

    @Query("SELECT * FROM payments WHERE residentId = :residentId ORDER BY date DESC")
    fun getPaymentsByResidentId(residentId: String): Flow<List<PaymentEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayment(payment: PaymentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPayments(payments: List<PaymentEntity>)

    @Update
    suspend fun updatePayment(payment: PaymentEntity)

    @Query("DELETE FROM payments WHERE id = :id")
    suspend fun deletePaymentById(id: String)
}

@Dao
interface ElectricityMeterDao {
    @Query("SELECT * FROM electricity_meters ORDER BY roomNumber ASC")
    fun getAllMeters(): Flow<List<ElectricityMeterEntity>>

    @Query("SELECT * FROM electricity_meters WHERE roomNumber = :roomNumber LIMIT 1")
    suspend fun getMeterByRoom(roomNumber: String): ElectricityMeterEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMeter(meter: ElectricityMeterEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMeters(meters: List<ElectricityMeterEntity>)

    @Update
    suspend fun updateMeter(meter: ElectricityMeterEntity)
}

@Dao
interface ElectricityTokenDao {
    @Query("SELECT * FROM electricity_tokens ORDER BY generatedAt DESC")
    fun getAllTokens(): Flow<List<ElectricityTokenEntity>>

    @Query("SELECT * FROM electricity_tokens WHERE roomNumber = :roomNumber ORDER BY generatedAt DESC")
    fun getTokensByRoom(roomNumber: String): Flow<List<ElectricityTokenEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertToken(token: ElectricityTokenEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTokens(tokens: List<ElectricityTokenEntity>)

    @Update
    suspend fun updateToken(token: ElectricityTokenEntity)
}

@Dao
interface MaintenanceTicketDao {
    @Query("SELECT * FROM maintenance_tickets ORDER BY reportedDate DESC")
    fun getAllTickets(): Flow<List<MaintenanceTicketEntity>>

    @Query("SELECT * FROM maintenance_tickets WHERE residentId = :residentId ORDER BY reportedDate DESC")
    fun getTicketsByResident(residentId: String): Flow<List<MaintenanceTicketEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTicket(ticket: MaintenanceTicketEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTickets(tickets: List<MaintenanceTicketEntity>)

    @Update
    suspend fun updateTicket(ticket: MaintenanceTicketEntity)

    @Query("DELETE FROM maintenance_tickets WHERE id = :id")
    suspend fun deleteTicketById(id: String)
}

@Dao
interface ServiceFeedbackDao {
    @Query("SELECT * FROM service_feedbacks ORDER BY createdAt DESC")
    fun getAllFeedbacks(): Flow<List<ServiceFeedbackEntity>>

    @Query("SELECT * FROM service_feedbacks WHERE ticketId = :ticketId LIMIT 1")
    suspend fun getFeedbackByTicketId(ticketId: String): ServiceFeedbackEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFeedback(feedback: ServiceFeedbackEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFeedbacks(feedbacks: List<ServiceFeedbackEntity>)
}

@Dao
interface SatisfactionSurveyDao {
    @Query("SELECT * FROM satisfaction_surveys ORDER BY submittedAt DESC")
    fun getAllSurveys(): Flow<List<SatisfactionSurveyEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSurvey(survey: SatisfactionSurveyEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSurveys(surveys: List<SatisfactionSurveyEntity>)
}

@Dao
interface AppNotificationDao {
    @Query("SELECT * FROM app_notifications ORDER BY timestamp DESC")
    fun getAllNotifications(): Flow<List<AppNotificationEntity>>

    @Query("SELECT * FROM app_notifications WHERE recipientResidentId IS NULL OR recipientResidentId = :residentId ORDER BY timestamp DESC")
    fun getNotificationsForResident(residentId: String): Flow<List<AppNotificationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotification(notification: AppNotificationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNotifications(notifications: List<AppNotificationEntity>)

    @Query("UPDATE app_notifications SET isRead = 1 WHERE id = :id")
    suspend fun markAsRead(id: String)

    @Query("UPDATE app_notifications SET isRead = 1 WHERE recipientResidentId IS NULL OR recipientResidentId = :residentId")
    suspend fun markAllAsReadForResident(residentId: String)

    @Query("UPDATE app_notifications SET isRead = 1")
    suspend fun markAllAsRead()

    @Query("DELETE FROM app_notifications WHERE id = :id")
    suspend fun deleteNotification(id: String)
}

@Dao
interface PendingMutationDao {
    @Query("SELECT * FROM pending_mutations ORDER BY createdAt ASC")
    fun getAllPendingMutationsFlow(): Flow<List<PendingMutationEntity>>

    @Query("SELECT * FROM pending_mutations ORDER BY createdAt ASC")
    suspend fun getAllPendingMutations(): List<PendingMutationEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMutation(mutation: PendingMutationEntity)

    @Query("DELETE FROM pending_mutations WHERE id = :id")
    suspend fun deleteMutationById(id: String)

    @Query("UPDATE pending_mutations SET retryCount = retryCount + 1 WHERE id = :id")
    suspend fun incrementRetryCount(id: String)

    @Query("DELETE FROM pending_mutations")
    suspend fun clearAll()
}


