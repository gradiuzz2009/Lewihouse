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
                    .background(Navy800)
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
                            text = if (pendingBills.isNotEmpty()) "CURRENT BALANCE" else "ACTIVE LEASE RATE",
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
                                contentDescription = if (pendingBills.isNotEmpty()) "Pending" else "Paid",
                                tint = if (pendingBills.isNotEmpty()) Gold400 else Emerald400,
                                modifier = Modifier.size(14.dp)
                            )
                            Text(
                                text = if (pendingBills.isNotEmpty()) {
                                    "${pendingBills.size} bill(s) pending"
                                } else {
                                    "Due on ${tenant?.leaseEndDate?.take(7) ?: "2026-10"}-01"
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
                                colors = ButtonDefaults.buttonColors(containerColor = Gold400, contentColor = Navy900),
                                shape = RoundedCornerShape(20.dp),
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                                modifier = Modifier.heightIn(min = 48.dp)
                            ) {
                                Text("Pay Rent (QRIS)", fontSize = 12.sp, fontWeight = FontWeight.Bold)
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
                                text = "Electricity Token",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = SleekTextSecondary,
                                    fontSize = 11.sp
                                )
                            )
                            Text(
                                text = if (latestToken != null) "+${LanguageManager.formatKwh(latestToken.kwhAmount)}" else "124.5 kWh Left",
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
                                Text("🛠️", fontSize = 14.sp)
                            }
                            Text(
                                text = if (activeTicket != null) "ACTIVE" else "ALL CLEAR",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    color = if (activeTicket != null) Emerald600 else SleekTextMuted,
                                    fontSize = 10.sp
                                )
                            )
                        }

                        Column {
                            Text(
                                text = "Active Request",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = SleekTextSecondary,
                                    fontSize = 11.sp
                                )
                            )
                            Text(
                                text = activeTicket?.title ?: "No Pending Fixes",
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
                    emoji = "💳",
                    title = "Payments",
                    onClick = { onNavigateTab(TenantTab.BILLS) },
                    modifier = Modifier.weight(1f)
                )
                SleekActionCard(
                    emoji = "🔌",
                    title = "Tokens",
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
                    emoji = "🎫",
                    title = "Repairs",
                    onClick = { onNavigateTab(TenantTab.MAINTENANCE) },
                    modifier = Modifier.weight(1f)
                )
                SleekActionCard(
                    emoji = "⚙️",
                    title = "Profile",
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
                    colors = CardDefaults.cardColors(containerColor = Gold500.copy(alpha = 0.10f)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Gold500.copy(alpha = 0.35f)),
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
                                .background(Gold500),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(22.dp)
                            )
                        }

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Repair Completed: ${resolvedUnratedTicket.title}",
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Navy800
                                )
                            )
                            Text(
                                text = "Tap here to rate your technician's service & speed.",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Slate700,
                                    fontSize = 11.sp
                                )
                            )
                        }

                        Button(
                            onClick = { viewModel.openRatingDialog(resolvedUnratedTicket) },
                            colors = ButtonDefaults.buttonColors(containerColor = Gold600),
                            shape = RoundedCornerShape(10.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text("Rate", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        // Quarterly Tenant Satisfaction Survey Banner
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Slate50),
                border = androidx.compose.foundation.BorderStroke(1.dp, Slate200),
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
                            .background(Navy800),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Poll,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = strings.surveyTitle,
                            style = MaterialTheme.typography.titleSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = Navy800
                            )
                        )
                        Text(
                            text = "Help us keep Lewi House clean & safe • 2-min survey",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = SleekTextSecondary,
                                fontSize = 11.sp
                            )
                        )
                    }

                    OutlinedButton(
                        onClick = { viewModel.openSatisfactionSurvey() },
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Text(strings.takeSurvey, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Navy800)
                    }
                }
            }
        }

        // Verification Prompt Card
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Emerald50),
                border = androidx.compose.foundation.BorderStroke(1.dp, Emerald100),
                modifier = Modifier.fillMaxWidth()
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
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Emerald500),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Verified",
                            tint = Color.White,
                            modifier = Modifier.size(22.dp)
                        )
                    }

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = if (pendingBills.isEmpty()) "Payment Verified" else "Outstanding Bill Notice",
                            style = MaterialTheme.typography.titleSmall.copy(
                                fontWeight = FontWeight.Bold,
                                color = if (pendingBills.isEmpty()) Emerald900 else Gold600
                            )
                        )
                        Text(
                            text = if (pendingBills.isEmpty()) {
                                "${lastPaidBill?.type?.labelEn ?: "Recent Rent"} confirmed by Manager."
                            } else {
                                "Please settle pending dues before the 5th of the month."
                            },
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = if (pendingBills.isEmpty()) Emerald800 else Slate700,
                                fontSize = 11.sp
                            )
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SleekActionCard(
    emoji: String,
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp),
        modifier = modifier
            .height(108.dp)
            .clickable { onClick() }
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Slate50),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = emoji,
                    fontSize = 20.sp
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = Slate700,
                    fontSize = 12.sp
                )
            )
        }
    }
}

