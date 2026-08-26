package com.example.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.FinanceRepository
import com.example.data.repository.RoomRepository
import com.example.domain.usecase.CalculateRoomTransferUseCase
import com.example.domain.usecase.IssueElectricityTokenUseCase
import com.example.ui.common.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

data class AdminFinanceData(
    val payments: List<Payment>,
    val totalRevenue: Double,
    val pendingRevenue: Double,
    val collectionRatePercent: Double,
    val recentTokens: List<ElectricityToken>,
    val meters: List<ElectricityMeter>
)

@HiltViewModel
class AdminFinanceViewModel @Inject constructor(
    private val financeRepository: FinanceRepository,
    private val roomRepository: RoomRepository,
    private val calculateRoomTransferUseCase: CalculateRoomTransferUseCase,
    private val issueElectricityTokenUseCase: IssueElectricityTokenUseCase
) : ViewModel() {

    private val _transferCalculationState = MutableStateFlow<RoomTransferCalculation?>(null)
    val transferCalculationState: StateFlow<RoomTransferCalculation?> = _transferCalculationState.asStateFlow()

    private val _actionMessage = MutableStateFlow<String?>(null)
    val actionMessage: StateFlow<String?> = _actionMessage.asStateFlow()

    val financeUiState: StateFlow<UiState<AdminFinanceData>> = combine(
        financeRepository.allPayments,
        financeRepository.allTokens,
        financeRepository.allMeters
    ) { payments, tokens, meters ->
        val totalPaid = payments.filter { it.status == PaymentStatus.PAID }.sumOf { it.amount }
        val totalPending = payments.filter { it.status == PaymentStatus.PENDING }.sumOf { it.amount }
        val totalExpected = totalPaid + totalPending
        val collectionRate = if (totalExpected > 0) (totalPaid / totalExpected) * 100 else 100.0

        UiState.Success(
            AdminFinanceData(
                payments = payments,
                totalRevenue = totalPaid,
                pendingRevenue = totalPending,
                collectionRatePercent = collectionRate,
                recentTokens = tokens,
                meters = meters
            )
        )
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = UiState.Loading
    )

    fun markPaymentAsPaid(payment: Payment) {
        viewModelScope.launch {
            financeRepository.updatePayment(payment.copy(status = PaymentStatus.PAID))
            _actionMessage.value = "Payment for ${payment.residentName} marked as PAID"
        }
    }

    fun issueElectricityToken(roomNumber: String, amountRp: Double, residentName: String) {
        viewModelScope.launch {
            val result = issueElectricityTokenUseCase(roomNumber, amountRp, residentName)
            result.onSuccess { token ->
                _actionMessage.value = "Token ${token.tokenCode} issued for Room $roomNumber"
            }.onFailure { error ->
                _actionMessage.value = "Failed to issue token: ${error.message}"
            }
        }
    }

    fun calculateTransferProration(
        resident: Resident,
        fromRoom: RoomUnit,
        toRoom: RoomUnit,
        totalDays: Int = 30,
        daysUsed: Int = 10
    ) {
        val nowFormatted = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        val calculation = calculateRoomTransferUseCase(
            resident = resident,
            fromRoom = fromRoom,
            toRoom = toRoom,
            transferDateStr = nowFormatted,
            totalDaysInMonth = totalDays,
            daysUsedInOldRoom = daysUsed
        )
        _transferCalculationState.value = calculation
    }

    fun clearTransferCalculation() {
        _transferCalculationState.value = null
    }

    fun clearActionMessage() {
        _actionMessage.value = null
    }
}
