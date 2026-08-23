package com.example.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
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
import com.example.data.language.LanguageManager
import com.example.data.language.StringsDict
import com.example.data.model.*
import com.example.ui.components.*
import com.example.ui.theme.*
import com.example.ui.viewmodels.AdminTab
import com.example.ui.viewmodels.AppViewModel

@Composable
fun AdminDashboardScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    onNavigateTab: (AdminTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val rooms by viewModel.rooms.collectAsState()
    val residents by viewModel.residents.collectAsState()
    val payments by viewModel.payments.collectAsState()
    val tickets by viewModel.tickets.collectAsState()
    val feedbacks by viewModel.feedbacks.collectAsState()
    val surveys by viewModel.surveys.collectAsState()

    // Calculated metrics
    val totalRooms = rooms.size
    val occupiedRooms = rooms.count { it.status == UnitStatus.OCCUPIED }
    val vacantRooms = rooms.count { it.status == UnitStatus.VACANT }
    val maintenanceRooms = rooms.count { it.status == UnitStatus.MAINTENANCE }
    val occupancyRate = if (totalRooms > 0) (occupiedRooms.toDouble() / totalRooms * 100).toInt() else 0

    val avgFeedbackRating = if (feedbacks.isNotEmpty()) feedbacks.map { it.rating }.average() else 4.8
    val avgSurveyRating = if (surveys.isNotEmpty()) surveys.map { it.overallRating }.average() else 4.9

    val totalCollectedThisMonth = payments
        .filter { it.status == PaymentStatus.PAID }
        .sumOf { it.amount }

    val pendingDebtAmount = payments
        .filter { it.status == PaymentStatus.OVERDUE || it.status == PaymentStatus.PENDING }
        .sumOf { it.amount }

    val openTicketsCount = tickets.count { it.status != MaintenanceStatus.RESOLVED }
    val overduePaymentsCount = payments.count { it.status == PaymentStatus.OVERDUE }
    val movingOutCount = residents.count { it.status == ResidentStatus.MOVING_OUT }

    val urgentTasksTotal = (if (overduePaymentsCount > 0) 1 else 0) +
            (if (openTicketsCount > 0) 1 else 0) +
            (if (movingOutCount > 0) 1 else 0)

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp)
    ) {
        // Welcome banner (Sleek 32dp Hero Card)
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(32.dp))
                    .background(MaterialTheme.colorScheme.primary)
            ) {
                // Ambient glows
                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .offset(x = 240.dp, y = (-30).dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.05f))
                )
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .offset(x = (-15).dp, y = 80.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.06f))
                )

                Row(
                    modifier = Modifier
                        .padding(24.dp)
                        .fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = strings.adminMode.uppercase(),
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.2.sp,
                                color = MaterialTheme.colorScheme.secondary,
                                fontSize = 10.sp
                            )
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = strings.overview,
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "${strings.occupancyRate}: $occupancyRate% • ${LanguageManager.formatCurrency(totalCollectedThisMonth, language)}",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f),
                                fontSize = 12.sp
                            )
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.secondary),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSecondary,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }

        // Urgent Action Banner (if any urgent action needed)
        if (urgentTasksTotal > 0) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.error),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.NotificationImportant,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onError,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "$urgentTasksTotal ${strings.urgentTasks}",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                            Text(
                                text = strings.urgentBannerSubtitle,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onErrorContainer.copy(alpha = 0.85f)
                            )
                        }
                    }
                }
            }
        }

        // Operational Pulse Metrics (Available Rooms, Check-Ins, Check-Outs)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Section Title
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = strings.dailyPulse,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = strings.realtimeUpdates,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    StatMetricCard(
                        title = strings.vacantRooms,
                        value = "$vacantRooms",
                        icon = Icons.Default.MeetingRoom,
                        iconBgColor = Emerald100,
                        iconTint = Emerald700,
                        subValue = strings.readyToRent,
                        subValueColor = Emerald700,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateTab(AdminTab.ROOMS) }
                    )
                    StatMetricCard(
                        title = strings.checkInsToday,
                        value = "2",
                        icon = Icons.AutoMirrored.Filled.Login,
                        iconBgColor = Navy100,
                        iconTint = Navy800,
                        subValue = strings.scheduled,
                        subValueColor = Navy800,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateTab(AdminTab.ROOMS) }
                    )
                    StatMetricCard(
                        title = strings.checkOutsToday,
                        value = "$movingOutCount",
                        icon = Icons.AutoMirrored.Filled.Logout,
                        iconBgColor = Gold100,
                        iconTint = Gold600,
                        subValue = strings.noticeGiven,
                        subValueColor = Gold600,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateTab(AdminTab.RESIDENTS) }
                    )
                }
            }
        }

        // Financial & Facility Health (Occupancy, Revenue, Outstanding Dues, Maintenance SLA)
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatMetricCard(
                        title = strings.occupancyRate,
                        value = "$occupancyRate%",
                        icon = Icons.Default.Bed,
                        iconBgColor = MaterialTheme.colorScheme.primaryContainer,
                        iconTint = MaterialTheme.colorScheme.onPrimaryContainer,
                        subValue = "$occupiedRooms / $totalRooms ${strings.occupied}",
                        subValueColor = MaterialTheme.colorScheme.primary,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateTab(AdminTab.ROOMS) }
                    )
                    StatMetricCard(
                        title = strings.totalRevenueThisMonth,
                        value = LanguageManager.formatCurrency(totalCollectedThisMonth, language),
                        icon = Icons.Default.AccountBalanceWallet,
                        iconBgColor = MaterialTheme.colorScheme.tertiaryContainer,
                        iconTint = MaterialTheme.colorScheme.onTertiaryContainer,
                        subValue = "${payments.count { it.status == PaymentStatus.PAID }} ${strings.paid}",
                        subValueColor = MaterialTheme.colorScheme.tertiary,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateTab(AdminTab.FINANCE) }
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatMetricCard(
                        title = strings.pendingCollections,
                        value = LanguageManager.formatCurrency(pendingDebtAmount, language),
                        icon = Icons.AutoMirrored.Filled.ReceiptLong,
                        iconBgColor = MaterialTheme.colorScheme.errorContainer,
                        iconTint = MaterialTheme.colorScheme.onErrorContainer,
                        subValue = "${payments.count { it.status != PaymentStatus.PAID }} ${strings.pending}",
                        subValueColor = MaterialTheme.colorScheme.error,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateTab(AdminTab.FINANCE) }
                    )
                    StatMetricCard(
                        title = strings.openMaintenance,
                        value = "$openTicketsCount",
                        icon = Icons.Default.Build,
                        iconBgColor = MaterialTheme.colorScheme.secondaryContainer,
                        iconTint = MaterialTheme.colorScheme.onSecondaryContainer,
                        subValue = "${tickets.count { it.priority == MaintenancePriority.HIGH || it.priority == MaintenancePriority.EMERGENCY }} ${strings.high}",
                        subValueColor = MaterialTheme.colorScheme.secondary,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateTab(AdminTab.MAINTENANCE) }
                    )
                }
            }
        }

        // Quick Operations Chips
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = strings.quickActions,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        QuickActionButton(
                            icon = Icons.Default.Campaign,
                            label = strings.broadcastAnnouncement,
                            color = MaterialTheme.colorScheme.primary,
                            onClick = { viewModel.openBroadcastDialog() },
                            modifier = Modifier.testTag("quick_broadcast")
                        )
                        QuickActionButton(
                            icon = Icons.Default.PersonAdd,
                            label = strings.addResident,
                            color = MaterialTheme.colorScheme.secondary,
                            onClick = { onNavigateTab(AdminTab.RESIDENTS) },
                            modifier = Modifier.testTag("quick_add_resident")
                        )
                        QuickActionButton(
                            icon = Icons.Default.AddHome,
                            label = strings.addRoom,
                            color = MaterialTheme.colorScheme.primary,
                            onClick = { onNavigateTab(AdminTab.ROOMS) },
                            modifier = Modifier.testTag("quick_add_room")
                        )
                        QuickActionButton(
                            icon = Icons.Default.ElectricBolt,
                            label = strings.issueToken,
                            color = MaterialTheme.colorScheme.tertiary,
                            onClick = { onNavigateTab(AdminTab.ELECTRICITY) },
                            modifier = Modifier.testTag("quick_issue_token")
                        )
                    }
                }
            }
        }

        // Visual Occupancy Distribution
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
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
                        Text(
                            text = strings.unitOccupancyRatio,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "$occupiedRooms / $totalRooms ${strings.units}",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    // Progress bar multi-color
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(14.dp)
                            .clip(RoundedCornerShape(7.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Row(modifier = Modifier.fillMaxSize()) {
                            if (totalRooms > 0) {
                                Box(
                                    modifier = Modifier
                                        .weight(occupiedRooms.toFloat().coerceAtLeast(0.01f))
                                        .fillMaxHeight()
                                        .background(MaterialTheme.colorScheme.primary)
                                )
                                Box(
                                    modifier = Modifier
                                        .weight(vacantRooms.toFloat().coerceAtLeast(0.01f))
                                        .fillMaxHeight()
                                        .background(MaterialTheme.colorScheme.tertiary)
                                )
                                Box(
                                    modifier = Modifier
                                        .weight(maintenanceRooms.toFloat().coerceAtLeast(0.01f))
                                        .fillMaxHeight()
                                        .background(MaterialTheme.colorScheme.secondary)
                                )
                            }
                        }
                    }

                    // Legend
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        LegendItem(color = MaterialTheme.colorScheme.primary, label = "${strings.occupied} ($occupiedRooms)")
                        LegendItem(color = MaterialTheme.colorScheme.tertiary, label = "${strings.vacant} ($vacantRooms)")
                        LegendItem(color = MaterialTheme.colorScheme.secondary, label = "${strings.underMaintenance} ($maintenanceRooms)")
                    }
                }
            }
        }

        // Recent Payments / Activities
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = strings.recentActivities,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                TextButton(onClick = { onNavigateTab(AdminTab.FINANCE) }) {
                    Text(text = strings.viewAll, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (payments.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Default.Receipt,
                    title = strings.emptyPaymentsTitle,
                    description = strings.emptyPaymentsDesc
                )
            }
        } else {
            items(payments.take(4)) { payment ->
                PaymentItemRow(payment = payment, language = language, strings = strings)
            }
        }
    }
}

