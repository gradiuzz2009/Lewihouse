package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.data.language.AppLanguage
import com.example.data.language.StringsDict
import com.example.data.model.*
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppRole

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppHeaderBar(
    currentRole: AppRole,
    currentLanguage: AppLanguage,
    strings: StringsDict,
    unreadNotificationsCount: Int = 0,
    onOpenNotifications: () -> Unit = {},
    onToggleLanguage: () -> Unit,
    onSwitchRole: (AppRole) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = Color.White,
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Brand Title & Logo (Sleek Avatar "LH")
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Navy800),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "LH",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White,
                                fontSize = 14.sp
                            )
                        )
                    }
                    Column {
                        Text(
                            text = "Lewi House",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Navy800
                            )
                        )
                        Text(
                            text = if (currentRole == AppRole.ADMIN) "ADMIN PORTAL" else "TENANT PORTAL",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 1.sp,
                                color = SleekTextSecondary,
                                fontSize = 9.sp
                            )
                        )
                    }
                }

                // Controls: Notification Bell, Language Toggle & Role Switcher
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Notification Bell Icon with Badge
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Slate100)
                            .clickable { onOpenNotifications() }
                            .testTag("btn_open_notifications"),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = strings.notifications,
                            tint = if (unreadNotificationsCount > 0) Navy800 else Slate600,
                            modifier = Modifier.size(18.dp)
                        )
                        if (unreadNotificationsCount > 0) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .padding(top = 2.dp, end = 2.dp)
                                    .size(14.dp)
                                    .clip(CircleShape)
                                    .background(Crimson600),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = if (unreadNotificationsCount > 9) "9+" else unreadNotificationsCount.toString(),
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = Color.White,
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                        }
                    }

                    // Language Toggle Pill
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = Color.White,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
                        modifier = Modifier
                            .testTag("btn_toggle_language")
                            .clickable { onToggleLanguage() }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = currentLanguage.name,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Slate700
                                )
                            )
                        }
                    }

                    // Role Switcher Button
                    Surface(
                        shape = RoundedCornerShape(20.dp),
                        color = if (currentRole == AppRole.ADMIN) Navy800 else Gold500,
                        modifier = Modifier
                            .testTag("btn_switch_role")
                            .clickable {
                                val newRole = if (currentRole == AppRole.ADMIN) AppRole.TENANT else AppRole.ADMIN
                                onSwitchRole(newRole)
                            }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = if (currentRole == AppRole.ADMIN) Icons.Default.Person else Icons.Default.AdminPanelSettings,
                                contentDescription = "Switch Role",
                                tint = Color.White,
                                modifier = Modifier.size(15.dp)
                            )
                            Text(
                                text = if (currentRole == AppRole.ADMIN) "Tenant" else "Admin",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            )
                        }
                    }
                }
            }
            // Crisp bottom hair-line border
            HorizontalDivider(color = Slate100, thickness = 1.dp)
        }
    }
}


@Composable
fun StatMetricCard(
    title: String,
    value: String,
    icon: ImageVector,
    iconBgColor: Color,
    iconTint: Color,
    modifier: Modifier = Modifier,
    subValue: String? = null,
    subValueColor: Color = SleekTextSecondary
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, Slate100),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(iconBgColor),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconTint,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
            Column {
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = SleekTextPrimary
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodySmall,
                    color = SleekTextSecondary
                )
                if (subValue != null) {
                    Text(
                        text = subValue,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = subValueColor
                    )
                }
            }
        }
    }
}

@Composable
fun StatusBadge(
    statusText: String,
    containerColor: Color,
    textColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        shape = RoundedCornerShape(8.dp),
        color = containerColor,
        modifier = modifier
    ) {
        Text(
            text = statusText,
            style = MaterialTheme.typography.labelSmall.copy(
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            ),
            color = textColor,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
        )
    }
}

@Composable
fun UnitStatusBadge(status: UnitStatus, strings: StringsDict) {
    when (status) {
        UnitStatus.OCCUPIED -> StatusBadge(
            statusText = strings.occupied,
            containerColor = Navy100,
            textColor = Navy800
        )
        UnitStatus.VACANT -> StatusBadge(
            statusText = strings.vacant,
            containerColor = Emerald100,
            textColor = Emerald700
        )
        UnitStatus.MAINTENANCE -> StatusBadge(
            statusText = strings.underMaintenance,
            containerColor = Gold100,
            textColor = Gold600
        )
    }
}

@Composable
fun PaymentStatusBadge(status: PaymentStatus, strings: StringsDict) {
    when (status) {
        PaymentStatus.PAID -> StatusBadge(
            statusText = strings.paid,
            containerColor = Emerald100,
            textColor = Emerald700
        )
        PaymentStatus.PENDING -> StatusBadge(
            statusText = strings.pending,
            containerColor = Gold100,
            textColor = Gold600
        )
        PaymentStatus.OVERDUE -> StatusBadge(
            statusText = strings.overdue,
            containerColor = Rose100,
            textColor = Rose700
        )
    }
}

@Composable
fun PriorityBadge(priority: MaintenancePriority, strings: StringsDict) {
    val (bgColor, txtColor, label) = when (priority) {
        MaintenancePriority.LOW -> Triple(Slate100, Slate700, strings.low)
        MaintenancePriority.MEDIUM -> Triple(Navy100, Navy800, strings.medium)
        MaintenancePriority.HIGH -> Triple(Gold100, Gold600, strings.high)
        MaintenancePriority.EMERGENCY -> Triple(Rose100, Rose700, strings.emergency)
    }
    StatusBadge(statusText = label, containerColor = bgColor, textColor = txtColor)
}

@Composable
fun TicketStatusBadge(status: MaintenanceStatus, strings: StringsDict) {
    val (bgColor, txtColor, label) = when (status) {
        MaintenanceStatus.REPORTED -> Triple(Slate100, Slate700, strings.reported)
        MaintenanceStatus.ASSIGNED -> Triple(Navy100, Navy800, strings.assigned)
        MaintenanceStatus.IN_PROGRESS -> Triple(Gold100, Gold600, strings.inProgress)
        MaintenanceStatus.RESOLVED -> Triple(Emerald100, Emerald700, strings.resolved)
    }
    StatusBadge(statusText = label, containerColor = bgColor, textColor = txtColor)
}
