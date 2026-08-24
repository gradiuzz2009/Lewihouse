package com.example.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.language.AppLanguage
import com.example.data.local.AppDatabase
import com.example.data.local.SessionManager
import com.example.data.model.*
import com.example.data.repository.LewiHouseRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import kotlin.random.Random

enum class AppRole {
    ADMIN,
    TENANT
}

enum class AdminTab {
    DASHBOARD,
    ROOMS,
    RESIDENTS,
    FINANCE,
    OPERATIONS,
    ELECTRICITY,
    MAINTENANCE,
    TRANSFER_CALCULATOR,
    CHAT
}

enum class TenantTab {
    HOME,
    BILLS,
    ELECTRICITY,
    MAINTENANCE,
    PROFILE,
    CHAT
}

class AppViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: LewiHouseRepository
    private val sessionManager = SessionManager(application)
    private val authManager = com.example.data.security.FirebaseAuthManager()

    // Language, Auth & Role State
    private val _currentLanguage: MutableStateFlow<AppLanguage> = MutableStateFlow(AppLanguage.EN)
    val currentLanguage: StateFlow<AppLanguage> = _currentLanguage.asStateFlow()

    private val _isLoggedIn: MutableStateFlow<Boolean> = MutableStateFlow(sessionManager.isLoggedIn)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    private val _currentRole: MutableStateFlow<AppRole> = MutableStateFlow(sessionManager.userRole)
    val currentRole: StateFlow<AppRole> = _currentRole.asStateFlow()

    private val _selectedTenantId: MutableStateFlow<String> = MutableStateFlow(sessionManager.selectedTenantId)
    val selectedTenantId: StateFlow<String> = _selectedTenantId.asStateFlow()

    private val _adminTab: MutableStateFlow<AdminTab> = MutableStateFlow(AdminTab.DASHBOARD)
    val adminTab: StateFlow<AdminTab> = _adminTab.asStateFlow()

    private val _tenantTab: MutableStateFlow<TenantTab> = MutableStateFlow(TenantTab.HOME)
    val tenantTab: StateFlow<TenantTab> = _tenantTab.asStateFlow()

    init {
        val db = AppDatabase.getInstance(application)
        repository = LewiHouseRepository(db)
        viewModelScope.launch {
            repository.ensureSeedData()
        }
    }

    suspend fun loginWithCredentials(identifier: String, role: AppRole, passwordInput: String = "LewiHouse2026!"): Boolean {
        return when (val result = authManager.loginWithCredentials(identifier, role, passwordInput)) {
            is com.example.data.security.AuthResult.Success -> {
                val resident = if (role == AppRole.TENANT) repository.authenticateTenant(identifier) else null
                val targetTenantId = resident?.id ?: result.residentId
                _selectedTenantId.value = targetTenantId
                _currentRole.value = result.role
                _isLoggedIn.value = true
                sessionManager.saveSession(result.role, targetTenantId)
                true
            }
            is com.example.data.security.AuthResult.Error -> {
                showSnackbar(result.message)
                false
            }
        }
    }

    fun login(role: AppRole) {
        _currentRole.value = role
        _isLoggedIn.value = true
        sessionManager.saveSession(role, _selectedTenantId.value)
    }

    fun logout() {
        authManager.logout()
        sessionManager.clearSession()
        _isLoggedIn.value = false
    }

    // Data Streams from Room
    val rooms: StateFlow<List<RoomUnit>> = repository.allRooms
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val residents: StateFlow<List<Resident>> = repository.allResidents
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val payments: StateFlow<List<Payment>> = repository.allPayments
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val meters: StateFlow<List<ElectricityMeter>> = repository.allMeters
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val tokens: StateFlow<List<ElectricityToken>> = repository.allTokens
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val tickets: StateFlow<List<MaintenanceTicket>> = repository.allTickets
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val feedbacks: StateFlow<List<ServiceFeedback>> = repository.allFeedbacks
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val surveys: StateFlow<List<SatisfactionSurvey>> = repository.allSurveys
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val notifications: StateFlow<List<AppNotification>> = repository.allNotifications
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val currentTenant: StateFlow<Resident?> = combine(residents, selectedTenantId) { resList: List<Resident>, id: String ->
        resList.find { it.id == id } ?: resList.firstOrNull()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val currentTenantRoom: StateFlow<RoomUnit?> = combine(rooms, currentTenant) { roomList: List<RoomUnit>, tenant: Resident? ->
        if (tenant != null) roomList.find { it.roomNumber == tenant.roomNumber } else null
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val currentTenantPayments: StateFlow<List<Payment>> = combine(payments, currentTenant) { payList: List<Payment>, tenant: Resident? ->
        if (tenant != null) payList.filter { it.residentId == tenant.id } else emptyList()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val currentTenantTokens: StateFlow<List<ElectricityToken>> = combine(tokens, currentTenant) { tokList: List<ElectricityToken>, tenant: Resident? ->
        if (tenant != null) tokList.filter { it.roomNumber == tenant.roomNumber } else emptyList()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val currentTenantTickets: StateFlow<List<MaintenanceTicket>> = combine(tickets, currentTenant) { tktList: List<MaintenanceTicket>, tenant: Resident? ->
        if (tenant != null) tktList.filter { it.residentId == tenant.id } else emptyList()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val currentTenantNotifications: StateFlow<List<AppNotification>> = combine(
        notifications,
        currentTenant,
        _currentRole
    ) { notifs: List<AppNotification>, tenant: Resident?, role: AppRole ->
        if (role == AppRole.ADMIN) {
            notifs
        } else if (tenant != null) {
            notifs.filter { it.recipientResidentId == null || it.recipientResidentId == tenant.id }
        } else {
            notifs.filter { it.recipientResidentId == null }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val unreadNotificationCount: StateFlow<Int> = currentTenantNotifications.map { list ->
        list.count { !it.isRead }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    // =========================================================================
    // Real-Time Chat Flows & Operations
    // =========================================================================

    private val _selectedChatTenantId = MutableStateFlow<String?>(null)
    val selectedChatTenantId: StateFlow<String?> = _selectedChatTenantId.asStateFlow()

    val chatThreads: StateFlow<List<ChatThread>> = repository.allChatThreads
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    @OptIn(kotlinx.coroutines.ExperimentalCoroutinesApi::class)
    val chatMessages: StateFlow<List<ChatMessage>> = combine(
        _selectedChatTenantId,
        currentTenant,
        _currentRole
    ) { selId, tenant, role ->
        if (role == AppRole.ADMIN) selId else tenant?.id
    }.flatMapLatest { tenantId ->
        if (tenantId != null) {
            repository.getChatMessages(tenantId)
        } else {
            flowOf(emptyList())
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val unreadChatCount: StateFlow<Int> = combine(
        chatThreads,
        chatMessages,
        _currentRole
    ) { threads, messages, role ->
        if (role == AppRole.ADMIN) {
            threads.sumOf { it.unreadCount }
        } else {
            messages.count { it.senderRole == ChatSenderRole.ADMIN && !it.readByTenant }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    fun selectChatTenant(tenantId: String?) {
        _selectedChatTenantId.value = tenantId
        if (tenantId != null) {
            markChatAsRead(tenantId)
        }
    }

    fun sendChatMessage(text: String, targetTenantId: String? = null) {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return
        val role = _currentRole.value
        val tenant = currentTenant.value
        val resolvedTenantId = if (role == AppRole.ADMIN) {
            targetTenantId ?: _selectedChatTenantId.value ?: return
        } else {
            tenant?.id ?: return
        }
        val senderName = if (role == AppRole.ADMIN) "Admin Lewi House" else (tenant?.fullName ?: "Penghuni")
        val senderId = if (role == AppRole.ADMIN) "admin_main" else (tenant?.id ?: "tenant")
        val msg = ChatMessage(
            id = UUID.randomUUID().toString(),
            tenantId = resolvedTenantId,
            senderId = senderId,
            senderName = senderName,
            senderRole = if (role == AppRole.ADMIN) ChatSenderRole.ADMIN else ChatSenderRole.TENANT,
            text = trimmed,
            timestamp = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()),
            isRead = false,
            readByAdmin = (role == AppRole.ADMIN),
            readByTenant = (role == AppRole.TENANT)
        )
        viewModelScope.launch {
            repository.sendChatMessage(msg)
        }
    }

    fun markChatAsRead(tenantId: String? = null) {
        val role = _currentRole.value
        val targetId = if (role == AppRole.ADMIN) {
            tenantId ?: _selectedChatTenantId.value ?: return
        } else {
            currentTenant.value?.id ?: return
        }
        viewModelScope.launch {
            repository.markChatAsRead(targetId, byAdmin = (role == AppRole.ADMIN))
        }
    }

    // Interactive Dialog and Sheet States
    private val _ratingTicket = MutableStateFlow<MaintenanceTicket?>(null)
    val ratingTicket = _ratingTicket.asStateFlow()

    private val _showSatisfactionSurvey = MutableStateFlow(false)
    val showSatisfactionSurvey = _showSatisfactionSurvey.asStateFlow()

    private val _showNotificationCenter = MutableStateFlow(false)
    val showNotificationCenter = _showNotificationCenter.asStateFlow()

    private val _showBroadcastDialog = MutableStateFlow(false)
    val showBroadcastDialog = _showBroadcastDialog.asStateFlow()

    private val _showFeedbackOverview = MutableStateFlow(false)
    val showFeedbackOverview = _showFeedbackOverview.asStateFlow()

    fun openRatingDialog(ticket: MaintenanceTicket) {
        _ratingTicket.value = ticket
    }

    fun closeRatingDialog() {
        _ratingTicket.value = null
    }

    fun openSatisfactionSurvey() {
        _showSatisfactionSurvey.value = true
    }

    fun closeSatisfactionSurvey() {
        _showSatisfactionSurvey.value = false
    }

    fun openNotificationCenter() {
        _showNotificationCenter.value = true
    }

    fun closeNotificationCenter() {
        _showNotificationCenter.value = false
    }

    fun openBroadcastDialog() {
        _showBroadcastDialog.value = true
    }

    fun closeBroadcastDialog() {
        _showBroadcastDialog.value = false
    }

    fun openFeedbackOverview() {
        _showFeedbackOverview.value = true
    }

    fun closeFeedbackOverview() {
        _showFeedbackOverview.value = false
    }


    // Feedback Toast / Snackbar
    private val _snackbarMessage = MutableStateFlow<String?>(null)
    val snackbarMessage = _snackbarMessage.asStateFlow()

    fun showSnackbar(message: String) {
        _snackbarMessage.value = message
    }

    fun clearSnackbar() {
        _snackbarMessage.value = null
    }

    // Role & Language Switchers
    fun toggleLanguage() {
        _currentLanguage.value = if (_currentLanguage.value == AppLanguage.EN) AppLanguage.ID else AppLanguage.EN
    }

    fun setLanguage(lang: AppLanguage) {
        _currentLanguage.value = lang
    }

    fun setRole(role: AppRole) {
        _currentRole.value = role
    }

    fun setAdminTab(tab: AdminTab) {
        _adminTab.value = tab
    }

    fun setTenantTab(tab: TenantTab) {
        _tenantTab.value = tab
    }

    fun selectTenant(residentId: String) {
        _selectedTenantId.value = residentId
    }

    // Room Operations
    fun saveRoom(
        id: String? = null,
        roomNumber: String,
        type: UnitType,
        floor: Int,
        monthlyRate: Double,
        status: UnitStatus,
        amenities: List<String>,
        sizeSqm: Double,
        notes: String
    ) {
        viewModelScope.launch {
            val roomId = id ?: "room_${UUID.randomUUID().toString().take(6)}"
            val meterId = "PLN-$roomNumber-${Random.nextInt(10000, 99999)}"
            val room = RoomUnit(
                id = roomId,
                roomNumber = roomNumber,
                type = type,
                floor = floor,
                monthlyRate = monthlyRate,
                status = status,
                amenities = amenities,
                sizeSqm = sizeSqm,
                electricityMeterId = meterId,
                notes = notes
            )
            repository.saveRoom(room)
            showSnackbar("Room $roomNumber saved successfully!")
        }
    }

    fun updateRoomStatus(roomId: String, newStatus: UnitStatus) {
        viewModelScope.launch {
            repository.updateRoomStatus(roomId, newStatus)
            showSnackbar("Room status updated to ${newStatus.labelEn}")
        }
    }

    fun deleteRoom(roomId: String) {
        viewModelScope.launch {
            repository.deleteRoom(roomId)
            showSnackbar("Room deleted successfully")
        }
    }

    // Resident Operations
    fun saveResident(
        id: String? = null,
        fullName: String,
        email: String,
        phone: String,
        roomNumber: String,
        moveInDate: String,
        leaseEndDate: String,
        monthlyRent: Double,
        depositAmount: Double,
        emergencyContact: String,
        emergencyPhone: String,
        ktpNumber: String,
        status: ResidentStatus = ResidentStatus.ACTIVE
    ) {
        viewModelScope.launch {
            val residentId = id ?: "res_${UUID.randomUUID().toString().take(6)}"
            val resident = Resident(
                id = residentId,
                fullName = fullName,
                email = email,
                phone = phone,
                roomNumber = roomNumber,
                moveInDate = moveInDate,
                leaseEndDate = leaseEndDate,
                monthlyRent = monthlyRent,
                depositAmount = depositAmount,
                emergencyContact = emergencyContact,
                emergencyPhone = emergencyPhone,
                ktpNumber = ktpNumber,
                status = status,
                avatarIndex = Random.nextInt(0, 6)
            )
            repository.saveResident(resident)
            showSnackbar("Resident ${resident.fullName} registered!")
        }
    }

    fun deleteResident(residentId: String) {
        viewModelScope.launch {
            repository.deleteResident(residentId)
            showSnackbar("Resident record archived")
        }
    }

    // Payment Operations
    fun recordPayment(
        residentId: String,
        residentName: String,
        roomNumber: String,
        amount: Double,
        type: PaymentType,
        status: PaymentStatus,
        paymentMethod: PaymentMethod,
        notes: String
    ) {
        viewModelScope.launch {
            val nowFormatted = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
            val payment = Payment(
                id = "pay_${UUID.randomUUID().toString().take(8)}",
                residentId = residentId,
                residentName = residentName,
                roomNumber = roomNumber,
                amount = amount,
                type = type,
                status = status,
                date = nowFormatted,
                dueDate = nowFormatted,
                paymentMethod = paymentMethod,
                receiptRef = "LW-${paymentMethod.name.take(3)}-${Random.nextInt(100000, 999999)}",
                notes = notes
            )
            repository.savePayment(payment)
            showSnackbar("Payment of Rp ${amount.toLong()} recorded!")
        }
    }

    fun confirmTenantPayment(paymentId: String, paymentMethod: PaymentMethod, proofDesc: String = "Digital Transfer Proof") {
        viewModelScope.launch {
            val existing = payments.value.find { it.id == paymentId }
            if (existing != null) {
                val updated = existing.copy(
                    status = PaymentStatus.PAID,
                    paymentMethod = paymentMethod,
                    receiptRef = "LW-${paymentMethod.name.take(3)}-${Random.nextInt(100000, 999999)}",
                    notes = "${existing.notes} (Paid & Confirmed online - $proofDesc)"
                )
                repository.updatePayment(updated)
                showSnackbar("Payment confirmed! Receipt generated.")
            }
        }
    }

    // Electricity Operations
    fun saveMeterReading(roomNumber: String, currentKwh: Double) {
        viewModelScope.launch {
            repository.saveMeterReading(roomNumber, currentKwh)
            showSnackbar("Meter reading for Room $roomNumber saved!")
        }
    }

    fun issueElectricityToken(roomNumber: String, amountRp: Double, residentName: String) {
        viewModelScope.launch {
            val token = repository.issueElectricityToken(roomNumber, amountRp, residentName)
            showSnackbar("Token issued: ${token.tokenCode} (${token.kwhAmount.toInt()} kWh)")
        }
    }

    // Maintenance Operations
    fun submitMaintenanceTicket(
        roomNumber: String,
        residentId: String,
        residentName: String,
        title: String,
        category: MaintenanceCategory,
        description: String,
        priority: MaintenancePriority,
        photoDesc: String?
    ) {
        viewModelScope.launch {
            val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
            val ticket = MaintenanceTicket(
                id = "tkt_${UUID.randomUUID().toString().take(8)}",
                roomNumber = roomNumber,
                residentId = residentId,
                residentName = residentName,
                title = title,
                category = category,
                description = description,
                priority = priority,
                status = MaintenanceStatus.REPORTED,
                reportedDate = nowFormatted,
                photoEvidenceDesc = photoDesc
            )
            repository.saveMaintenanceTicket(ticket)
            showSnackbar("Maintenance ticket submitted!")
        }
    }

    fun updateMaintenanceStatus(
        ticketId: String,
        newStatus: MaintenanceStatus,
        assignedTech: String? = null,
        estimatedCost: Double? = null,
        notes: String? = null
    ) {
        viewModelScope.launch {
            val existing = tickets.value.find { it.id == ticketId }
            if (existing != null) {
                val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
                val updated = existing.copy(
                    status = newStatus,
                    assignedTechnician = assignedTech ?: existing.assignedTechnician,
                    estimatedCost = estimatedCost ?: existing.estimatedCost,
                    resolvedDate = if (newStatus == MaintenanceStatus.RESOLVED) nowFormatted else existing.resolvedDate,
                    notes = notes ?: existing.notes
                )
                repository.updateMaintenanceTicket(updated)
                showSnackbar("Ticket status updated to ${newStatus.labelEn}")

                // Auto push notification to resident
                val nowTime = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
                val notifTitle: String
                val notifMsg: String
                val notifAction: NotificationAction?
                val priority: NotificationPriority

                when (newStatus) {
                    MaintenanceStatus.ASSIGNED -> {
                        notifTitle = "Technician Assigned"
                        notifMsg = "${updated.assignedTechnician ?: "Our technician"} has been assigned to '${updated.title}'."
                        notifAction = NotificationAction.VIEW_TICKET
                        priority = NotificationPriority.NORMAL
                    }
                    MaintenanceStatus.IN_PROGRESS -> {
                        notifTitle = "Maintenance In Progress"
                        notifMsg = "Work has started on ticket '${updated.title}' for Room ${updated.roomNumber}."
                        notifAction = NotificationAction.VIEW_TICKET
                        priority = NotificationPriority.IMPORTANT
                    }
                    MaintenanceStatus.RESOLVED -> {
                        notifTitle = "Ticket Resolved — Please Rate"
                        notifMsg = "Maintenance '${updated.title}' is marked resolved. How was your technician's service?"
                        notifAction = NotificationAction.RATE_MAINTENANCE
                        priority = NotificationPriority.IMPORTANT
                    }
                    MaintenanceStatus.CANCELLED -> {
                        notifTitle = "Ticket Cancelled"
                        notifMsg = "Maintenance ticket '${updated.title}' has been cancelled by management."
                        notifAction = NotificationAction.VIEW_TICKET
                        priority = NotificationPriority.NORMAL
                    }
                    MaintenanceStatus.REPORTED -> {
                        notifTitle = "Ticket Received"
                        notifMsg = "Your request '${updated.title}' is queued for review."
                        notifAction = NotificationAction.VIEW_TICKET
                        priority = NotificationPriority.NORMAL
                    }
                }

                val notif = AppNotification(
                    id = "notif_${UUID.randomUUID().toString().take(8)}",
                    recipientResidentId = updated.residentId,
                    recipientName = updated.residentName,
                    title = notifTitle,
                    message = notifMsg,
                    category = NotificationCategory.MAINTENANCE,
                    priority = priority,
                    timestamp = nowTime,
                    isRead = false,
                    actionType = notifAction,
                    actionPayload = updated.id
                )
                repository.sendNotification(notif)
            }
        }
    }

    // Feedback Submission
    fun submitServiceFeedback(
        ticket: MaintenanceTicket,
        rating: Int,
        aspects: List<String>,
        comment: String
    ) {
        viewModelScope.launch {
            val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
            val feedback = ServiceFeedback(
                id = "fb_${UUID.randomUUID().toString().take(8)}",
                ticketId = ticket.id,
                ticketTitle = ticket.title,
                residentId = ticket.residentId,
                residentName = ticket.residentName,
                roomNumber = ticket.roomNumber,
                technicianName = ticket.assignedTechnician,
                rating = rating,
                aspects = aspects,
                comment = comment,
                createdAt = nowFormatted
            )
            repository.saveServiceFeedback(feedback)
            closeRatingDialog()
            showSnackbar("Thank you! Your rating has been recorded.")
        }
    }

    // Satisfaction Survey Submission
    fun submitSatisfactionSurvey(
        residentId: String,
        residentName: String,
        roomNumber: String,
        surveyPeriod: String,
        overallRating: Int,
        cleanlinessRating: Int,
        staffResponsivenessRating: Int,
        amenitiesRating: Int,
        securityRating: Int,
        favoriteAspect: String,
        suggestions: String
    ) {
        viewModelScope.launch {
            val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
            val survey = SatisfactionSurvey(
                id = "srv_${UUID.randomUUID().toString().take(8)}",
                residentId = residentId,
                residentName = residentName,
                roomNumber = roomNumber,
                surveyPeriod = surveyPeriod,
                overallRating = overallRating,
                cleanlinessRating = cleanlinessRating,
                staffResponsivenessRating = staffResponsivenessRating,
                amenitiesRating = amenitiesRating,
                securityRating = securityRating,
                favoriteAspect = favoriteAspect,
                suggestions = suggestions,
                submittedAt = nowFormatted
            )
            repository.saveSatisfactionSurvey(survey)
            closeSatisfactionSurvey()
            showSnackbar("Survey submitted! We appreciate your feedback.")
        }
    }

    // Notifications Management
    fun sendBroadcastAnnouncement(
        title: String,
        message: String,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) {
        viewModelScope.launch {
            val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
            val notif = AppNotification(
                id = "notif_${UUID.randomUUID().toString().take(8)}",
                recipientResidentId = null, // broadcast to all
                recipientName = null,
                title = title,
                message = message,
                category = NotificationCategory.ANNOUNCEMENT,
                priority = priority,
                timestamp = nowFormatted,
                isRead = false,
                actionType = NotificationAction.VIEW_ANNOUNCEMENT
            )
            repository.sendNotification(notif)
            closeBroadcastDialog()
            showSnackbar("Broadcast notification sent to all residents!")
        }
    }

    fun markNotificationAsRead(notificationId: String) {
        viewModelScope.launch {
            repository.markNotificationAsRead(notificationId)
        }
    }

    fun markAllNotificationsAsRead() {
        viewModelScope.launch {
            val tenant = currentTenant.value
            val role = currentRole.value
            repository.markAllNotificationsAsRead(if (role == AppRole.ADMIN) null else tenant?.id)
            showSnackbar("All notifications marked as read")
        }
    }

    fun deleteNotification(notificationId: String) {
        viewModelScope.launch {
            repository.deleteNotification(notificationId)
        }
    }

    // Simulate Push Events (for testing & demo)
    fun simulatePushEvent(eventType: String) {
        viewModelScope.launch {
            val tenant = currentTenant.value ?: return@launch
            val nowFormatted = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(Date())
            val notif: AppNotification = when (eventType) {
                "RENT_DUE" -> {
                    AppNotification(
                        id = "notif_${UUID.randomUUID().toString().take(8)}",
                        recipientResidentId = tenant.id,
                        recipientName = tenant.fullName,
                        title = "Monthly Rent Due in 3 Days",
                        message = "Your rent payment for Unit ${tenant.roomNumber} is due on 1st. Tap to pay via QRIS or Bank Transfer.",
                        category = NotificationCategory.RENT_DUE,
                        priority = NotificationPriority.IMPORTANT,
                        timestamp = nowFormatted,
                        isRead = false,
                        actionType = NotificationAction.VIEW_BILLS
                    )
                }
                "ELECTRICITY_LOW" -> {
                    AppNotification(
                        id = "notif_${UUID.randomUUID().toString().take(8)}",
                        recipientResidentId = tenant.id,
                        recipientName = tenant.fullName,
                        title = "Low Electricity Balance Warning",
                        message = "Your room PLN meter for Room ${tenant.roomNumber} is below 15 kWh. Purchase a token to avoid interruption.",
                        category = NotificationCategory.ELECTRICITY,
                        priority = NotificationPriority.URGENT,
                        timestamp = nowFormatted,
                        isRead = false,
                        actionType = NotificationAction.VIEW_ELECTRICITY
                    )
                }
                "SURVEY_PROMPT" -> {
                    AppNotification(
                        id = "notif_${UUID.randomUUID().toString().take(8)}",
                        recipientResidentId = tenant.id,
                        recipientName = tenant.fullName,
                        title = "Quarterly Tenant Satisfaction Survey",
                        message = "Share your thoughts on living at Lewi House in our quick 2-minute survey.",
                        category = NotificationCategory.SURVEY,
                        priority = NotificationPriority.NORMAL,
                        timestamp = nowFormatted,
                        isRead = false,
                        actionType = NotificationAction.OPEN_SURVEY
                    )
                }
                else -> {
                    AppNotification(
                        id = "notif_${UUID.randomUUID().toString().take(8)}",
                        recipientResidentId = null,
                        recipientName = null,
                        title = "Notice: Rooftop Garden Social",
                        message = "Join your fellow neighbors this Friday 7:00 PM on the 3rd floor lounge for complimentary refreshments.",
                        category = NotificationCategory.ANNOUNCEMENT,
                        priority = NotificationPriority.NORMAL,
                        timestamp = nowFormatted,
                        isRead = false,
                        actionType = NotificationAction.VIEW_ANNOUNCEMENT
                    )
                }
            }
            repository.sendNotification(notif)
            showSnackbar("Simulated push notification received: ${notif.title}")
        }
    }

    // Transfer Calculator Execution
    fun executeRoomTransfer(calculation: RoomTransferCalculation) {
        viewModelScope.launch {
            repository.executeRoomTransfer(calculation)
            showSnackbar("Room transfer to ${calculation.toRoomNumber} applied successfully!")
        }
    }
}

