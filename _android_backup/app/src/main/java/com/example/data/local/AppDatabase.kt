package com.example.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        RoomEntity::class,
        ResidentEntity::class,
        PaymentEntity::class,
        ElectricityMeterEntity::class,
        ElectricityTokenEntity::class,
        MaintenanceTicketEntity::class,
        ServiceFeedbackEntity::class,
        SatisfactionSurveyEntity::class,
        AppNotificationEntity::class,
        PendingMutationEntity::class
    ],
    version = 3,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun roomDao(): RoomDao
    abstract fun residentDao(): ResidentDao
    abstract fun paymentDao(): PaymentDao
    abstract fun electricityMeterDao(): ElectricityMeterDao
    abstract fun electricityTokenDao(): ElectricityTokenDao
    abstract fun maintenanceTicketDao(): MaintenanceTicketDao
    abstract fun serviceFeedbackDao(): ServiceFeedbackDao
    abstract fun satisfactionSurveyDao(): SatisfactionSurveyDao
    abstract fun appNotificationDao(): AppNotificationDao
    abstract fun pendingMutationDao(): PendingMutationDao


    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "lewi_house_database.db"
                ).addCallback(object : Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        CoroutineScope(Dispatchers.IO).launch {
                            val database = getInstance(context)
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
                }).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}

