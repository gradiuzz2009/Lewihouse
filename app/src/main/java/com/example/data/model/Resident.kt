package com.example.data.model

enum class ResidentStatus(val labelEn: String, val labelId: String) {
    ACTIVE("Active Resident", "Penghuni Aktif"),
    MOVING_OUT("Notice Given", "Akan Keluar"),
    ARCHIVED("Past Resident", "Mantan Penghuni")
}

data class Resident(
    val id: String,
    val fullName: String,
    val email: String,
    val phone: String,
    val roomNumber: String,
    val moveInDate: String,
    val leaseEndDate: String,
    val monthlyRent: Double,
    val depositAmount: Double,
    val outstandingDebt: Double = 0.0,
    val emergencyContact: String = "Family",
    val emergencyPhone: String = "+62 812-3456-7890",
    val ktpNumber: String = "3271040892000001",
    val status: ResidentStatus = ResidentStatus.ACTIVE,
    val avatarIndex: Int = 0
)
