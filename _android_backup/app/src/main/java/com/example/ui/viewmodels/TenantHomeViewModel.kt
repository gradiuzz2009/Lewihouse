package com.example.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.FinanceRepository
import com.example.data.repository.RoomRepository
import com.example.data.security.EncryptedSessionManager
import com.example.ui.common.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import javax.inject.Inject

data class TenantHomeData(
    val tenant: Resident?,
    val room: RoomUnit?,
    val pendingPayment: Payment?,
    val recentTokens: List<ElectricityToken>,
    val electricityMeter: ElectricityMeter?
)

@HiltViewModel
class TenantHomeViewModel @Inject constructor(
    private val roomRepository: RoomRepository,
    private val financeRepository: FinanceRepository,
    sessionManager: EncryptedSessionManager
) : ViewModel() {

    private val tenantId = sessionManager.selectedTenantId

    val homeUiState: StateFlow<UiState<TenantHomeData>> = combine(
        roomRepository.allResidents,
        roomRepository.allRooms,
        financeRepository.allPayments,
        financeRepository.allTokens,
        financeRepository.allMeters
    ) { residents, rooms, payments, tokens, meters ->
        val tenant = residents.find { it.id == tenantId } ?: residents.firstOrNull()
        val room = if (tenant != null) rooms.find { it.roomNumber == tenant.roomNumber } else null
        val pendingPayment = if (tenant != null) {
            payments.filter { it.residentId == tenant.id && it.status == PaymentStatus.PENDING }
                .minByOrNull { it.dueDate }
        } else null
        val tenantTokens = if (tenant != null) {
            tokens.filter { it.roomNumber == tenant.roomNumber }.take(5)
        } else emptyList()
        val meter = if (tenant != null) {
            meters.find { it.roomNumber == tenant.roomNumber }
        } else null

        UiState.Success(
            TenantHomeData(
                tenant = tenant,
                room = room,
                pendingPayment = pendingPayment,
                recentTokens = tenantTokens,
                electricityMeter = meter
            )
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = UiState.Loading
    )
}
