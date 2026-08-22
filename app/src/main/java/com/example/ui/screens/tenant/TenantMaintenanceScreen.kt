package com.example.ui.screens.tenant

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
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.language.AppLanguage
import com.example.data.language.StringsDict
import com.example.data.model.*
import com.example.ui.components.PriorityBadge
import com.example.ui.components.TicketStatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantMaintenanceScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val tickets by viewModel.currentTenantTickets.collectAsState()
    val tenant by viewModel.currentTenant.collectAsState()
    val feedbacks by viewModel.feedbacks.collectAsState()

    var showNewTicketDialog by remember { mutableStateOf(false) }

    val activeTickets = tickets.filter { it.status != MaintenanceStatus.RESOLVED }
    val resolvedTickets = tickets.filter { it.status == MaintenanceStatus.RESOLVED }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showNewTicketDialog = true },
                containerColor = Gold500,
                contentColor = Color.White,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .padding(bottom = 72.dp)
                    .testTag("fab_report_maintenance")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.Build, contentDescription = strings.reportIssue)
                    Text(text = strings.reportIssue, fontWeight = FontWeight.Bold)
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp)
        ) {
            // Header
            item {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = strings.maintenance,
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Report repairs and track in-room technician progress in real-time.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Active Requests Section
            item {
                Text(
                    text = "Active Requests (${activeTickets.size})",
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
            }

            if (activeTickets.isEmpty()) {
                item {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.CheckCircleOutline, contentDescription = null, tint = Emerald600, modifier = Modifier.size(40.dp))
                            Text("All systems operating properly!", fontWeight = FontWeight.Bold, color = Navy800)
                            Text("No open maintenance requests for Unit ${tenant?.roomNumber ?: "204"}", style = MaterialTheme.typography.bodySmall, color = Slate600)
                        }
                    }
                }
            } else {
                items(activeTickets) { ticket ->
                    val feedback = feedbacks.find { it.ticketId == ticket.id }
                    TenantTicketProgressCard(
                        ticket = ticket,
                        feedback = feedback,
                        language = language,
                        strings = strings,
                        onRate = { viewModel.openRatingDialog(ticket) }
                    )
                }
            }

            // Resolved History Section
            if (resolvedTickets.isNotEmpty()) {
                item {
                    Text(
                        text = "Resolved History",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                }

                items(resolvedTickets) { ticket ->
                    val feedback = feedbacks.find { it.ticketId == ticket.id }
                    TenantTicketProgressCard(
                        ticket = ticket,
                        feedback = feedback,
                        language = language,
                        strings = strings,
                        onRate = { viewModel.openRatingDialog(ticket) }
                    )
                }
            }
        }
    }

    // New Maintenance Ticket Dialog
    if (showNewTicketDialog) {
        NewTicketDialog(
            strings = strings,
            language = language,
            onDismiss = { showNewTicketDialog = false },
            onSubmit = { title, category, description, priority, photoDesc ->
                val roomNo = tenant?.roomNumber ?: "204"
                val resId = tenant?.id ?: "res_204"
                val resName = tenant?.fullName ?: "Fauzie Ali Akhmad"
                viewModel.submitMaintenanceTicket(
                    roomNumber = roomNo,
                    residentId = resId,
                    residentName = resName,
                    title = title,
                    category = category,
                    description = description,
                    priority = priority,
                    photoDesc = photoDesc
                )
                showNewTicketDialog = false
            }
        )
    }
}

