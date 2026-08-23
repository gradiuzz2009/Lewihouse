package com.example.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.*
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.data.language.StringsDict
import com.example.data.model.*
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationCenterSheet(
    notifications: List<AppNotification>,
    unreadCount: Int,
    strings: StringsDict,
    onDismiss: () -> Unit,
    onMarkAsRead: (String) -> Unit,
    onMarkAllAsRead: () -> Unit,
    onDeleteNotification: (String) -> Unit,
    onActionClicked: (NotificationAction, String?) -> Unit,
    onSimulatePush: (String) -> Unit
) {
    var selectedFilter by remember { mutableStateOf("ALL") } // ALL, UNREAD, MAINTENANCE, BILLS, ANNOUNCEMENTS
    var showSimulatePanel by remember { mutableStateOf(false) }

    val filteredNotifications = remember(notifications, selectedFilter) {
        when (selectedFilter) {
            "UNREAD" -> notifications.filter { !it.isRead }
            "MAINTENANCE" -> notifications.filter { it.category == NotificationCategory.MAINTENANCE }
            "BILLS" -> notifications.filter { it.category == NotificationCategory.RENT_DUE }
            "ANNOUNCEMENTS" -> notifications.filter { it.category == NotificationCategory.ANNOUNCEMENT }
            else -> notifications
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color.White,
        modifier = Modifier.testTag("sheet_notification_center")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
                .padding(horizontal = 20.dp)
        ) {
            // Sheet Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(Navy800.copy(alpha = 0.08f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = null,
                            tint = Navy800,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Column {
                        Text(
                            text = strings.notifications,
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                color = Navy800
                            )
                        )
                        Text(
                            text = if (unreadCount > 0) "$unreadCount unread notifications" else "All caught up",
                            style = MaterialTheme.typography.bodySmall.copy(color = SleekTextSecondary)
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (unreadCount > 0) {
                        TextButton(
                            onClick = onMarkAllAsRead,
                            modifier = Modifier.testTag("btn_mark_all_read")
                        ) {
                            Text(
                                text = strings.markAllRead,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, color = Navy800)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Simulation Accordion Trigger
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Slate50,
                border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { showSimulatePanel = !showSimulatePanel }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Bolt,
                            contentDescription = null,
                            tint = Gold600,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = strings.simulateEvents,
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate700
                            )
                        )
                    }
                    Icon(
                        imageVector = if (showSimulatePanel) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = null,
                        tint = Slate500
                    )
                }
            }

            // Simulated push buttons
            AnimatedVisibility(visible = showSimulatePanel) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp, bottom = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        SimulationButton("💳 Rent Due", "RENT_DUE", onSimulatePush, Modifier.weight(1f))
                        SimulationButton("⚡ Low PLN", "ELECTRICITY_LOW", onSimulatePush, Modifier.weight(1f))
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        SimulationButton("📋 Survey Prompt", "SURVEY_PROMPT", onSimulatePush, Modifier.weight(1f))
                        SimulationButton("📢 Announcement", "ANNOUNCEMENT", onSimulatePush, Modifier.weight(1f))
                    }
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Filter Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                NotificationFilterChip("All", selectedFilter == "ALL") { selectedFilter = "ALL" }
                NotificationFilterChip("Unread", selectedFilter == "UNREAD") { selectedFilter = "UNREAD" }
                NotificationFilterChip("Maintenance", selectedFilter == "MAINTENANCE") { selectedFilter = "MAINTENANCE" }
                NotificationFilterChip("Bills", selectedFilter == "BILLS") { selectedFilter = "BILLS" }
                NotificationFilterChip("Notices", selectedFilter == "ANNOUNCEMENTS") { selectedFilter = "ANNOUNCEMENTS" }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Notifications List
            if (filteredNotifications.isEmpty()) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.NotificationsNone,
                            contentDescription = null,
                            tint = Slate300,
                            modifier = Modifier.size(48.dp)
                        )
                        Text(
                            text = strings.noNotifications,
                            style = MaterialTheme.typography.bodyMedium.copy(color = SleekTextSecondary)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    contentPadding = PaddingValues(bottom = 24.dp)
                ) {
                    items(filteredNotifications, key = { it.id }) { notif ->
                        NotificationItemCard(
                            notification = notif,
                            strings = strings,
                            onMarkAsRead = { onMarkAsRead(notif.id) },
                            onDelete = { onDeleteNotification(notif.id) },
                            onActionClicked = { action, payload ->
                                onMarkAsRead(notif.id)
                                onActionClicked(action, payload)
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun NotificationFilterChip(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val haptic = LocalHapticFeedback.current
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = if (isSelected) Navy800 else Slate100,
        modifier = Modifier
            .minimumInteractiveComponentSize()
            .clickable(
                role = Role.Tab,
                onClickLabel = "Filter by $label"
            ) {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onClick()
            }
            .testTag("filter_chip_$label")
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) Color.White else Slate700,
                fontSize = 11.sp
            ),
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
        )
    }
}

@Composable
fun SimulationButton(
    label: String,
    type: String,
    onSimulate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = Slate100,
        modifier = modifier
            .clickable { onSimulate(type) }
            .testTag("btn_sim_$type")
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.SemiBold,
                color = Slate800,
                fontSize = 11.sp
            ),
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
        )
    }
}

