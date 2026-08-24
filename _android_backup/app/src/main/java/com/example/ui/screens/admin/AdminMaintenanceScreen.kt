package com.example.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.language.AppLanguage
import com.example.data.language.LanguageManager
import com.example.data.language.StringsDict
import com.example.data.model.*
import com.example.ui.components.EmptyStateCard
import com.example.ui.components.PriorityBadge
import com.example.ui.components.TicketStatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminMaintenanceScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val tickets by viewModel.tickets.collectAsState()
    val feedbacks by viewModel.feedbacks.collectAsState()
    var selectedStatus by remember { mutableStateOf<MaintenanceStatus?>(null) }
    var selectedPriority by remember { mutableStateOf<MaintenancePriority?>(null) }
    var updatingTicket by remember { mutableStateOf<MaintenanceTicket?>(null) }

    val filteredTickets = tickets.filter {
        (selectedStatus == null || it.status == selectedStatus) &&
        (selectedPriority == null || it.priority == selectedPriority)
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp)
    ) {
        // Title & CSAT Button
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "${strings.maintenanceOversight} (${tickets.size})",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "${tickets.count { it.status != MaintenanceStatus.RESOLVED }} ${strings.openMaintenance}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Button(
                    onClick = { viewModel.openFeedbackOverview() },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    modifier = Modifier.testTag("btn_open_csat_overview")
                ) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondary, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("CSAT", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondary, fontSize = 12.sp)
                }
            }
        }

        // Status filter tabs
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    FilterChip(
                        selected = selectedStatus == null,
                        onClick = { selectedStatus = null },
                        label = { Text(strings.all) }
                    )
                }
                items(MaintenanceStatus.values()) { status ->
                    FilterChip(
                        selected = selectedStatus == status,
                        onClick = { selectedStatus = status },
                        label = {
                            Text(
                                when (status) {
                                    MaintenanceStatus.REPORTED -> strings.reported
                                    MaintenanceStatus.ASSIGNED -> strings.assigned
                                    MaintenanceStatus.IN_PROGRESS -> strings.inProgress
                                    MaintenanceStatus.RESOLVED -> strings.resolved
                                    MaintenanceStatus.CANCELLED -> strings.cancelled
                                }
                            )
                        }
                    )
                }
            }
        }

        // Tickets list
        if (filteredTickets.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Default.TaskAlt,
                    title = strings.emptyTicketsTitle,
                    description = strings.emptyTicketsDesc,
                    actionButtonText = strings.resetFilter,
                    onActionClick = {
                        selectedStatus = null
                        selectedPriority = null
                    }
                )
            }
        } else {
            items(filteredTickets) { ticket ->
                val feedback = feedbacks.find { it.ticketId == ticket.id }
                AdminTicketCard(
                    ticket = ticket,
                    feedback = feedback,
                    language = language,
                    strings = strings,
                    onUpdate = { updatingTicket = ticket }
                )
            }
        }
    }

    // Update Ticket Modal
    if (updatingTicket != null) {
        val tkt = updatingTicket!!
        var newStatus by remember { mutableStateOf(tkt.status) }
        var technicianName by remember { mutableStateOf(tkt.assignedTechnician ?: "Pak Joko (Teknisi AC)") }
        var costText by remember { mutableStateOf(tkt.estimatedCost?.toLong()?.toString() ?: "150000") }
        var notesText by remember { mutableStateOf(tkt.notes ?: "") }

        val availableTechs = listOf(
            "Pak Joko (Spesialis AC & Pendingin)",
            "Pak Budi (Listrik & Kelistrikan)",
            "Pak Agus (Plumbing & Saluran Air)",
            "Pak Hendra (Sipil, Cat & Bangunan)",
            "Teknisi Kontraktor Luar"
        )

        AlertDialog(
            onDismissRequest = { updatingTicket = null },
            title = {
                Text(
                    text = "${strings.edit} #${tkt.id.takeLast(4).uppercase()}",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Text(text = "Unit ${tkt.roomNumber}: ${tkt.title}", fontWeight = FontWeight.Bold)
                        Text(text = tkt.description, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }

                    item {
                        Text(text = strings.status, style = MaterialTheme.typography.labelMedium)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(MaintenanceStatus.values()) { st ->
                                FilterChip(
                                    selected = newStatus == st,
                                    onClick = { newStatus = st },
                                    label = {
                                        Text(
                                            when (st) {
                                                MaintenanceStatus.REPORTED -> strings.reported
                                                MaintenanceStatus.ASSIGNED -> strings.assigned
                                                MaintenanceStatus.IN_PROGRESS -> strings.inProgress
                                                MaintenanceStatus.RESOLVED -> strings.resolved
                                                MaintenanceStatus.CANCELLED -> strings.cancelled
                                            }
                                        )
                                    }
                                )
                            }
                        }
                    }

                    item {
                        Text(text = strings.assignTech, style = MaterialTheme.typography.labelMedium)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(availableTechs) { tech ->
                                FilterChip(
                                    selected = technicianName == tech,
                                    onClick = { technicianName = tech },
                                    label = { Text(tech) }
                                )
                            }
                        }
                    }

                    item {
                        OutlinedTextField(
                            value = costText,
                            onValueChange = { costText = it },
                            label = { Text("Estimasi Biaya Perbaikan (Rp)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = notesText,
                            onValueChange = { notesText = it },
                            label = { Text(strings.details) },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val cost = costText.toDoubleOrNull() ?: 0.0
                        viewModel.updateMaintenanceStatus(
                            ticketId = tkt.id,
                            newStatus = newStatus,
                            assignedTech = technicianName,
                            estimatedCost = cost,
                            notes = notesText
                        )
                        updatingTicket = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    modifier = Modifier.testTag("btn_save_ticket_status")
                ) {
                    Text(strings.save)
                }
            },
            dismissButton = {
                TextButton(onClick = { updatingTicket = null }) {
                    Text(strings.cancel)
                }
            }
        )
    }
}

@Composable
fun AdminTicketCard(
    ticket: MaintenanceTicket,
    feedback: ServiceFeedback?,
    language: AppLanguage,
    strings: StringsDict,
    onUpdate: () -> Unit
) {
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
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(shape = RoundedCornerShape(6.dp), color = MaterialTheme.colorScheme.primary) {
                        Text(
                            text = "Unit ${ticket.roomNumber}",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onPrimary,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                    PriorityBadge(priority = ticket.priority, strings = strings)
                }
                TicketStatusBadge(status = ticket.status, strings = strings)
            }

            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = ticket.title,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Text(
                    text = ticket.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (ticket.photoEvidenceDesc != null) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.PhotoCamera, contentDescription = null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(14.dp))
                        Text(
                            text = ticket.photoEvidenceDesc,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Pelapor: ${ticket.residentName}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (ticket.assignedTechnician != null) {
                        Text(
                            text = "Teknisi: ${ticket.assignedTechnician}",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }

                Button(
                    onClick = onUpdate,
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(strings.assignTech, style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}
