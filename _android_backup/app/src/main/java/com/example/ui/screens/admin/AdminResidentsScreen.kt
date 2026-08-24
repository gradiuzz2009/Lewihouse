package com.example.ui.screens.admin

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.platform.LocalContext
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
import com.example.ui.components.StatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel
import java.net.URLEncoder

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminResidentsScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val residents by viewModel.residents.collectAsState()
    val rooms by viewModel.rooms.collectAsState()
    var searchQuery by remember { mutableStateOf("") }
    var selectedStatus by remember { mutableStateOf<ResidentStatus?>(null) }
    var showAddDialog by remember { mutableStateOf(false) }
    var viewingResident by remember { mutableStateOf<Resident?>(null) }
    var reminderResident by remember { mutableStateOf<Resident?>(null) }

    val context = LocalContext.current

    val filteredResidents = residents.filter { res ->
        val matchesSearch = res.fullName.contains(searchQuery, ignoreCase = true) ||
                res.roomNumber.contains(searchQuery, ignoreCase = true) ||
                res.phone.contains(searchQuery, ignoreCase = true)
        val matchesStatus = selectedStatus == null || res.status == selectedStatus
        matchesSearch && matchesStatus
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.secondary,
                contentColor = MaterialTheme.colorScheme.onSecondary,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .padding(bottom = 72.dp)
                    .testTag("fab_add_resident")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.PersonAdd, contentDescription = strings.addResident)
                    Text(text = strings.addResident, fontWeight = FontWeight.Bold)
                }
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp)
        ) {
            // Title & Search
            item {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "${strings.residents} (${residents.size})",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                    )

                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text(strings.search) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = strings.clear)
                                }
                            }
                        },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("search_residents"),
                        singleLine = true
                    )
                }
            }

            // Status filter chips
            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    item {
                        FilterChip(
                            selected = selectedStatus == null,
                            onClick = { selectedStatus = null },
                            label = { Text(strings.all) }
                        )
                    }
                    items(ResidentStatus.values()) { status ->
                        FilterChip(
                            selected = selectedStatus == status,
                            onClick = { selectedStatus = status },
                            label = {
                                Text(
                                    when (status) {
                                        ResidentStatus.ACTIVE -> strings.activeLease
                                        ResidentStatus.MOVING_OUT -> strings.movingOutSoon
                                        ResidentStatus.ARCHIVED -> strings.archived
                                    }
                                )
                            }
                        )
                    }
                }
            }

            // Resident Cards List
            if (filteredResidents.isEmpty()) {
                item {
                    EmptyStateCard(
                        icon = Icons.Default.PeopleOutline,
                        title = strings.emptyResidentsTitle,
                        description = strings.emptyResidentsDesc,
                        actionButtonText = strings.resetFilter,
                        onActionClick = {
                            searchQuery = ""
                            selectedStatus = null
                        }
                    )
                }
            } else {
                items(filteredResidents) { resident ->
                    ResidentCard(
                        resident = resident,
                        language = language,
                        strings = strings,
                        onViewDetails = { viewingResident = resident },
                        onSendReminder = { reminderResident = resident },
                        onDelete = { viewModel.deleteResident(resident.id) }
                    )
                }
            }
        }
    }

    // Resident Detail Modal
    if (viewingResident != null) {
        val res = viewingResident!!
        AlertDialog(
            onDismissRequest = { viewingResident = null },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = res.fullName.take(2).uppercase(),
                            color = MaterialTheme.colorScheme.onPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Column {
                        Text(text = res.fullName, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text(text = "Unit ${res.roomNumber}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.secondary)
                    }
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    DetailRow(label = "KTP / ID No.", value = res.ktpNumber)
                    DetailRow(label = strings.contactInfo, value = res.phone)
                    DetailRow(label = "Email", value = res.email)
                    DetailRow(label = "Move-in Date", value = res.moveInDate)
                    DetailRow(label = strings.leasePeriod, value = res.leaseEndDate)
                    DetailRow(label = strings.monthlyRate, value = LanguageManager.formatCurrency(res.monthlyRent, language))
                    DetailRow(label = strings.deposit, value = LanguageManager.formatCurrency(res.depositAmount, language))
                    DetailRow(label = strings.emergencyContact, value = "${res.emergencyContact} (${res.emergencyPhone})")
                    if (res.outstandingDebt > 0) {
                        DetailRow(
                            label = strings.debtBalance,
                            value = LanguageManager.formatCurrency(res.outstandingDebt, language),
                            valueColor = MaterialTheme.colorScheme.error
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { viewingResident = null },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text(strings.close)
                }
            }
        )
    }

    // WhatsApp Reminder Confirmation
    if (reminderResident != null) {
        val res = reminderResident!!
        val rentFormatted = LanguageManager.formatCurrency(res.monthlyRent, language)
        val message = LanguageManager.generateWhatsAppReminder(
            residentName = res.fullName,
            roomNumber = res.roomNumber,
            amount = rentFormatted,
            dueDate = res.leaseEndDate,
            language = language
        )

        AlertDialog(
            onDismissRequest = { reminderResident = null },
            title = { Text(strings.sendReminder) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("${strings.sendReminder}: ${res.fullName} (${res.phone})")
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = message,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(12.dp)
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val cleanPhone = res.phone.replace("+", "").replace("-", "").replace(" ", "").trim()
                        val waPhone = if (cleanPhone.startsWith("0")) "62" + cleanPhone.substring(1) else cleanPhone
                        val encoded = try {
                            URLEncoder.encode(message, "UTF-8")
                        } catch (e: Exception) {
                            message
                        }
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$waPhone?text=$encoded"))
                        try {
                            context.startActivity(intent)
                        } catch (e: Exception) {
                            // Fallback
                        }
                        reminderResident = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                    modifier = Modifier.testTag("btn_confirm_send_reminder")
                ) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("WhatsApp")
                }
            },
            dismissButton = {
                TextButton(onClick = { reminderResident = null }) {
                    Text(strings.cancel)
                }
            }
        )
    }

    // New Resident Registration Modal Dialog
    if (showAddDialog) {
        AddResidentDialog(
            availableRooms = rooms.filter { it.status == UnitStatus.VACANT },
            strings = strings,
            language = language,
            onDismiss = { showAddDialog = false },
            onSave = { name, phone, email, ktp, roomNo, moveIn, leaseEnd, rent, deposit, emContact, emPhone, notes ->
                viewModel.saveResident(
                    fullName = name,
                    phone = phone,
                    email = email,
                    ktpNumber = ktp,
                    roomNumber = roomNo,
                    moveInDate = moveIn,
                    leaseEndDate = leaseEnd,
                    monthlyRent = rent,
                    depositAmount = deposit,
                    emergencyContact = emContact,
                    emergencyPhone = emPhone
                )
                showAddDialog = false
            }
        )
    }
}