@Composable
fun NotificationItemCard(
    notification: AppNotification,
    strings: StringsDict,
    onMarkAsRead: () -> Unit,
    onDelete: () -> Unit,
    onActionClicked: (NotificationAction, String?) -> Unit
) {
    val categoryIcon = when (notification.category) {
        NotificationCategory.MAINTENANCE -> Icons.Default.Build
        NotificationCategory.RENT_DUE -> Icons.Default.Payment
        NotificationCategory.ELECTRICITY -> Icons.Default.ElectricBolt
        NotificationCategory.ANNOUNCEMENT -> Icons.Default.Campaign
        NotificationCategory.SURVEY -> Icons.Default.Poll
    }

    val iconColor = when (notification.priority) {
        NotificationPriority.URGENT -> MaterialTheme.colorScheme.error
        NotificationPriority.IMPORTANT -> Gold600
        else -> Navy800
    }

    Surface(
        shape = RoundedCornerShape(16.dp),
        color = if (!notification.isRead) Slate50.copy(alpha = 0.95f) else Color.White,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (!notification.isRead) Navy800.copy(alpha = 0.25f) else Slate200
        ),
        modifier = Modifier
            .fillMaxWidth()
            .clickable {
                if (!notification.isRead) onMarkAsRead()
                if (notification.actionType != null) {
                    onActionClicked(notification.actionType, notification.actionPayload)
                }
            }
            .testTag("notif_card_${notification.id}")
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header Row: Category Badge, Priority Tag, Time, Unread Dot
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(CircleShape)
                            .background(iconColor.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = categoryIcon,
                            contentDescription = null,
                            tint = iconColor,
                            modifier = Modifier.size(15.dp)
                        )
                    }

                    if (notification.priority == NotificationPriority.URGENT) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.error
                        ) {
                            Text(
                                text = "URGENT",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White
                                ),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    } else if (notification.priority == NotificationPriority.IMPORTANT) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Gold500.copy(alpha = 0.20f)
                        ) {
                            Text(
                                text = "IMPORTANT",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Gold600
                                ),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = notification.timestamp,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontSize = 10.sp,
                            color = SleekTextSecondary
                        )
                    )
                    if (!notification.isRead) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(Navy800)
                        )
                    }
                    IconButton(
                        onClick = onDelete,
                        modifier = Modifier.size(48.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Delete notification",
                            tint = Slate500,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Notification Title & Message
            Text(
                text = notification.title,
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = Navy800
                )
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = notification.message,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = Slate700,
                    lineHeight = 18.sp
                )
            )

            // Action Affordance Button
            if (notification.actionType != null) {
                Spacer(modifier = Modifier.height(10.dp))
                val actionLabel = when (notification.actionType) {
                    NotificationAction.RATE_MAINTENANCE -> "★ Rate Service Now"
                    NotificationAction.VIEW_BILLS -> "Pay Rent Due"
                    NotificationAction.VIEW_ELECTRICITY -> "Purchase Electricity"
                    NotificationAction.OPEN_SURVEY -> "Take 2-Min Survey"
                    NotificationAction.VIEW_TICKET -> "View Maintenance Ticket"
                    NotificationAction.VIEW_ANNOUNCEMENT -> "View Details"
                }

                val buttonColor = when (notification.actionType) {
                    NotificationAction.RATE_MAINTENANCE -> Gold600
                    NotificationAction.VIEW_BILLS -> Navy800
                    NotificationAction.OPEN_SURVEY -> Emerald700
                    else -> Navy800
                }

                Button(
                    onClick = {
                        onActionClicked(notification.actionType, notification.actionPayload)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = buttonColor),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                    modifier = Modifier.height(34.dp)
                ) {
                    Text(
                        text = actionLabel,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold)
                    )
                }
            }
        }
    }
}

@Composable
fun BroadcastNotificationDialog(
    strings: StringsDict,
    onDismiss: () -> Unit,
    onSendBroadcast: (title: String, message: String, priority: NotificationPriority) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf(NotificationPriority.NORMAL) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth(0.92f)
                .padding(vertical = 24.dp)
                .testTag("dialog_broadcast_notification")
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Navy800.copy(alpha = 0.08f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Campaign,
                                contentDescription = null,
                                tint = Navy800,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Column {
                            Text(
                                text = strings.broadcastAnnouncement,
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Navy800
                                )
                            )
                            Text(
                                text = "Push notification to all active residents",
                                style = MaterialTheme.typography.labelSmall.copy(color = SleekTextSecondary)
                            )
                        }
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Slate500)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Title Input
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text(strings.broadcastTitle) },
                    placeholder = { Text("e.g. Scheduled Water Tank Cleaning Tomorrow") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_broadcast_title"),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Priority Selection
                Text(
                    text = "Priority Level",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold, color = Navy800)
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    NotificationPriority.values().forEach { p ->
                        val isSelected = p == priority
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = if (isSelected) Navy800 else Slate100,
                            modifier = Modifier
                                .weight(1f)
                                .clickable { priority = p }
                                .testTag("priority_${p.name}")
                        ) {
                            Text(
                                text = p.name,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) Color.White else Slate700
                                ),
                                modifier = Modifier.padding(vertical = 8.dp),
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Message Body Input
                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it },
                    label = { Text(strings.broadcastMessage) },
                    placeholder = { Text("Enter the full announcement text that tenants will see on their phones...") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("input_broadcast_message"),
                    minLines = 4,
                    maxLines = 6,
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Send Button
                Button(
                    onClick = {
                        if (title.isNotBlank() && message.isNotBlank()) {
                            onSendBroadcast(title, message, priority)
                        }
                    },
                    enabled = title.isNotBlank() && message.isNotBlank(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("btn_send_broadcast"),
                    colors = ButtonDefaults.buttonColors(containerColor = Navy800),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(strings.sendBroadcast, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
