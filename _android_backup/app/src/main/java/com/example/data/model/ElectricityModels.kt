package com.example.data.model

enum class TokenStatus(val labelEn: String, val labelId: String) {
    ISSUED("Issued", "Diterbitkan"),
    ENTERED("Input in Meter", "Sudah Diinput"),
    VERIFIED("Verified", "Terverifikasi")
}

data class ElectricityMeter(
    val id: String,
    val roomNumber: String,
    val meterNumber: String,
    val lastReadingKwh: Double,
    val currentReadingKwh: Double,
    val readingDate: String,
    val tariffPerKwh: Double = 1699.53, // Standard Indonesian PLN Tariff R1/1300-2200VA
    val isBilled: Boolean = false
) {
    val consumptionKwh: Double get() = (currentReadingKwh - lastReadingKwh).coerceAtLeast(0.0)
    val estimatedCost: Double get() = consumptionKwh * tariffPerKwh
}

data class ElectricityToken(
    val id: String,
    val roomNumber: String,
    val meterNumber: String,
    val tokenCode: String, // 20-digit token e.g. "4912-3819-2049-5510-9281"
    val amountRp: Double,
    val kwhAmount: Double,
    val generatedAt: String,
    val issuedBy: String = "Admin Lewi House",
    val status: TokenStatus = TokenStatus.ISSUED,
    val residentName: String = ""
)
