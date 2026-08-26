package com.example.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.ChatMessage
import com.example.data.model.ChatSenderRole
import com.example.data.model.ChatThread
import com.example.data.security.EncryptedSessionManager
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import timber.log.Timber
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val sessionManager: EncryptedSessionManager
) : ViewModel() {

    private val firestore: FirebaseFirestore? = runCatching { FirebaseFirestore.getInstance() }.getOrNull()
    private val propertyRef get() = firestore?.collection("properties")?.document("lewi_house_main")

    val currentRole: AppRole get() = sessionManager.userRole
    val currentTenantId: String get() = sessionManager.selectedTenantId

    private val _activeThreadTenantId = MutableStateFlow(sessionManager.selectedTenantId)
    val activeThreadTenantId: StateFlow<String> = _activeThreadTenantId.asStateFlow()

    fun selectThread(tenantId: String) {
        _activeThreadTenantId.value = tenantId
    }

    // Real-time chat messages for active tenant
    val activeMessages: StateFlow<List<ChatMessage>> = _activeThreadTenantId.flatMapLatest { tenantId ->
        callbackFlow {
            val ref = propertyRef
            if (ref == null) {
                trySend(emptyList())
                awaitClose { }
                return@callbackFlow
            }

            val listener = ref.collection("chats")
                .document(tenantId)
                .collection("messages")
                .orderBy("timestamp", Query.Direction.ASCENDING)
                .addSnapshotListener { snapshot, error ->
                    if (error != null || snapshot == null) {
                        Timber.w(error, "Error listening to chat messages")
                        trySend(emptyList())
                        return@addSnapshotListener
                    }

                    val messages = snapshot.documents.mapNotNull { doc ->
                        runCatching {
                            ChatMessage(
                                id = doc.id,
                                tenantId = tenantId,
                                senderId = doc.getString("senderId") ?: "",
                                senderName = doc.getString("senderName") ?: "",
                                senderRole = if (doc.getString("senderRole") == "ADMIN") ChatSenderRole.ADMIN else ChatSenderRole.TENANT,
                                text = doc.getString("message") ?: "",
                                timestamp = doc.getString("timestamp") ?: "",
                                isRead = doc.getBoolean("isRead") ?: true
                            )
                        }.getOrNull()
                    }
                    trySend(messages)
                }

            awaitClose { listener.remove() }
        }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    // Real-time all chat threads for Admin view
    val allChatThreads: StateFlow<List<ChatThread>> = callbackFlow {
        val ref = propertyRef
        if (ref == null) {
            trySend(emptyList())
            awaitClose { }
            return@callbackFlow
        }

        val listener = ref.collection("chats").addSnapshotListener { snapshot, error ->
            if (error != null || snapshot == null) {
                trySend(emptyList())
                return@addSnapshotListener
            }

            val threads = snapshot.documents.mapNotNull { doc ->
                runCatching {
                    ChatThread(
                        tenantId = doc.id,
                        tenantName = doc.getString("tenantName") ?: "Tenant ${doc.id}",
                        roomNumber = doc.getString("roomNumber") ?: "",
                        lastMessage = doc.getString("lastMessage") ?: "",
                        lastTimestamp = doc.getString("lastMessageTime") ?: "",
                        unreadCount = doc.getLong("unreadCount")?.toInt() ?: 0
                    )
                }.getOrNull()
            }
            trySend(threads)
        }

        awaitClose { listener.remove() }
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = emptyList()
    )

    fun sendMessage(text: String, tenantId: String, senderName: String) {
        val trimmed = text.trim()
        if (trimmed.isBlank()) return

        viewModelScope.launch {
            val ref = propertyRef ?: return@launch
            val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
            val messageId = "msg_${UUID.randomUUID().toString().take(8)}"

            val msgData = hashMapOf(
                "senderId" to if (currentRole == AppRole.ADMIN) "admin_manager" else tenantId,
                "senderName" to senderName,
                "senderRole" to currentRole.name,
                "message" to trimmed,
                "timestamp" to nowFormatted,
                "isRead" to false
            )

            try {
                ref.collection("chats")
                    .document(tenantId)
                    .collection("messages")
                    .document(messageId)
                    .set(msgData)
                    .await()

                val threadData = hashMapOf(
                    "tenantId" to tenantId,
                    "lastMessage" to trimmed,
                    "lastMessageTime" to nowFormatted
                )
                ref.collection("chats").document(tenantId).set(threadData, com.google.firebase.firestore.SetOptions.merge()).await()
            } catch (e: Exception) {
                Timber.e(e, "Failed to send chat message")
            }
        }
    }
}
