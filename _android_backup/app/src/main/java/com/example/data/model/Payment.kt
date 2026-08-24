package com.example.data.model

enum class PaymentType(val labelEn: String, val labelId: String) {
    RENT("Monthly Rent", "Sewa Bulanan"),
    ELECTRICITY("Electricity Utility", "Listrik PLN"),
    DEPOSIT("Security Deposit", "Deposit Jaminan"),
    MAINTENANCE("Maintenance Fee", "Biaya Perbaikan"),
    TRANSFER_ADJUSTMENT("Room Transfer Adj.", "Penyesuaian Pindah Kamar")
}

enum class PaymentStatus(val labelEn: String, val labelId: String) {
    PAID("Paid", "Lunas"),
    PENDING("Pending Confirmation", "Menunggu Konfirmasi"),
    OVERDUE("Overdue", "Jatuh Tempo")
}

enum class PaymentMethod(val label: String) {
    BANK_TRANSFER("BCA Bank Transfer"),
    BCA_VA("BCA Virtual Account"),
    QRIS("QRIS Digital"),
    MANDIRI_VA("Mandiri Virtual Account"),
    BNI_VA("BNI Virtual Account"),
    CASH("Cash / Tunai")
}

data class Payment(
    val id: String,
    val residentId: String,
    val residentName: String,
    val roomNumber: String,
    val amount: Double,
    val type: PaymentType,
    val status: PaymentStatus,
    val date: String,
    val dueDate: String,
    val paymentMethod: PaymentMethod = PaymentMethod.BANK_TRANSFER,
    val receiptRef: String = "",
    val notes: String = ""
)
