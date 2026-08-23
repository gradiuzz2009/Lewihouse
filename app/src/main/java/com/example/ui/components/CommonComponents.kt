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
    TopAppBar(
        title = {
            Column {
                Text(
                    text = "Lewi House",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = if (currentRole == AppRole.ADMIN) "Admin" else "Tenant",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        actions = {
            // Notification Bell
            IconButton(onClick = onOpenNotifications, modifier = Modifier.testTag("btn_open_notifications")) {
                BadgedBox(
                    badge = {
                        if (unreadNotificationsCount > 0) {
                            Badge { Text(unreadNotificationsCount.toString()) }
                        }
                    }
                ) {
                    Icon(
                        imageVector = Icons.Default.Notifications,
                        contentDescription = strings.notifications
                    )
                }
            }

            // Language Toggle
            TextButton(onClick = onToggleLanguage, modifier = Modifier.testTag("btn_toggle_language")) {
                Text(currentLanguage.name, fontWeight = FontWeight.Bold)
            }

            // Role Switcher
            IconButton(
                onClick = {
                    onSwitchRole(if (currentRole == AppRole.ADMIN) AppRole.TENANT else AppRole.ADMIN)
                },
                modifier = Modifier.testTag("btn_switch_role")
            ) {
                Icon(
                    imageVector = if (currentRole == AppRole.ADMIN) Icons.Default.AdminPanelSettings else Icons.Default.Person,
                    contentDescription = "Switch Role",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface,
            titleContentColor = MaterialTheme.colorScheme.onSurface,
            actionIconContentColor = MaterialTheme.colorScheme.onSurfaceVariant
        ),
        modifier = modifier
    )
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
    subValueColor: Color = MaterialTheme.colorScheme.onSurfaceVariant
) {
    ElevatedCard(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
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
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
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
            containerColor = MaterialTheme.colorScheme.primaryContainer,
            textColor = MaterialTheme.colorScheme.onPrimaryContainer
        )
        UnitStatus.VACANT -> StatusBadge(
            statusText = strings.vacant,
            containerColor = MaterialTheme.colorScheme.tertiaryContainer,
            textColor = MaterialTheme.colorScheme.onTertiaryContainer
        )
        UnitStatus.MAINTENANCE -> StatusBadge(
            statusText = strings.underMaintenance,
            containerColor = MaterialTheme.colorScheme.secondaryContainer,
            textColor = MaterialTheme.colorScheme.onSecondaryContainer
        )
    }
}

@Composable
fun PaymentStatusBadge(status: PaymentStatus, strings: StringsDict) {
    when (status) {
        PaymentStatus.PAID -> StatusBadge(
            statusText = strings.paid,
            containerColor = MaterialTheme.colorScheme.tertiaryContainer,
            textColor = MaterialTheme.colorScheme.onTertiaryContainer
        )
        PaymentStatus.PENDING -> StatusBadge(
            statusText = strings.pending,
            containerColor = MaterialTheme.colorScheme.secondaryContainer,
            textColor = MaterialTheme.colorScheme.onSecondaryContainer
        )
        PaymentStatus.OVERDUE -> StatusBadge(
            statusText = strings.overdue,
            containerColor = MaterialTheme.colorScheme.errorContainer,
            textColor = MaterialTheme.colorScheme.onErrorContainer
        )
    }
}

@Composable
fun PriorityBadge(priority: MaintenancePriority, strings: StringsDict) {
    val (bgColor, txtColor, label) = when (priority) {
        MaintenancePriority.LOW -> Triple(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant, strings.low)
        MaintenancePriority.MEDIUM -> Triple(MaterialTheme.colorScheme.primaryContainer, MaterialTheme.colorScheme.onPrimaryContainer, strings.medium)
        MaintenancePriority.HIGH -> Triple(MaterialTheme.colorScheme.secondaryContainer, MaterialTheme.colorScheme.onSecondaryContainer, strings.high)
        MaintenancePriority.EMERGENCY -> Triple(MaterialTheme.colorScheme.errorContainer, MaterialTheme.colorScheme.onErrorContainer, strings.emergency)
    }
    StatusBadge(statusText = label, containerColor = bgColor, textColor = txtColor)
}

@Composable
fun TicketStatusBadge(status: MaintenanceStatus, strings: StringsDict) {
    val (bgColor, txtColor, label) = when (status) {
        MaintenanceStatus.REPORTED -> Triple(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant, strings.reported)
        MaintenanceStatus.ASSIGNED -> Triple(MaterialTheme.colorScheme.primaryContainer, MaterialTheme.colorScheme.onPrimaryContainer, strings.assigned)
        MaintenanceStatus.IN_PROGRESS -> Triple(MaterialTheme.colorScheme.secondaryContainer, MaterialTheme.colorScheme.onSecondaryContainer, strings.inProgress)
        MaintenanceStatus.RESOLVED -> Triple(MaterialTheme.colorScheme.tertiaryContainer, MaterialTheme.colorScheme.onTertiaryContainer, strings.resolved)
        MaintenanceStatus.CANCELLED -> Triple(MaterialTheme.colorScheme.errorContainer, MaterialTheme.colorScheme.onErrorContainer, "Cancelled")
    }
    StatusBadge(statusText = label, containerColor = bgColor, textColor = txtColor)
}
