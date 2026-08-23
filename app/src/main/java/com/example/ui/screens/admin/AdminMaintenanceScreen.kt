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
                        text = "${tickets.count { it.status != MaintenanceStatus.RESOLVED }} Open requests",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Button(
                    onClick = { viewModel.openFeedbackOverview() },
                    colors = ButtonDefaults.buttonColors(containerColor = Gold500),
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    modifier = Modifier.testTag("btn_open_csat_overview")
                ) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("CSAT / Feedback", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 12.sp)
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
                                    MaintenanceStatus.CANCELLED -> "Cancelled"
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
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.TaskAlt,
                            contentDescription = null,
                            tint = Emerald600,
                            modifier = Modifier.size(48.dp)
                        )
                        Text(
                            text = "No maintenance tickets in this view",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
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
        var technicianName by remember { mutableStateOf(tkt.assignedTechnician ?: "Pak Joko (AC & Cooling)") }
        var costText by remember { mutableStateOf(tkt.estimatedCost?.toLong()?.toString() ?: "150000") }
        var notesText by remember { mutableStateOf(tkt.notes ?: "") }

        val availableTechs = listOf(
            "Pak Joko (AC Specialist)",
            "Pak Budi (Electrician & Wiring)",
            "Pak Agus (Plumber & Water Systems)",
            "Pak Hendra (Civil & Painting)",
            "External Contractor"
        )

        AlertDialog(
            onDismissRequest = { updatingTicket = null },
            title = {
                Text(
                    text = "Manage Ticket #${tkt.id.takeLast(4).uppercase()}",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    item {
                        Text(text = "Room ${tkt.roomNumber}: ${tkt.title}", fontWeight = FontWeight.Bold)
                        Text(text = tkt.description, style = MaterialTheme.typography.bodySmall, color = Slate600)
                    }

                    item {
                        Text(text = "Update Status", style = MaterialTheme.typography.labelMedium)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(MaintenanceStatus.values()) { st ->
                                FilterChip(
                                    selected = newStatus == st,
                                    onClick = { newStatus = st },
                                    label = { Text(st.labelEn) }
                                )
                            }
                        }
                    }

                    item {
                        Text(text = "Assign Technician", style = MaterialTheme.typography.labelMedium)
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
                            label = { Text("Estimated / Repair Cost (IDR)") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }

                    item {
                        OutlinedTextField(
                            value = notesText,
                            onValueChange = { notesText = it },
                            label = { Text("Resolution / Technician Notes") },
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
                    colors = ButtonDefaults.buttonColors(containerColor = Navy800),
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
                    Surface(shape = RoundedCornerShape(6.dp), color = Navy800) {
                        Text(
                            text = "Unit ${ticket.roomNumber}",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = Color.White,
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
                    color = Slate700
                )
                if (ticket.photoEvidenceDesc != null) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.PhotoCamera, contentDescription = null, tint = Gold600, modifier = Modifier.size(14.dp))
                        Text(
                            text = ticket.photoEvidenceDesc,
                            style = MaterialTheme.typography.labelSmall,
                            color = Gold600
                        )
                    }
                }
            }

            Divider(color = Slate100)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Reported by ${ticket.residentName}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Slate600
                    )
                    if (ticket.assignedTechnician != null) {
                        Text(
                            text = "Tech: ${ticket.assignedTechnician}",
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                            color = Navy800
                        )
                    }
                }

                Button(
                    onClick = onUpdate,
                    colors = ButtonDefaults.buttonColors(containerColor = Navy800),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(strings.assignTech, style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}
