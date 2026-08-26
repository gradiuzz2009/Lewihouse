package com.example.domain.usecase

import com.example.data.model.RoomTransferCalculation
import com.example.data.model.RoomUnit
import com.example.data.model.Resident
import javax.inject.Inject

class CalculateRoomTransferUseCase @Inject constructor() {

    operator fun invoke(
        resident: Resident,
        fromRoom: RoomUnit,
        toRoom: RoomUnit,
        transferDateStr: String,
        totalDaysInMonth: Int = 30,
        daysUsedInOldRoom: Int = 10
    ): RoomTransferCalculation {
        require(totalDaysInMonth > 0) { "Total days in month must be positive" }
        require(daysUsedInOldRoom in 0..totalDaysInMonth) { "Days used must be between 0 and total days" }

        val remainingDays = totalDaysInMonth - daysUsedInOldRoom
        val oldDailyRate = fromRoom.monthlyRate / totalDaysInMonth
        val newDailyRate = toRoom.monthlyRate / totalDaysInMonth

        val unusedOldRoomCredit = oldDailyRate * remainingDays
        val newRoomProratedCharge = newDailyRate * remainingDays
        val netRentAdjustment = newRoomProratedCharge - unusedOldRoomCredit

        val currentDeposit = resident.depositAmount
        val requiredNewDeposit = toRoom.monthlyRate
        val depositAdjustment = (requiredNewDeposit - currentDeposit).coerceAtLeast(0.0)

        val totalNetPayableOrRefund = netRentAdjustment + depositAdjustment

        return RoomTransferCalculation(
            residentId = resident.id,
            residentName = resident.fullName,
            fromRoomNumber = fromRoom.roomNumber,
            fromRoomType = fromRoom.type.name,
            fromRoomMonthlyRate = fromRoom.monthlyRate,
            toRoomNumber = toRoom.roomNumber,
            toRoomType = toRoom.type.name,
            toRoomMonthlyRate = toRoom.monthlyRate,
            transferEffectiveDate = transferDateStr,
            totalDaysInBillingCycle = totalDaysInMonth,
            daysOccupiedInOldRoom = daysUsedInOldRoom,
            remainingDaysInBillingCycle = remainingDays,
            oldRoomDailyRate = oldDailyRate,
            newRoomDailyRate = newDailyRate,
            unusedOldRoomCredit = unusedOldRoomCredit,
            newRoomProratedCharge = newRoomProratedCharge,
            netRentAdjustment = netRentAdjustment,
            currentDeposit = currentDeposit,
            requiredNewDeposit = requiredNewDeposit,
            depositAdjustment = depositAdjustment,
            totalNetPayableOrRefund = totalNetPayableOrRefund
        )
    }
}
