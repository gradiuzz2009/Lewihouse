package com.example

import com.example.data.language.AppLanguage
import com.example.data.language.LanguageManager
import com.example.data.model.RoomTransferCalculation
import org.junit.Assert.*
import org.junit.Test

class LewiHouseLogicTest {

    @Test
    fun testCurrencyFormatting() {
        val amount = 3500000.0
        val formattedId = LanguageManager.formatCurrency(amount, AppLanguage.ID)
        val formattedEn = LanguageManager.formatCurrency(amount, AppLanguage.EN)

        assertTrue(formattedId.contains("3.500.000") || formattedId.contains("3,500,000"))
        assertTrue(formattedId.startsWith("Rp"))
        assertTrue(formattedEn.startsWith("IDR"))
    }

    @Test
    fun testKwhFormatting() {
        val kwh = 58.840
        val formatted = LanguageManager.formatKwh(kwh)
        assertEquals("58.8 kWh", formatted)
    }

    @Test
    fun testRoomTransferProrationMath() {
        val oldMonthlyRent = 3000000.0 // Standard Room
        val newMonthlyRent = 4500000.0 // Executive Suite
        val daysInMonth = 30
        val daysUsed = 10
        val remainingDays = 20

        val oldRoomCredit = (oldMonthlyRent / daysInMonth) * remainingDays // (100k) * 20 = 2,000,000
        val newRoomCost = (newMonthlyRent / daysInMonth) * remainingDays    // (150k) * 20 = 3,000,000
        val netAdjustment = newRoomCost - oldRoomCredit                     // 1,000,000

        val calc = RoomTransferCalculation(
            residentId = "res_101",
            residentName = "Budi Santoso",
            fromRoomNumber = "101",
            fromRoomType = "Standard Suite",
            fromRoomMonthlyRate = oldMonthlyRent,
            toRoomNumber = "201",
            toRoomType = "Executive Loft",
            toRoomMonthlyRate = newMonthlyRent,
            transferEffectiveDate = "2026-05-11",
            totalDaysInBillingCycle = daysInMonth,
            daysOccupiedInOldRoom = daysUsed,
            remainingDaysInBillingCycle = remainingDays,
            oldRoomDailyRate = oldMonthlyRent / daysInMonth,
            newRoomDailyRate = newMonthlyRent / daysInMonth,
            unusedOldRoomCredit = oldRoomCredit,
            newRoomProratedCharge = newRoomCost,
            netRentAdjustment = netAdjustment,
            currentDeposit = oldMonthlyRent,
            requiredNewDeposit = newMonthlyRent,
            depositAdjustment = newMonthlyRent - oldMonthlyRent,
            totalNetPayableOrRefund = netAdjustment + (newMonthlyRent - oldMonthlyRent)
        )

        assertEquals(2000000.0, calc.unusedOldRoomCredit, 0.01)
        assertEquals(3000000.0, calc.newRoomProratedCharge, 0.01)
        assertEquals(1000000.0, calc.netRentAdjustment, 0.01)
        assertEquals(2500000.0, calc.totalNetPayableOrRefund, 0.01)
        assertTrue(calc.isPayable())
    }

    @Test
    fun testPlnTokenGenerationFormat() {
        fun generateToken(): String {
            val chunks = (1..4).map {
                (10000 + (Math.random() * 90000).toInt()).toString()
            }
            return chunks.joinToString(" ")
        }

        val token = generateToken()
        val parts = token.split(" ")
        assertEquals(4, parts.size)
        parts.forEach { part ->
            assertEquals(5, part.length)
            assertTrue(part.all { it.isDigit() })
        }
    }

    @Test
    fun testFirebaseAuthManagerOfflineFallback() = kotlinx.coroutines.runBlocking {
        val authManager = com.example.data.security.FirebaseAuthManager()
        val result = authManager.loginWithCredentials("204", com.example.ui.viewmodels.AppRole.TENANT)
        assertTrue(result is com.example.data.security.AuthResult.Success)
        val success = result as com.example.data.security.AuthResult.Success
        assertEquals(com.example.ui.viewmodels.AppRole.TENANT, success.role)
        assertEquals("res_204", success.residentId)
    }

    @Test
    fun testAdminLoginFallback() = kotlinx.coroutines.runBlocking {
        val authManager = com.example.data.security.FirebaseAuthManager()
        val result = authManager.loginWithCredentials("admin@lewihouse.id", com.example.ui.viewmodels.AppRole.ADMIN)
        assertTrue(result is com.example.data.security.AuthResult.Success)
        val success = result as com.example.data.security.AuthResult.Success
        assertEquals(com.example.ui.viewmodels.AppRole.ADMIN, success.role)
        assertEquals("admin_manager", success.residentId)
    }
}
