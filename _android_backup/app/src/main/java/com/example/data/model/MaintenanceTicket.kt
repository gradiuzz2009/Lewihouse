package com.example.data.model

enum class MaintenanceCategory(val labelEn: String, val labelId: String, val iconName: String) {
    AIR_CONDITIONER("Air Conditioner", "Pendingin Ruangan (AC)", "ac_unit"),
    PLUMBING("Plumbing / Water", "Pipa & Air", "water_drop"),
    ELECTRICAL("Electrical / Lights", "Listrik & Lampu", "bolt"),
    APPLIANCE("Appliances / Furniture", "Perabotan & Elektronik", "kitchen"),
    STRUCTURAL("Door / Window / Walls", "Pintu / Jendela / Dinding", "door_front"),
    OTHER("General Maintenance", "Perbaikan Umum", "build")
}

enum class MaintenancePriority(val labelEn: String, val labelId: String) {
    LOW("Low", "Rendah"),
    MEDIUM("Medium", "Sedang"),
    HIGH("High", "Tinggi"),
    EMERGENCY("Emergency", "Darurat")
}

enum class MaintenanceStatus(val labelEn: String, val labelId: String) {
    REPORTED("Reported", "Dilaporkan"),
    ASSIGNED("Technician Assigned", "Teknisi Ditugaskan"),
    IN_PROGRESS("In Progress", "Sedang Dikerjakan"),
    RESOLVED("Resolved", "Selesai"),
    CANCELLED("Cancelled", "Dibatalkan")
}

data class MaintenanceTicket(
    val id: String,
    val roomNumber: String,
    val residentId: String,
    val residentName: String,
    val title: String,
    val category: MaintenanceCategory,
    val description: String,
    val priority: MaintenancePriority,
    val status: MaintenanceStatus,
    val reportedDate: String,
    val resolvedDate: String? = null,
    val assignedTechnician: String? = null,
    val estimatedCost: Double? = null,
    val photoEvidenceDesc: String? = null,
    val notes: String? = null
)
