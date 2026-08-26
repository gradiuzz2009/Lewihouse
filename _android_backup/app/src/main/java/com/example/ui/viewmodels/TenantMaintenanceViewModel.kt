package com.example.ui.viewmodels

import android.content.Context
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.local.AppDatabase
import com.example.data.local.MaintenanceTicketEntity
import com.example.data.local.PendingMutationEntity
import com.example.data.local.ServiceFeedbackEntity
import com.example.data.model.*
import com.example.data.security.EncryptedSessionManager
import com.example.data.worker.SyncWorker
import com.example.ui.common.UiState
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

data class TenantMaintenanceData(
    val tickets: List<MaintenanceTicket>,
    val openTicketsCount: Int,
    val resolvedTicketsCount: Int
)

@HiltViewModel
class TenantMaintenanceViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val database: AppDatabase,
    sessionManager: EncryptedSessionManager
) : ViewModel() {

    private val tenantId = sessionManager.selectedTenantId
    private val moshi: Moshi = Moshi.Builder().addLast(KotlinJsonAdapterFactory()).build()

    private val _selectedPhotoUri = MutableStateFlow<Uri?>(null)
    val selectedPhotoUri: StateFlow<Uri?> = _selectedPhotoUri.asStateFlow()

    private val _submissionMessage = MutableStateFlow<String?>(null)
    val submissionMessage: StateFlow<String?> = _submissionMessage.asStateFlow()

    val maintenanceUiState: StateFlow<UiState<TenantMaintenanceData>> =
        database.maintenanceTicketDao().getTicketsByResident(tenantId)
            .map { entities ->
                val tickets = entities.map { it.toDomain() }
                val open = tickets.count { it.status != MaintenanceStatus.RESOLVED && it.status != MaintenanceStatus.CANCELLED }
                val resolved = tickets.count { it.status == MaintenanceStatus.RESOLVED }

                UiState.Success(
                    TenantMaintenanceData(
                        tickets = tickets,
                        openTicketsCount = open,
                        resolvedTicketsCount = resolved
                    )
                )
            }.stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = UiState.Loading
            )

    fun setPhotoUri(uri: Uri?) {
        _selectedPhotoUri.value = uri
    }

    fun submitTicket(
        title: String,
        description: String,
        category: MaintenanceCategory,
        urgency: MaintenancePriority,
        roomNumber: String,
        residentName: String
    ) {
        if (title.isBlank() || description.isBlank()) {
            _submissionMessage.value = "Please fill in title and description"
            return
        }

        viewModelScope.launch {
            val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
            val ticketId = "tkt_${UUID.randomUUID().toString().take(8)}"
            val photoUrl = _selectedPhotoUri.value?.toString()

            val ticket = MaintenanceTicket(
                id = ticketId,
                residentId = tenantId,
                residentName = residentName,
                roomNumber = roomNumber,
                title = title.trim(),
                description = description.trim(),
                category = category,
                priority = urgency,
                status = MaintenanceStatus.REPORTED,
                reportedDate = nowFormatted,
                photoEvidenceDesc = photoUrl
            )

            // Save locally
            database.maintenanceTicketDao().insertTicket(MaintenanceTicketEntity.fromDomain(ticket))

            // Queue offline sync mutation
            val mapType = com.squareup.moshi.Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
            val adapter = moshi.adapter<Map<String, Any>>(mapType)
            val payload = mapOf(
                "residentId" to tenantId,
                "residentName" to residentName,
                "roomNumber" to roomNumber,
                "title" to title.trim(),
                "description" to description.trim(),
                "category" to category.name,
                "priority" to urgency.name,
                "status" to MaintenanceStatus.REPORTED.name,
                "reportedDate" to nowFormatted,
                "photoUrl" to (photoUrl ?: "")
            )

            database.pendingMutationDao().insertMutation(
                PendingMutationEntity(
                    id = ticketId,
                    entityType = "TICKET",
                    action = "INSERT",
                    payloadJson = adapter.toJson(payload)
                )
            )
            SyncWorker.enqueueSync(context)

            _selectedPhotoUri.value = null
            _submissionMessage.value = "Maintenance ticket submitted successfully"
        }
    }

    fun submitServiceFeedback(ticket: MaintenanceTicket, rating: Int, aspects: List<String>, comment: String) {
        viewModelScope.launch {
            val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
            val feedbackId = "fbk_${UUID.randomUUID().toString().take(8)}"
            val feedback = ServiceFeedback(
                id = feedbackId,
                ticketId = ticket.id,
                ticketTitle = ticket.title,
                residentId = tenantId,
                residentName = ticket.residentName,
                roomNumber = ticket.roomNumber,
                technicianName = ticket.assignedTechnician,
                rating = rating,
                aspects = aspects,
                comment = comment,
                createdAt = nowFormatted
            )

            database.serviceFeedbackDao().insertFeedback(ServiceFeedbackEntity.fromDomain(feedback))

            val mapType = com.squareup.moshi.Types.newParameterizedType(Map::class.java, String::class.java, Any::class.java)
            val adapter = moshi.adapter<Map<String, Any>>(mapType)
            val payload = mapOf(
                "ticketId" to ticket.id,
                "ticketTitle" to ticket.title,
                "residentId" to tenantId,
                "residentName" to ticket.residentName,
                "roomNumber" to ticket.roomNumber,
                "technicianName" to (ticket.assignedTechnician ?: ""),
                "rating" to rating,
                "aspects" to aspects,
                "comment" to comment,
                "createdAt" to nowFormatted
            )

            database.pendingMutationDao().insertMutation(
                PendingMutationEntity(
                    id = feedbackId,
                    entityType = "FEEDBACK",
                    action = "INSERT",
                    payloadJson = adapter.toJson(payload)
                )
            )
            SyncWorker.enqueueSync(context)
            _submissionMessage.value = "Thank you for your feedback!"
        }
    }

    fun clearSubmissionMessage() {
        _submissionMessage.value = null
    }
}
