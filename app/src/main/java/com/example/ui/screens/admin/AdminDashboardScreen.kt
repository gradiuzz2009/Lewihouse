package com.example.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 96.dp)
    ) {
        // Welcome banner (Sleek 32dp Hero Card)
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(32.dp))
                    .background(Navy800)
            ) {
                // Ambient glows
                Box(
                    modifier = Modifier
                        .size(140.dp)
                        .offset(x = 240.dp, y = (-30).dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.05f))
                )
                Box(
                    modifier = Modifier
                        .size(90.dp)
                        .offset(x = (-15).dp, y = 80.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.06f))
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
                            text = "LEWI HOUSE OPERATIONS",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.2.sp,
                                color = Gold400,
                                fontSize = 10.sp
                            )
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Property Overview",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Real-time Occupancy & Cashflow Ledger",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 12.sp
                            )
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(46.dp)
                            .clip(CircleShape)
                            .background(Gold500),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }
            }
        }

        // Metrics Grid (2x2)
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
                        iconBgColor = Navy100,
                        iconTint = Navy800,
                        subValue = "$occupiedRooms / $totalRooms ${strings.occupied}",
                        subValueColor = Emerald700,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateTab(AdminTab.ROOMS) }
                    )
                    StatMetricCard(
                        title = strings.totalRevenueThisMonth,
                        value = LanguageManager.formatCurrency(totalCollectedThisMonth, language),
                        icon = Icons.Default.AccountBalanceWallet,
                        iconBgColor = Emerald100,
                        iconTint = Emerald700,
                        subValue = "${payments.count { it.status == PaymentStatus.PAID }} ${strings.paid}",
                        subValueColor = Emerald700,
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
                        icon = Icons.Default.ReceiptLong,
                        iconBgColor = Rose100,
                        iconTint = Rose700,
                        subValue = "${payments.count { it.status != PaymentStatus.PAID }} ${strings.pending}",
                        subValueColor = Rose700,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onNavigateTab(AdminTab.FINANCE) }
                    )
                    StatMetricCard(
                        title = strings.openMaintenance,
                        value = "$openTicketsCount",
                        icon = Icons.Default.Build,
                        iconBgColor = Gold100,
                        iconTint = Gold600,
                        subValue = "${tickets.count { it.priority == MaintenancePriority.HIGH || it.priority == MaintenancePriority.EMERGENCY }} ${strings.high}",
                        subValueColor = Gold600,
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
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        text = strings.quickActions,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        QuickActionButton(
                            icon = Icons.Default.Campaign,
                            label = strings.broadcastAnnouncement,
                            color = Crimson600,
                            onClick = { viewModel.openBroadcastDialog() },
                            modifier = Modifier.testTag("quick_broadcast")
                        )
                        QuickActionButton(
                            icon = Icons.Default.Star,
                            label = "CSAT / Ratings",
                            color = Gold600,
                            onClick = { viewModel.openFeedbackOverview() },
                            modifier = Modifier.testTag("quick_csat_overview")
                        )
                        QuickActionButton(
                            icon = Icons.Default.AddHome,
                            label = strings.addRoom,
                            color = Navy800,
                            onClick = { onNavigateTab(AdminTab.ROOMS) },
                            modifier = Modifier.testTag("quick_add_room")
                        )
                        QuickActionButton(
                            icon = Icons.Default.ElectricBolt,
                            label = strings.issueToken,
                            color = Emerald600,
                            onClick = { onNavigateTab(AdminTab.ELECTRICITY) },
                            modifier = Modifier.testTag("quick_issue_token")
                        )
                    }
                }
            }
        }

        // Tenant Satisfaction & Quality Oversight Card
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Slate50),
                border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { viewModel.openFeedbackOverview() }
                    .testTag("card_csat_overview")
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Gold500.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = null,
                                    tint = Gold600,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Column {
                                Text(
                                    text = "Tenant Satisfaction & CSAT",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = Navy800
                                    )
                                )
                                Text(
                                    text = "${feedbacks.size} repair ratings • ${surveys.size} survey responses",
                                    style = MaterialTheme.typography.labelSmall.copy(color = SleekTextSecondary)
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = Slate400
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White,
                            border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("Service Rating", style = MaterialTheme.typography.labelSmall.copy(color = SleekTextSecondary))
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = String.format("%.1f", avgFeedbackRating),
                                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = Navy800)
                                    )
                                    Icon(Icons.Default.Star, contentDescription = null, tint = Gold500, modifier = Modifier.size(16.dp))
                                }
                            }
                        }

                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White,
                            border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text("Overall CSAT", style = MaterialTheme.typography.labelSmall.copy(color = SleekTextSecondary))
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = "${(avgSurveyRating * 20).toInt()}%",
                                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, color = Emerald700)
                                    )
                                    Text("Satisfaction", style = MaterialTheme.typography.labelSmall.copy(color = Emerald700, fontSize = 10.sp))
                                }
                            }
                        }
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
                            text = "Unit Occupancy Ratio",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "$occupiedRooms / $totalRooms Units",
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
                            .background(Slate100)
                    ) {
                        Row(modifier = Modifier.fillMaxSize()) {
                            if (totalRooms > 0) {
                                Box(
                                    modifier = Modifier
                                        .weight(occupiedRooms.toFloat().coerceAtLeast(0.01f))
                                        .fillMaxHeight()
                                        .background(Navy800)
                                )
                                Box(
                                    modifier = Modifier
                                        .weight(vacantRooms.toFloat().coerceAtLeast(0.01f))
                                        .fillMaxHeight()
                                        .background(Emerald500)
                                )
                                Box(
                                    modifier = Modifier
                                        .weight(maintenanceRooms.toFloat().coerceAtLeast(0.01f))
                                        .fillMaxHeight()
                                        .background(Gold400)
                                )
                            }
                        }
                    }

                    // Legend
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        LegendItem(color = Navy800, label = "${strings.occupied} ($occupiedRooms)")
                        LegendItem(color = Emerald500, label = "${strings.vacant} ($vacantRooms)")
                        LegendItem(color = Gold400, label = "${strings.underMaintenance} ($maintenanceRooms)")
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
                    Text(text = strings.viewAll, color = Navy800)
                }
            }
        }

        items(payments.take(4)) { payment ->
            PaymentItemRow(payment = payment, language = language, strings = strings)
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
            color = MaterialTheme.colorScheme.onSurface,
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
                                PaymentType.RENT -> Navy100
                                PaymentType.ELECTRICITY -> Gold100
                                PaymentType.DEPOSIT -> Emerald100
                                else -> Slate100
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
                            PaymentType.RENT -> Navy800
                            PaymentType.ELECTRICITY -> Gold600
                            PaymentType.DEPOSIT -> Emerald700
                            else -> Slate700
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