@Composable
fun TenantTicketProgressCard(
    ticket: MaintenanceTicket,
    feedback: ServiceFeedback?,
    language: AppLanguage,
    strings: StringsDict,
    onRate: () -> Unit
) {
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(shape = RoundedCornerShape(6.dp), color = Slate100) {
                        Text(
                            text = ticket.category.name,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = Slate800,
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
            }

            // Step Progress Visualizer
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(Slate100)
                    .padding(10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StepCircle(label = "Reported", isCompleted = true, isActive = ticket.status == MaintenanceStatus.REPORTED)
                StepLine(isCompleted = ticket.status != MaintenanceStatus.REPORTED)
                StepCircle(label = "Assigned", isCompleted = ticket.status == MaintenanceStatus.ASSIGNED || ticket.status == MaintenanceStatus.IN_PROGRESS || ticket.status == MaintenanceStatus.RESOLVED, isActive = ticket.status == MaintenanceStatus.ASSIGNED)
                StepLine(isCompleted = ticket.status == MaintenanceStatus.IN_PROGRESS || ticket.status == MaintenanceStatus.RESOLVED)
                StepCircle(label = "In Progress", isCompleted = ticket.status == MaintenanceStatus.IN_PROGRESS || ticket.status == MaintenanceStatus.RESOLVED, isActive = ticket.status == MaintenanceStatus.IN_PROGRESS)
                StepLine(isCompleted = ticket.status == MaintenanceStatus.RESOLVED)
                StepCircle(label = "Resolved", isCompleted = ticket.status == MaintenanceStatus.RESOLVED, isActive = ticket.status == MaintenanceStatus.RESOLVED)
            }

            if (ticket.assignedTechnician != null) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(Icons.Default.Engineering, contentDescription = null, tint = Navy800, modifier = Modifier.size(16.dp))
                    Text(
                        text = "Assigned to: ${ticket.assignedTechnician}",
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                        color = Navy800
                    )
                }
            }

            if (ticket.notes != null) {
                Text(
                    text = "Resolution: ${ticket.notes}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Emerald700
                )
            }

            // Rating / Feedback Card for Resolved Tickets
            if (ticket.status == MaintenanceStatus.RESOLVED) {
                HorizontalDivider(color = Slate200, thickness = 1.dp)
                if (feedback != null) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Gold500.copy(alpha = 0.08f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Gold500.copy(alpha = 0.25f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = "Your Rating:",
                                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, color = Gold600)
                                    )
                                    Row {
                                        for (i in 1..5) {
                                            Icon(
                                                imageVector = if (i <= feedback.rating) Icons.Default.Star else Icons.Outlined.StarBorder,
                                                contentDescription = null,
                                                tint = if (i <= feedback.rating) Gold500 else Slate300,
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                    }
                                }
                                Text(
                                    text = feedback.createdAt,
                                    style = MaterialTheme.typography.labelSmall.copy(fontSize = 10.sp, color = Slate500)
                                )
                            }
                            if (feedback.aspects.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = feedback.aspects.joinToString(" • "),
                                    style = MaterialTheme.typography.labelSmall.copy(color = Navy800, fontWeight = FontWeight.Medium)
                                )
                            }
                            if (!feedback.comment.isNullOrBlank()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "\"${feedback.comment}\"",
                                    style = MaterialTheme.typography.bodySmall.copy(color = Slate700, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                                )
                            }
                        }
                    }
                } else {
                    Button(
                        onClick = onRate,
                        colors = ButtonDefaults.buttonColors(containerColor = Gold600),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(38.dp)
                            .testTag("btn_rate_ticket_${ticket.id}")
                    ) {
                        Icon(Icons.Default.Star, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(strings.rateService, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun StepCircle(label: String, isCompleted: Boolean, isActive: Boolean) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        Box(
            modifier = Modifier
                .size(18.dp)
                .clip(CircleShape)
                .background(
                    when {
                        isCompleted -> Navy800
                        isActive -> Gold500
                        else -> Slate300
                    }
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isCompleted) {
                Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
            }
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(fontSize = 9.sp),
            color = if (isCompleted || isActive) Navy800 else Slate400
        )
    }
}

@Composable
fun RowScope.StepLine(isCompleted: Boolean) {
    Box(
        modifier = Modifier
            .weight(1f)
            .height(2.dp)
            .background(if (isCompleted) Navy800 else Slate300)
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewTicketDialog(
    strings: StringsDict,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onSubmit: (title: String, category: MaintenanceCategory, description: String, priority: MaintenancePriority, photoDesc: String?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf(MaintenanceCategory.AIR_CONDITIONER) }
    var description by remember { mutableStateOf("") }
    var selectedPriority by remember { mutableStateOf(MaintenancePriority.MEDIUM) }
    var attachPhoto by remember { mutableStateOf(true) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(strings.reportIssue, fontWeight = FontWeight.Bold) },
        text = {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    OutlinedTextField(
                        value = title,
                        onValueChange = { title = it },
                        label = { Text("Issue Title (e.g. AC Not Cooling)") },
                        modifier = Modifier.fillMaxWidth().testTag("input_ticket_title"),
                        singleLine = true
                    )
                }

                item {
                    Text("Category", style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(MaintenanceCategory.values()) { cat ->
                            FilterChip(
                                selected = selectedCategory == cat,
                                onClick = { selectedCategory = cat },
                                label = { Text(cat.name) }
                            )
                        }
                    }
                }

                item {
                    Text("Priority Level", style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(MaintenancePriority.values()) { prio ->
                            FilterChip(
                                selected = selectedPriority == prio,
                                onClick = { selectedPriority = prio },
                                label = { Text(prio.name) }
                            )
                        }
                    }
                }

                item {
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Describe the issue in detail...") },
                        modifier = Modifier.fillMaxWidth().height(100.dp),
                        maxLines = 4
                    )
                }

                item {
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (attachPhoto) Gold50 else Slate100,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { attachPhoto = !attachPhoto }
                            .padding(4.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.CameraAlt,
                                contentDescription = null,
                                tint = if (attachPhoto) Gold600 else Slate600
                            )
                            Text(
                                text = if (attachPhoto) "Photo attached (IMG_204_AC_LEAK.jpg)" else "Attach Photo Proof",
                                style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold),
                                color = if (attachPhoto) Gold600 else Slate600
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        onSubmit(
                            title,
                            selectedCategory,
                            description.ifBlank { "Standard repair requested." },
                            selectedPriority,
                            if (attachPhoto) "IMG_204_PHOTO.jpg" else null
                        )
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Navy800),
                modifier = Modifier.testTag("btn_submit_ticket")
            ) {
                Text(strings.submitRequest)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(strings.cancel)
            }
        }
    )
}
