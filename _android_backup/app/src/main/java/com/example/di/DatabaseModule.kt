package com.example.di

import android.content.Context
import com.example.data.local.*
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return AppDatabase.getInstance(context)
    }

    @Provides
    fun provideRoomDao(db: AppDatabase): RoomDao = db.roomDao()

    @Provides
    fun provideResidentDao(db: AppDatabase): ResidentDao = db.residentDao()

    @Provides
    fun providePaymentDao(db: AppDatabase): PaymentDao = db.paymentDao()

    @Provides
    fun provideElectricityMeterDao(db: AppDatabase): ElectricityMeterDao = db.electricityMeterDao()

    @Provides
    fun provideElectricityTokenDao(db: AppDatabase): ElectricityTokenDao = db.electricityTokenDao()

    @Provides
    fun provideMaintenanceTicketDao(db: AppDatabase): MaintenanceTicketDao = db.maintenanceTicketDao()

    @Provides
    fun provideServiceFeedbackDao(db: AppDatabase): ServiceFeedbackDao = db.serviceFeedbackDao()

    @Provides
    fun provideSatisfactionSurveyDao(db: AppDatabase): SatisfactionSurveyDao = db.satisfactionSurveyDao()

    @Provides
    fun provideAppNotificationDao(db: AppDatabase): AppNotificationDao = db.appNotificationDao()

    @Provides
    fun providePendingMutationDao(db: AppDatabase): PendingMutationDao = db.pendingMutationDao()
}