@Composable
fun ResidentCard(
    resident: Resident,
    language: AppLanguage,
    strings: StringsDict,
    onViewDetails: () -> Unit,
    onSendReminder: () -> Unit,
    onDelete: () -> Unit
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
            // Header row: Avatar, Name, Room badge, Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = resident.fullName.take(2).uppercase(),
                            color = MaterialTheme.colorScheme.onPrimary,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Column {
                        Text(
                            text = resident.fullName,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "Unit ${resident.roomNumber} • ${resident.phone}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                StatusBadge(
                    statusText = when (resident.status) {
                        ResidentStatus.ACTIVE -> strings.activeLease
                        ResidentStatus.MOVING_OUT -> strings.movingOutSoon
                        ResidentStatus.ARCHIVED -> strings.archived
                    },
                    containerColor = when (resident.status) {
                        ResidentStatus.ACTIVE -> MaterialTheme.colorScheme.tertiaryContainer
                        ResidentStatus.MOVING_OUT -> MaterialTheme.colorScheme.secondaryContainer
                        ResidentStatus.ARCHIVED -> MaterialTheme.colorScheme.surfaceVariant
                    },
                    textColor = when (resident.status) {
                        ResidentStatus.ACTIVE -> MaterialTheme.colorScheme.onTertiaryContainer
                        ResidentStatus.MOVING_OUT -> MaterialTheme.colorScheme.onSecondaryContainer
                        ResidentStatus.ARCHIVED -> MaterialTheme.colorScheme.onSurfaceVariant
                    }
                )
            }

            // Financial & Lease Snapshot Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = strings.monthlyRate,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = LanguageManager.formatCurrency(resident.monthlyRent, language),
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = strings.leasePeriod,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = resident.leaseEndDate,
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = strings.debtBalance,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = LanguageManager.formatCurrency(resident.outstandingDebt, language),
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = if (resident.outstandingDebt > 0) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.tertiary
                        )
                    )
                }
            }

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(
                    onClick = onSendReminder,
                    contentPadding = PaddingValues(horizontal = 8.dp)
                ) {
                    Icon(Icons.AutoMirrored.Filled.Chat, contentDescription = null, modifier = Modifier.size(16.dp), tint = Emerald600)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(strings.sendReminder, color = Emerald600, style = MaterialTheme.typography.labelMedium)
                }

                TextButton(
                    onClick = onViewDetails,
                    contentPadding = PaddingValues(horizontal = 8.dp)
                ) {
                    Icon(Icons.Default.Visibility, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(strings.details, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}

@Composable
fun DetailRow(
    label: String,
    value: String,
    valueColor: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
            color = valueColor
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddResidentDialog(
    availableRooms: List<RoomUnit>,
    strings: StringsDict,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onSave: (
        name: String,
        phone: String,
        email: String,
        ktp: String,
        roomNumber: String,
        moveIn: String,
        leaseEnd: String,
        rent: Double,
        deposit: Double,
        emContact: String,
        emPhone: String,
        notes: String
    ) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var ktp by remember { mutableStateOf("") }
    var selectedRoom by remember { mutableStateOf(availableRooms.firstOrNull()?.roomNumber ?: "101") }
    var moveInDate by remember { mutableStateOf("2026-06-01") }
    var leaseEndDate by remember { mutableStateOf("2027-06-01") }
    var rentText by remember { mutableStateOf("3800000") }
    var depositText by remember { mutableStateOf("3800000") }
    var emContact by remember { mutableStateOf("") }
    var emPhone by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(text = strings.newResidentTitle, fontWeight = FontWeight.Bold)
        },
        text = {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text(strings.fullName) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_resident_name"),
                        singleLine = true
                    )
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text(strings.contactInfo) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier
                                .weight(1f)
                                .testTag("input_resident_phone"),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = ktp,
                            onValueChange = { ktp = it },
                            label = { Text("KTP / NIK") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                }

                item {
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                item {
                    Text(text = strings.roomNumber, style = MaterialTheme.typography.labelMedium)
                    if (availableRooms.isNotEmpty()) {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(availableRooms) { rm ->
                                FilterChip(
                                    selected = selectedRoom == rm.roomNumber,
                                    onClick = {
                                        selectedRoom = rm.roomNumber
                                        rentText = rm.monthlyRate.toLong().toString()
                                        depositText = rm.monthlyRate.toLong().toString()
                                    },
                                    label = { Text("Unit ${rm.roomNumber}") }
                                )
                            }
                        }
                    } else {
                        OutlinedTextField(
                            value = selectedRoom,
                            onValueChange = { selectedRoom = it },
                            label = { Text(strings.roomNumber) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = moveInDate,
                            onValueChange = { moveInDate = it },
                            label = { Text("Move In") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = leaseEndDate,
                            onValueChange = { leaseEndDate = it },
                            label = { Text(strings.leasePeriod) },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = rentText,
                            onValueChange = { rentText = it },
                            label = { Text(strings.monthlyRate) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = depositText,
                            onValueChange = { depositText = it },
                            label = { Text(strings.deposit) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = emContact,
                            onValueChange = { emContact = it },
                            label = { Text(strings.emergencyContact) },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = emPhone,
                            onValueChange = { emPhone = it },
                            label = { Text("Emergency Phone") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank() && phone.isNotBlank()) {
                        val rent = rentText.toDoubleOrNull() ?: 3800000.0
                        val deposit = depositText.toDoubleOrNull() ?: 3800000.0
                        onSave(name, phone, email, ktp, selectedRoom, moveInDate, leaseEndDate, rent, deposit, emContact, emPhone, notes)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier.testTag("btn_save_resident")
            ) {
                Text(strings.save)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(strings.cancel)
            }
        }
    )
}
