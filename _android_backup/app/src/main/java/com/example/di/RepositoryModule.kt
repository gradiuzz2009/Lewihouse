package com.example.di

import com.example.data.repository.FinanceRepository
import com.example.data.repository.OfflineFirstFinanceRepository
import com.example.data.repository.OfflineFirstRoomRepository
import com.example.data.repository.RoomRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindRoomRepository(
        impl: OfflineFirstRoomRepository
    ): RoomRepository

    @Binds
    @Singleton
    abstract fun bindFinanceRepository(
        impl: OfflineFirstFinanceRepository
    ): FinanceRepository
}
