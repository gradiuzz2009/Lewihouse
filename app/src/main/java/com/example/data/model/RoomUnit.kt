package com.example.data.model

enum class UnitType(val displayNameEn: String, val displayNameId: String) {
    STANDARD("Standard Room", "Kamar Standar"),
    DELUXE("Deluxe Studio", "Studio Deluxe"),
    PREMIUM("Premium Balcony", "Premium Balkon"),
    EXECUTIVE("Executive Suite", "Suite Eksekutif")
}

enum class UnitStatus(val labelEn: String, val labelId: String) {
    OCCUPIED("Occupied", "Terisi"),
    VACANT("Vacant", "Kosong"),
    MAINTENANCE("Under Maintenance", "Perbaikan")
}

data class RoomUnit(
    val id: String,
    val roomNumber: String,
    val type: UnitType,
    val floor: Int,
    val monthlyRate: Double,
    val status: UnitStatus,
    val amenities: List<String>,
    val sizeSqm: Double,
    val electricityMeterId: String,
    val currentResidentId: String? = null,
    val currentResidentName: String? = null,
    val notes: String = ""
)
