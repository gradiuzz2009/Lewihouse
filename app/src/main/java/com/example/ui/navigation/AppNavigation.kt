package com.example.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.language.LanguageManager
import com.example.data.model.NotificationAction
import com.example.ui.components.*
import com.example.ui.screens.admin.*
import com.example.ui.screens.tenant.*
import com.example.ui.theme.*
import com.example.ui.viewmodels.AdminTab
import com.example.ui.viewmodels.AppRole
import com.example.ui.viewmodels.AppViewModel
import com.example.ui.viewmodels.TenantTab

@Composable
fun AppNavigation(viewModel: AppViewModel) {
    val currentRole by viewModel.currentRole.collectAsState()
    val currentLanguage by viewModel.currentLanguage.collectAsState()
    val adminTab by viewModel.adminTab.collectAsState()
    val tenantTab by viewModel.tenantTab.collectAsState()
    val snackbarMessage by viewModel.snackbarMessage.collectAsState()

    val currentTenant by viewModel.currentTenant.collectAsState()
    val notifications by viewModel.currentTenantNotifications.collectAsState()
    val unreadNotifCount by viewModel.unreadNotificationCount.collectAsState()
    val showNotifSheet by viewModel.showNotificationCenter.collectAsState()
    val ticketForRating by viewModel.ticketToRate.collectAsState()
    val showSurveyDialog by viewModel.showSatisfactionSurveyDialog.collectAsState()
    val showBroadcastDialog by viewModel.showBroadcastAnnouncementDialog.collectAsState()
    val showFeedbackOverview by viewModel.showAdminFeedbackOverview.collectAsState()
    val allFeedbacks by viewModel.feedbacks.collectAsState()
    val allSurveys by viewModel.surveys.collectAsState()

    val strings = LanguageManager.getStrings(currentLanguage)
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(snackbarMessage) {
        snackbarMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearSnackbar()
        }
    }

    Scaffold(
        topBar = {
            AppHeaderBar(
                currentRole = currentRole,
                currentLanguage = currentLanguage,
                strings = strings,
                unreadNotificationsCount = unreadNotifCount,
                onOpenNotifications = { viewModel.openNotificationCenter() },
                onToggleLanguage = { viewModel.toggleLanguage() },
                onSwitchRole = { newRole -> viewModel.setRole(newRole) }
            )
        },
        bottomBar = {
            Surface(
                color = Color.White,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    HorizontalDivider(color = Slate100, thickness = 1.dp)
                    if (currentRole == AppRole.ADMIN) {
                        NavigationBar(
                            containerColor = Color.White,
                            tonalElevation = 0.dp,
                            modifier = Modifier.testTag("admin_bottom_nav")
                        ) {
                            NavigationBarItem(
                                selected = adminTab == AdminTab.DASHBOARD,
                                onClick = { viewModel.setAdminTab(AdminTab.DASHBOARD) },
                                icon = { Icon(Icons.Default.Dashboard, contentDescription = strings.dashboard) },
                                label = { Text(strings.dashboard, maxLines = 1, fontSize = 10.sp, fontWeight = if (adminTab == AdminTab.DASHBOARD) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                            NavigationBarItem(
                                selected = adminTab == AdminTab.ROOMS,
                                onClick = { viewModel.setAdminTab(AdminTab.ROOMS) },
                                icon = { Icon(Icons.Default.MeetingRoom, contentDescription = strings.rooms) },
                                label = { Text(strings.rooms, maxLines = 1, fontSize = 10.sp, fontWeight = if (adminTab == AdminTab.ROOMS) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                            NavigationBarItem(
                                selected = adminTab == AdminTab.RESIDENTS,
                                onClick = { viewModel.setAdminTab(AdminTab.RESIDENTS) },
                                icon = { Icon(Icons.Default.People, contentDescription = strings.residents) },
                                label = { Text(strings.residents, maxLines = 1, fontSize = 10.sp, fontWeight = if (adminTab == AdminTab.RESIDENTS) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                            NavigationBarItem(
                                selected = adminTab == AdminTab.FINANCE,
                                onClick = { viewModel.setAdminTab(AdminTab.FINANCE) },
                                icon = { Icon(Icons.Default.AccountBalanceWallet, contentDescription = strings.finance) },
                                label = { Text(strings.finance, maxLines = 1, fontSize = 10.sp, fontWeight = if (adminTab == AdminTab.FINANCE) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                            NavigationBarItem(
                                selected = adminTab == AdminTab.TRANSFER_CALCULATOR,
                                onClick = { viewModel.setAdminTab(AdminTab.TRANSFER_CALCULATOR) },
                                icon = { Icon(Icons.Default.Calculate, contentDescription = strings.calculator) },
                                label = { Text("Transfer", maxLines = 1, fontSize = 10.sp, fontWeight = if (adminTab == AdminTab.TRANSFER_CALCULATOR) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Gold600,
                                    selectedTextColor = Gold600,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Gold500.copy(alpha = 0.12f)
                                )
                            )
                            NavigationBarItem(
                                selected = adminTab == AdminTab.ELECTRICITY,
                                onClick = { viewModel.setAdminTab(AdminTab.ELECTRICITY) },
                                icon = { Icon(Icons.Default.ElectricBolt, contentDescription = strings.electricity) },
                                label = { Text("PLN", maxLines = 1, fontSize = 10.sp, fontWeight = if (adminTab == AdminTab.ELECTRICITY) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                            NavigationBarItem(
                                selected = adminTab == AdminTab.MAINTENANCE,
                                onClick = { viewModel.setAdminTab(AdminTab.MAINTENANCE) },
                                icon = { Icon(Icons.Default.Build, contentDescription = strings.maintenance) },
                                label = { Text("Fixes", maxLines = 1, fontSize = 10.sp, fontWeight = if (adminTab == AdminTab.MAINTENANCE) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                        }
                    } else {
                        NavigationBar(
                            containerColor = Color.White,
                            tonalElevation = 0.dp,
                            modifier = Modifier.testTag("tenant_bottom_nav")
                        ) {
                            NavigationBarItem(
                                selected = tenantTab == TenantTab.HOME,
                                onClick = { viewModel.setTenantTab(TenantTab.HOME) },
                                icon = { Icon(Icons.Default.Home, contentDescription = strings.dashboard) },
                                label = { Text("Home", maxLines = 1, fontSize = 10.sp, fontWeight = if (tenantTab == TenantTab.HOME) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                            NavigationBarItem(
                                selected = tenantTab == TenantTab.BILLS,
                                onClick = { viewModel.setTenantTab(TenantTab.BILLS) },
                                icon = { Icon(Icons.Default.Payment, contentDescription = strings.myBills) },
                                label = { Text(strings.myBills, maxLines = 1, fontSize = 10.sp, fontWeight = if (tenantTab == TenantTab.BILLS) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                            NavigationBarItem(
                                selected = tenantTab == TenantTab.ELECTRICITY,
                                onClick = { viewModel.setTenantTab(TenantTab.ELECTRICITY) },
                                icon = { Icon(Icons.Default.ElectricBolt, contentDescription = strings.electricity) },
                                label = { Text("PLN", maxLines = 1, fontSize = 10.sp, fontWeight = if (tenantTab == TenantTab.ELECTRICITY) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Gold600,
                                    selectedTextColor = Gold600,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Gold500.copy(alpha = 0.12f)
                                )
                            )
                            NavigationBarItem(
                                selected = tenantTab == TenantTab.MAINTENANCE,
                                onClick = { viewModel.setTenantTab(TenantTab.MAINTENANCE) },
                                icon = { Icon(Icons.Default.Build, contentDescription = strings.maintenance) },
                                label = { Text(strings.maintenance, maxLines = 1, fontSize = 10.sp, fontWeight = if (tenantTab == TenantTab.MAINTENANCE) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                            NavigationBarItem(
                                selected = tenantTab == TenantTab.PROFILE,
                                onClick = { viewModel.setTenantTab(TenantTab.PROFILE) },
                                icon = { Icon(Icons.Default.Person, contentDescription = strings.profile) },
                                label = { Text(strings.profile, maxLines = 1, fontSize = 10.sp, fontWeight = if (tenantTab == TenantTab.PROFILE) FontWeight.Bold else FontWeight.Medium) },
                                colors = NavigationBarItemDefaults.colors(
                                    selectedIconColor = Navy800,
                                    selectedTextColor = Navy800,
                                    unselectedIconColor = Slate400,
                                    unselectedTextColor = Slate400,
                                    indicatorColor = Navy800.copy(alpha = 0.10f)
                                )
                            )
                        }
                    }
                }
            }
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            if (currentRole == AppRole.ADMIN) {
                when (adminTab) {
                    AdminTab.DASHBOARD -> AdminDashboardScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage,
                        onNavigateTab = { viewModel.setAdminTab(it) }
                    )
                    AdminTab.ROOMS -> AdminRoomsScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                    AdminTab.RESIDENTS -> AdminResidentsScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                    AdminTab.FINANCE -> AdminFinanceScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                    AdminTab.TRANSFER_CALCULATOR -> AdminTransferCalculatorScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                    AdminTab.ELECTRICITY -> AdminElectricityScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                    AdminTab.MAINTENANCE -> AdminMaintenanceScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                }
            } else {
                when (tenantTab) {
                    TenantTab.HOME -> TenantHomeScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage,
                        onNavigateTab = { viewModel.setTenantTab(it) }
                    )
                    TenantTab.BILLS -> TenantPaymentsScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                    TenantTab.ELECTRICITY -> TenantElectricityScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                    TenantTab.MAINTENANCE -> TenantMaintenanceScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                    TenantTab.PROFILE -> TenantProfileScreen(
                        viewModel = viewModel,
                        strings = strings,
                        language = currentLanguage
                    )
                }
            }
        }
    }

    // Modal Bottom Sheet: Notification Center
    if (showNotifSheet) {
        NotificationCenterSheet(
            notifications = notifications,
            unreadCount = unreadNotifCount,
            strings = strings,
            onDismiss = { viewModel.closeNotificationCenter() },
            onMarkAsRead = { id -> viewModel.markNotificationAsRead(id) },
            onMarkAllAsRead = { viewModel.markAllNotificationsAsRead() },
            onDeleteNotification = { id -> viewModel.deleteNotification(id) },
            onActionClicked = { action, payload ->
                viewModel.closeNotificationCenter()
                when (action) {
                    NotificationAction.RATE_MAINTENANCE -> {
                        val ticket = viewModel.tickets.value.find { it.id == payload }
                        if (ticket != null) {
                            viewModel.openRatingDialog(ticket)
                        } else {
                            viewModel.setTenantTab(TenantTab.MAINTENANCE)
                        }
                    }
                    NotificationAction.VIEW_BILLS -> {
                        viewModel.setTenantTab(TenantTab.BILLS)
                    }
                    NotificationAction.VIEW_ELECTRICITY -> {
                        viewModel.setTenantTab(TenantTab.ELECTRICITY)
                    }
                    NotificationAction.OPEN_SURVEY -> {
                        viewModel.openSatisfactionSurvey()
                    }
                    NotificationAction.VIEW_TICKET -> {
                        viewModel.setTenantTab(TenantTab.MAINTENANCE)
                    }
                    NotificationAction.VIEW_ANNOUNCEMENT -> {
                        // Dismissed
                    }
                }
            },
            onSimulatePush = { eventType ->
                viewModel.simulatePushEvent(eventType)
            }
        )
    }

    // Dialog: Service Feedback Rating Dialog (for resolved tickets)
    ticketForRating?.let { ticket ->
        ServiceFeedbackRatingDialog(
            ticket = ticket,
            strings = strings,
            onDismiss = { viewModel.closeRatingDialog() },
            onSubmit = { rating, aspects, comment ->
                val tenantObj = currentTenant
                viewModel.submitServiceFeedback(
                    ticketId = ticket.id,
                    ticketTitle = ticket.title,
                    technicianName = ticket.assignedTechnician ?: "In-house Maintenance Team",
                    residentId = tenantObj?.id ?: ticket.residentId,
                    residentName = tenantObj?.fullName ?: ticket.residentName,
                    roomNumber = tenantObj?.roomNumber ?: ticket.roomNumber,
                    rating = rating,
                    aspects = aspects,
                    comment = comment
                )
            }
        )
    }

    // Dialog: Quarterly Satisfaction Survey Dialog
    if (showSurveyDialog) {
        val tenantObj = currentTenant
        SatisfactionSurveyDialog(
            strings = strings,
            residentName = tenantObj?.fullName ?: "Fauzie Ali Akhmad",
            roomNumber = tenantObj?.roomNumber ?: "204",
            onDismiss = { viewModel.closeSatisfactionSurvey() },
            onSubmit = { overall, cleanliness, speed, amenities, security, comments, wouldRecommend ->
                viewModel.submitSatisfactionSurvey(
                    residentId = tenantObj?.id ?: "res_204",
                    residentName = tenantObj?.fullName ?: "Fauzie Ali Akhmad",
                    roomNumber = tenantObj?.roomNumber ?: "204",
                    overallRating = overall,
                    cleanlinessRating = cleanliness,
                    maintenanceSpeedRating = speed,
                    amenitiesRating = amenities,
                    securityRating = security,
                    comments = comments,
                    wouldRecommend = wouldRecommend
                )
            }
        )
    }

    // Dialog: Admin Broadcast Push Notification
    if (showBroadcastDialog) {
        BroadcastNotificationDialog(
            strings = strings,
            onDismiss = { viewModel.closeBroadcastDialog() },
            onSendBroadcast = { title, message, priority ->
                viewModel.broadcastAnnouncement(title, message, priority)
            }
        )
    }

    // Dialog: Admin Feedback & CSAT Overview
    if (showFeedbackOverview) {
        AdminFeedbackOverviewDialog(
            feedbacks = allFeedbacks,
            surveys = allSurveys,
            strings = strings,
            onDismiss = { viewModel.closeFeedbackOverview() }
        )
    }
}