@Composable
fun QuickActionButton(
    icon: ImageVector,
    label: String,
    color: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp),
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(color.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color,
                modifier = Modifier.size(24.dp)
            )
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Medium),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1
        )
    }
}

@Composable
fun LegendItem(color: Color, label: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color)
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun PaymentItemRow(
    payment: Payment,
    language: AppLanguage,
    strings: StringsDict
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            when (payment.type) {
                                PaymentType.RENT -> MaterialTheme.colorScheme.primaryContainer
                                PaymentType.ELECTRICITY -> MaterialTheme.colorScheme.secondaryContainer
                                PaymentType.DEPOSIT -> MaterialTheme.colorScheme.tertiaryContainer
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = when (payment.type) {
                            PaymentType.RENT -> Icons.Default.Home
                            PaymentType.ELECTRICITY -> Icons.Default.Bolt
                            PaymentType.DEPOSIT -> Icons.Default.Savings
                            else -> Icons.Default.Payment
                        },
                        contentDescription = null,
                        tint = when (payment.type) {
                            PaymentType.RENT -> MaterialTheme.colorScheme.onPrimaryContainer
                            PaymentType.ELECTRICITY -> MaterialTheme.colorScheme.onSecondaryContainer
                            PaymentType.DEPOSIT -> MaterialTheme.colorScheme.onTertiaryContainer
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        },
                        modifier = Modifier.size(20.dp)
                    )
                }
                Column {
                    Text(
                        text = payment.residentName.ifBlank { "Unit ${payment.roomNumber}" },
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Unit ${payment.roomNumber} • ${payment.date}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = LanguageManager.formatCurrency(payment.amount, language),
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(2.dp))
                PaymentStatusBadge(status = payment.status, strings = strings)
            }
        }
    }
}
