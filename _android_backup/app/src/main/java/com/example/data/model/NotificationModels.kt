package com.example.data.model

enum class NotificationCategory(val labelEn: String, val labelId: String, val iconEmoji: String) {
    MAINTENANCE("Maintenance", "Perbaikan", "🛠️"),
    RENT_DUE("Rent & Payment", "Sewa & Tagihan", "💳"),
    ELECTRICITY("Electricity", "Listrik", "⚡"),
    ANNOUNCEMENT("Announcement", "Pengumuman", "📢"),
    SURVEY("Feedback & Survey", "Survei & Ulasan", "⭐")
}

enum class NotificationPriority(val label: String) {
    NORMAL("Normal"),
    IMPORTANT("Important"),
    URGENT("Urgent")
}

enum class NotificationAction {
    VIEW_TICKET,
    RATE_MAINTENANCE,
    VIEW_BILLS,
    VIEW_ELECTRICITY,
    OPEN_SURVEY,
    VIEW_ANNOUNCEMENT
}

data class AppNotification(
    val id: String,
    val recipientResidentId: String?, // null = broadcast to all residents
    val recipientName: String?,
    val title: String,
    val message: String,
    val category: NotificationCategory,
    val priority: NotificationPriority = NotificationPriority.NORMAL,
    val timestamp: String,
    val isRead: Boolean = false,
    val actionType: NotificationAction? = null,
    val actionPayload: String? = null // e.g. ticketId, billId, or surveyPeriod
)
