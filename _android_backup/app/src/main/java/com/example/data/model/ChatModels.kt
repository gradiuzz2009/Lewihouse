package com.example.data.model

enum class ChatSenderRole {
    ADMIN,
    TENANT
}

data class ChatMessage(
    val id: String,
    val tenantId: String,
    val senderId: String,
    val senderName: String,
    val senderRole: ChatSenderRole,
    val text: String,
    val timestamp: String,
    val isRead: Boolean = false,
    val readByAdmin: Boolean = false,
    val readByTenant: Boolean = false
)

data class ChatThread(
    val tenantId: String,
    val tenantName: String,
    val roomNumber: String?,
    val lastMessage: String?,
    val lastTimestamp: String?,
    val unreadCount: Int = 0
)
