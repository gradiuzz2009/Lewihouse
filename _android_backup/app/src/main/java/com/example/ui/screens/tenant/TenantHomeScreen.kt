package com.example.ui.screens.tenant

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.Brush
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
import com.example.ui.components.TicketStatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel
import com.example.ui.viewmodels.TenantTab
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun TenantHomeScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    onNavigateTab: (TenantTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val tenant by viewModel.currentTenant.collectAsState()
    val room by viewModel.currentTenantRoom.collectAsState()
    val payments by viewModel.currentTenantPayments.collectAsState()
    val tokens by viewModel.currentTenantTokens.collectAsState()
    val tickets by viewModel.currentTenantTickets.collectAsState()

    val pendingBills = payments.filter { it.status == PaymentStatus.PENDING || it.status == PaymentStatus.OVERDUE }
    val latestToken = tokens.firstOrNull()
    val activeTicket = tickets.firstOrNull { it.status != MaintenanceStatus.RESOLVED }
    val resolvedUnratedTicket = tickets.firstOrNull { it.status == MaintenanceStatus.RESOLVED }
    val lastPaidBill = payments.firstOrNull { it.status == PaymentStatus.PAID }
    val unreadNotifs by viewModel.unreadNotificationCount.collectAsState()

    val currentMonthTag = remember {
        SimpleDateFormat("MMM", Locale.getDefault()).format(Date()).uppercase()
    }

    val displayBalance = if (pendingBills.isNotEmpty()) {
        pendingBills.sumOf { it.amount }
    } else {
        tenant?.monthlyRent ?: 3800000.0
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
        contentPadding = PaddingValues(top = 18.dp, bottom = 120.dp)
    ) {
        // Primary Sleek Ledger Card (32dp rounded, navy gradient with abstract ambient decoration)
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(32.dp))
                    .background(MaterialTheme.colorScheme.primary)
            ) {
                // Background subtle ambient glows
                Box(
                    modifier = Modifier
                        .size(160.dp)
                        .offset(x = 220.dp, y = (-40).dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.05f))
                )
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .offset(x = (-20).dp, y = 110.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.07f))
                )

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Top header row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (pendingBills.isNotEmpty()) strings.currentBalance else strings.activeLeaseRate,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.SemiBold,
                                letterSpacing = 1.5.sp,
                                color = Color.White.copy(alpha = 0.8f),
                                fontSize = 11.sp
                            )
                        )

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = Color.White.copy(alpha = 0.20f)
                        ) {
                            Text(
                                text = "Unit ${tenant?.roomNumber ?: "204"}",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    fontSize = 11.sp
                                ),
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }

                    // Main Currency Amount
                    Text(
                        text = LanguageManager.formatCurrency(displayBalance, language),
                        style = MaterialTheme.typography.displayLarge.copy(
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            fontSize = 30.sp,
                            letterSpacing = (-0.5).sp
                        )
                    )

                    // Next payment status indicator and Pay button
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = if (pendingBills.isNotEmpty()) Icons.Default.WarningAmber else Icons.Default.CheckCircle,
                                contentDescription = if (pendingBills.isNotEmpty()) strings.pending else strings.paid,
                                tint = if (pendingBills.isNotEmpty()) Gold400 else Emerald400,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = if (pendingBills.isNotEmpty()) {
                                    String.format(strings.billsPendingCount, pendingBills.size)
                                } else {
                                    String.format(strings.dueOn, "${tenant?.leaseEndDate?.take(7) ?: "2026-10"}-01")
                                },
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Color.White.copy(alpha = 0.95f),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            )
                        }

                        if (pendingBills.isNotEmpty()) {
                            Button(
                                onClick = { onNavigateTab(TenantTab.BILLS) },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.secondary,
                                    contentColor = MaterialTheme.colorScheme.onSecondary
                                ),
                                shape = RoundedCornerShape(20.dp),
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                                modifier = Modifier.heightIn(min = 48.dp)
                            ) {
                                Text(strings.payRentQris, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Utility Summary (2 Columns: Electricity Token & Active Request)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Electricity Card
                ElevatedCard(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(118.dp)
                        .clickable { onNavigateTab(TenantTab.ELECTRICITY) }
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(Orange100),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Bolt,
                                    contentDescription = strings.electricity,
                                    tint = Orange600,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Text(
                                text = currentMonthTag,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    color = SleekTextMuted,
                                    fontSize = 10.sp
                                )
                            )
                        }

                        Column {
                            Text(
                                text = strings.myTokens,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = SleekTextSecondary,
                                    fontSize = 11.sp
                                )
                            )
                            Text(
                                text = if (latestToken != null) "+${LanguageManager.formatKwh(latestToken.kwhAmount)}" else "124.5 kWh",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = SleekTextPrimary,
                                    fontSize = 13.sp
                                ),
                                maxLines = 1
                            )
                        }
                    }
                }

                // Active Request Card
                ElevatedCard(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp),
                    modifier = Modifier
                        .weight(1f)
                        .height(118.dp)
                        .clickable { onNavigateTab(TenantTab.MAINTENANCE) }
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(14.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(Navy100),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Build, contentDescription = null, tint = Navy800, modifier = Modifier.size(16.dp))
                            }
                            Text(
                                text = if (activeTicket != null) "AKTIF" else "BERES",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (activeTicket != null) Emerald600 else SleekTextMuted,
                                    fontSize = 10.sp
                                )
                            )
                        }

                        Column {
                            Text(
                                text = strings.maintenance,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = SleekTextSecondary,
                                    fontSize = 11.sp
                                )
                            )
                            Text(
                                text = activeTicket?.title ?: "Kondisi Prima",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = SleekTextPrimary,
                                    fontSize = 13.sp
                                ),
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }

        // Action Grid (2x2 Sleek Rounded Buttons)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                SleekActionCard(
                    icon = Icons.Default.Receipt,
                    title = strings.myBills,
                    onClick = { onNavigateTab(TenantTab.BILLS) },
                    modifier = Modifier.weight(1f)
                )
                SleekActionCard(
                    icon = Icons.Default.ElectricBolt,
                    title = strings.myTokens,
                    onClick = { onNavigateTab(TenantTab.ELECTRICITY) },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                SleekActionCard(
                    icon = Icons.Default.Build,
                    title = strings.newTicket,
                    onClick = { onNavigateTab(TenantTab.MAINTENANCE) },
                    modifier = Modifier.weight(1f)
                )
                SleekActionCard(
                    icon = Icons.Default.Person,
                    title = strings.profile,
                    onClick = { onNavigateTab(TenantTab.PROFILE) },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Rate Resolved Repair Prompt (if any resolved ticket exists)
        if (resolvedUnratedTicket != null) {
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { viewModel.openRatingDialog(resolvedUnratedTicket) }
                        .testTag("card_prompt_rate_repair")
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.secondary),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.onSecondary,
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "${strings.rateService}: ${resolvedUnratedTicket.title}",
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSecondaryContainer
                                )
                            )
                            Text(
                                text = strings.rateServicePrompt,
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.8f),
                                    fontSize = 11.sp
                                )
                            )
                        }

                        Button(
                            onClick = { viewModel.openRatingDialog(resolvedUnratedTicket) },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text(strings.rateService, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Quarterly Tenant Satisfaction Survey Banner
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { viewModel.openSatisfactionSurvey() }
                    .testTag("card_take_satisfaction_survey")
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Assignment,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onPrimaryContainer,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = strings.surveyTitle,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = strings.surveySubtitle,
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                fontSize = 11.sp
                            )
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
fun SleekActionCard(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp),
        modifier = modifier
            .height(56.dp)
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = MaterialTheme.colorScheme.primary,
                modifier = Modifier.size(22.dp)
            )
            Text(
                text = title,
                style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}
