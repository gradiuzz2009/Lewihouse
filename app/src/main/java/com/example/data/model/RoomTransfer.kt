package com.example.data.model

import java.text.NumberFormat
import java.util.Locale

data class RoomTransferCalculation(
    val residentId: String,
    val residentName: String,
    val fromRoomNumber: String,
    val fromRoomType: String,
    val fromRoomMonthlyRate: Double,
    val toRoomNumber: String,
    val toRoomType: String,
    val toRoomMonthlyRate: Double,
    val transferEffectiveDate: String,
    val totalDaysInBillingCycle: Int = 30,
    val daysOccupiedInOldRoom: Int,
    val remainingDaysInBillingCycle: Int,
    val oldRoomDailyRate: Double,
    val newRoomDailyRate: Double,
    val unusedOldRoomCredit: Double,
    val newRoomProratedCharge: Double,
    val netRentAdjustment: Double, // Positive = tenant pays diff; Negative = refund/credit
    val currentDeposit: Double,
    val requiredNewDeposit: Double,
    val depositAdjustment: Double,
    val totalNetPayableOrRefund: Double // netRentAdjustment + depositAdjustment
) {
    fun isPayable(): Boolean = totalNetPayableOrRefund > 0
    fun isRefund(): Boolean = totalNetPayableOrRefund < 0
    fun isBalanced(): Boolean = totalNetPayableOrRefund == 0.0

    companion object {
        fun calculate(
            resident: Resident,
            currentRoom: RoomUnit,
            targetRoom: RoomUnit,
            transferDate: String,
            daysUsedInCurrentMonth: Int = 12,
            totalCycleDays: Int = 30
        ): RoomTransferCalculation {
            val safeDaysUsed = daysUsedInCurrentMonth.coerceIn(0, totalCycleDays)
            val remainingDays = totalCycleDays - safeDaysUsed

            val oldDaily = currentRoom.monthlyRate / totalCycleDays
            val newDaily = targetRoom.monthlyRate / totalCycleDays

            val unusedOldCredit = oldDaily * remainingDays
            val newCharge = newDaily * remainingDays

            val netRentAdj = newCharge - unusedOldCredit
            val oldDeposit = resident.depositAmount
            val newDeposit = targetRoom.monthlyRate // 1 month deposit convention
            val depositAdj = newDeposit - oldDeposit

            val totalAdjustment = netRentAdj + depositAdj

            return RoomTransferCalculation(
                residentId = resident.id,
                residentName = resident.fullName,
                fromRoomNumber = currentRoom.roomNumber,
                fromRoomType = currentRoom.type.displayNameEn,
                fromRoomMonthlyRate = currentRoom.monthlyRate,
                toRoomNumber = targetRoom.roomNumber,
                toRoomType = targetRoom.type.displayNameEn,
                toRoomMonthlyRate = targetRoom.monthlyRate,
                transferEffectiveDate = transferDate,
                totalDaysInBillingCycle = totalCycleDays,
                daysOccupiedInOldRoom = safeDaysUsed,
                remainingDaysInBillingCycle = remainingDays,
                oldRoomDailyRate = oldDaily,
                newRoomDailyRate = newDaily,
                unusedOldRoomCredit = unusedOldCredit,
                newRoomProratedCharge = newCharge,
                netRentAdjustment = netRentAdj,
                currentDeposit = oldDeposit,
                requiredNewDeposit = newDeposit,
                depositAdjustment = depositAdj,
                totalNetPayableOrRefund = totalAdjustment
            )
        }
    }
}
