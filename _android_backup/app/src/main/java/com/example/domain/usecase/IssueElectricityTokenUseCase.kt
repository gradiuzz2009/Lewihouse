package com.example.domain.usecase

import com.example.data.model.ElectricityToken
import com.example.data.model.TokenStatus
import com.example.data.repository.FinanceRepository
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject
import kotlin.random.Random

class IssueElectricityTokenUseCase @Inject constructor(
    private val financeRepository: FinanceRepository
) {

    suspend operator fun invoke(
        roomNumber: String,
        amountRp: Double,
        residentName: String,
        issuedBy: String = "Management Lewi House"
    ): Result<ElectricityToken> {
        if (amountRp < 20000.0) {
            return Result.failure(IllegalArgumentException("Minimum purchase amount is Rp 20.000"))
        }
        if (amountRp > 2000000.0) {
            return Result.failure(IllegalArgumentException("Maximum single token limit is Rp 2.000.000"))
        }

        val meter = financeRepository.getMeterByRoom(roomNumber)
        val meterNumber = meter?.meterNumber ?: "PLN-$roomNumber-00000"
        val tariff = meter?.tariffPerKwh ?: 1699.53
        val kwh = amountRp / tariff

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
            meterNumber = meterNumber,
            tokenCode = tokenCode,
            amountRp = amountRp,
            kwhAmount = kwh,
            generatedAt = nowFormatted,
            issuedBy = issuedBy,
            status = TokenStatus.ISSUED,
            residentName = residentName
        )

        financeRepository.saveElectricityToken(token)
        return Result.success(token)
    }
}
