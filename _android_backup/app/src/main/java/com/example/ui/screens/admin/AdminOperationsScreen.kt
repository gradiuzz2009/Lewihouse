package com.example.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.data.language.StringsDict
import com.example.ui.theme.*
import com.example.ui.viewmodels.AdminTab
import com.example.ui.viewmodels.AppViewModel

@Composable
fun AdminOperationsScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    onNavigateTab: (AdminTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val tickets by viewModel.tickets.collectAsState()
    val meters by viewModel.meters.collectAsState()
    val feedbacks by viewModel.feedbacks.collectAsState()
    val surveys by viewModel.surveys.collectAsState()

    val openTicketsCount = tickets.count { it.status != com.example.data.model.MaintenanceStatus.RESOLVED }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp)
    ) {
        // Header
        item {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = strings.opsHubTitle,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = strings.opsHubSubtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Section: Utilities & Calculations
        item {
            Text(
                text = "Utilities & Calculations",
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                ),
                modifier = Modifier.padding(top = 4.dp)
            )
        }

        item {
            OperationHubCard(
                title = strings.tokenGenerator,
                subtitle = "Issue 20-digit PLN prepaid electricity tokens & check meter logs",
                icon = Icons.Default.ElectricBolt,
                iconBgColor = MaterialTheme.colorScheme.tertiaryContainer,
                iconTint = MaterialTheme.colorScheme.onTertiaryContainer,
                badgeText = "${meters.size} Meters",
                onClick = { onNavigateTab(AdminTab.ELECTRICITY) },
                testTag = "hub_electricity_card"
            )
        }

        item {
            OperationHubCard(
                title = strings.transferCalcTitle,
                subtitle = strings.transferCalcDesc,
                icon = Icons.Default.Calculate,
                iconBgColor = MaterialTheme.colorScheme.primaryContainer,
                iconTint = MaterialTheme.colorScheme.onPrimaryContainer,
                badgeText = "Proration Math",
                onClick = { onNavigateTab(AdminTab.TRANSFER_CALCULATOR) },
                testTag = "hub_transfer_calc_card"
            )
        }

        // Section: Resident Services & Quality Oversight
        item {
            Text(
                text = "Services & Communication",
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                ),
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        item {
            OperationHubCard(
                title = strings.maintenanceOversight,
                subtitle = "Manage repair tickets, assign technicians, and track SLA",
                icon = Icons.Default.Build,
                iconBgColor = MaterialTheme.colorScheme.secondaryContainer,
                iconTint = MaterialTheme.colorScheme.onSecondaryContainer,
                badgeText = if (openTicketsCount > 0) "$openTicketsCount Open" else "Clean",
                badgeColor = if (openTicketsCount > 0) MaterialTheme.colorScheme.errorContainer else MaterialTheme.colorScheme.tertiaryContainer,
                badgeTextColor = if (openTicketsCount > 0) MaterialTheme.colorScheme.onErrorContainer else MaterialTheme.colorScheme.onTertiaryContainer,
                onClick = { onNavigateTab(AdminTab.MAINTENANCE) },
                testTag = "hub_maintenance_card"
            )
        }

        item {
            OperationHubCard(
                title = strings.broadcastAnnouncement,
                subtitle = "Dispatch instant push notification alerts to all resident phones",
                icon = Icons.Default.Campaign,
                iconBgColor = MaterialTheme.colorScheme.errorContainer,
                iconTint = MaterialTheme.colorScheme.onErrorContainer,
                badgeText = "Push",
                onClick = { viewModel.openBroadcastDialog() },
                testTag = "hub_broadcast_card"
            )
        }

        item {
            OperationHubCard(
                title = strings.csatOverview,
                subtitle = "Review tenant repair ratings (${feedbacks.size}) and quarterly surveys (${surveys.size})",
                icon = Icons.Default.Star,
                iconBgColor = MaterialTheme.colorScheme.secondaryContainer,
                iconTint = MaterialTheme.colorScheme.onSecondaryContainer,
                badgeText = "CSAT",
                onClick = { viewModel.openFeedbackOverview() },
                testTag = "hub_csat_card"
            )
        }
    }
}

@Composable
fun OperationHubCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconBgColor: Color,
    iconTint: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    badgeText: String? = null,
    badgeColor: Color = MaterialTheme.colorScheme.surfaceVariant,
    badgeTextColor: Color = MaterialTheme.colorScheme.onSurfaceVariant,
    testTag: String? = null
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .then(if (testTag != null) Modifier.testTag(testTag) else Modifier)
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
                    .size(46.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(iconBgColor),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconTint,
                    modifier = Modifier.size(24.dp)
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (badgeText != null) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = badgeColor
                        ) {
                            Text(
                                text = badgeText,
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = badgeTextColor,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowForwardIos,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                modifier = Modifier.size(16.dp)
            )
        }
    }
}
