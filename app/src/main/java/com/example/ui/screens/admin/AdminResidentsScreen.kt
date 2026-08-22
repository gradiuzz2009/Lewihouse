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
import com.example.ui.components.StatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

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
                containerColor = Gold500,
                contentColor = Color.White,
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
                                    Icon(Icons.Default.Clear, contentDescription = "Clear")
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
                                        ResidentStatus.ARCHIVED -> "Archived"
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
                                Icons.Default.PeopleOutline,
                                contentDescription = null,
                                tint = Slate400,
                                modifier = Modifier.size(48.dp)
                            )
                            Text(
                                text = "No residents found",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
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
                            .background(Navy800),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = res.fullName.take(2).uppercase(),
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Column {
                        Text(text = res.fullName, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        Text(text = "Unit ${res.roomNumber}", style = MaterialTheme.typography.bodySmall, color = Gold500)
                    }
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    DetailRow(label = "KTP / ID No.", value = res.ktpNumber)
                    DetailRow(label = "Phone", value = res.phone)
                    DetailRow(label = "Email", value = res.email)
                    DetailRow(label = "Move-in Date", value = res.moveInDate)
                    DetailRow(label = "Lease End Date", value = res.leaseEndDate)
                    DetailRow(label = "Monthly Rent", value = LanguageManager.formatCurrency(res.monthlyRent, language))
                    DetailRow(label = "Deposit Held", value = LanguageManager.formatCurrency(res.depositAmount, language))
                    DetailRow(label = "Emergency Contact", value = "${res.emergencyContact} (${res.emergencyPhone})")
                    if (res.outstandingDebt > 0) {
                        DetailRow(
                            label = "Outstanding Debt",
                            value = LanguageManager.formatCurrency(res.outstandingDebt, language),
                            valueColor = Rose600
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { viewingResident = null },
                    colors = ButtonDefaults.buttonColors(containerColor = Navy800)
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
        val message = "Dear ${res.fullName}, this is a gentle reminder from Lewi House Management regarding your rent for Unit ${res.roomNumber} ($rentFormatted). Thank you for your cooperation!"

        AlertDialog(
            onDismissRequest = { reminderResident = null },
            title = { Text(strings.sendReminder) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Ready to send reminder to ${res.fullName} (${res.phone}):")
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Slate100,
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp)
                    ) {
                        Text(
                            text = message,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(12.dp),
                            color = Slate800
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.showSnackbar("Reminder sent to ${res.fullName} via WhatsApp!")
                        reminderResident = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald600)
                ) {
                    Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Send via WhatsApp")
                }
            },
            dismissButton = {
                TextButton(onClick = { reminderResident = null }) {
                    Text(strings.cancel)
                }
            }
        )
    }

    // Add Resident Dialog
    if (showAddDialog) {
        AddResidentDialog(
            availableRooms = rooms.filter { it.status == UnitStatus.VACANT || it.currentResidentId == null },
            strings = strings,
            language = language,
            onDismiss = { showAddDialog = false },
            onSave = { fullName, email, phone, roomNumber, moveInDate, leaseEndDate, monthlyRent, deposit, emergency, emergencyPhone, ktp ->
                viewModel.saveResident(
                    fullName = fullName,
                    email = email,
                    phone = phone,
                    roomNumber = roomNumber,
                    moveInDate = moveInDate,
                    leaseEndDate = leaseEndDate,
                    monthlyRent = monthlyRent,
                    depositAmount = deposit,
                    emergencyContact = emergency,
                    emergencyPhone = emergencyPhone,
                    ktpNumber = ktp
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
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
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
                            .background(Navy800),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = resident.fullName.take(2).uppercase(),
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
                        )
                    }
                    Column {
                        Text(
                            text = resident.fullName,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "${resident.phone} • ${resident.email}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Navy100
                ) {
                    Text(
                        text = "Unit ${resident.roomNumber}",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = Navy800,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            // Lease and financial status
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Slate100)
                    .padding(10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Lease Until",
                        style = MaterialTheme.typography.labelSmall,
                        color = Slate600
                    )
                    Text(
                        text = resident.leaseEndDate,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = Slate800
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = strings.monthlyRate,
                        style = MaterialTheme.typography.labelSmall,
                        color = Slate600
                    )
                    Text(
                        text = LanguageManager.formatCurrency(resident.monthlyRent, language),
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Navy800
                        )
                    )
                }
            }

            // Outstanding Debt Warning if any
            if (resident.outstandingDebt > 0) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Rose100,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = Rose700, modifier = Modifier.size(16.dp))
                            Text(
                                text = "Outstanding: ${LanguageManager.formatCurrency(resident.outstandingDebt, language)}",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Rose700
                            )
                        }
                        TextButton(
                            onClick = onSendReminder,
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text("Send Reminder", color = Rose700, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                }
            }

            // Action Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                TextButton(
                    onClick = onSendReminder,
                    contentPadding = PaddingValues(horizontal = 10.dp)
                ) {
                    Icon(Icons.Default.Chat, contentDescription = null, tint = Emerald700, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("WhatsApp", color = Emerald700, style = MaterialTheme.typography.labelMedium)
                }
                TextButton(
                    onClick = onViewDetails,
                    contentPadding = PaddingValues(horizontal = 10.dp)
                ) {
                    Icon(Icons.Default.Visibility, contentDescription = null, tint = Navy800, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(strings.details, color = Navy800, style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}

@Composable
fun DetailRow(label: String, value: String, valueColor: Color = Slate800) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = Slate600)
        Text(text = value, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold), color = valueColor)
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
        fullName: String,
        email: String,
        phone: String,
        roomNumber: String,
        moveInDate: String,
        leaseEndDate: String,
        monthlyRent: Double,
        deposit: Double,
        emergency: String,
        emergencyPhone: String,
        ktp: String
    ) -> Unit
) {
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("+62 8") }
    var selectedRoomNumber by remember { mutableStateOf(availableRooms.firstOrNull()?.roomNumber ?: "102") }
    var moveInDate by remember { mutableStateOf("2026-09-01") }
    var leaseEndDate by remember { mutableStateOf("2027-08-31") }
    var monthlyRentText by remember { mutableStateOf("3800000") }
    var depositText by remember { mutableStateOf("3800000") }
    var emergencyContact by remember { mutableStateOf("Parent / Spouse") }
    var emergencyPhone by remember { mutableStateOf("+62 812-0000-0000") }
    var ktpNumber by remember { mutableStateOf("3271040000000001") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(strings.newResidentTitle, fontWeight = FontWeight.Bold) },
        text = {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    OutlinedTextField(
                        value = fullName,
                        onValueChange = { fullName = it },
                        label = { Text(strings.fullName) },
                        modifier = Modifier.fillMaxWidth().testTag("input_resident_name"),
                        singleLine = true
                    )
                }

                item {
                    OutlinedTextField(
                        value = phone,
                        onValueChange = { phone = it },
                        label = { Text("Phone Number") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                item {
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email Address") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                item {
                    OutlinedTextField(
                        value = ktpNumber,
                        onValueChange = { ktpNumber = it },
                        label = { Text("KTP / Passport Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                item {
                    Text(text = "Assign Room", style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(availableRooms) { room ->
                            FilterChip(
                                selected = selectedRoomNumber == room.roomNumber,
                                onClick = {
                                    selectedRoomNumber = room.roomNumber
                                    monthlyRentText = room.monthlyRate.toLong().toString()
                                    depositText = room.monthlyRate.toLong().toString()
                                },
                                label = { Text("Unit ${room.roomNumber} (${LanguageManager.formatCurrency(room.monthlyRate, language)})") }
                            )
                        }
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
                            label = { Text("Lease End") },
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                }

                item {
                    OutlinedTextField(
                        value = monthlyRentText,
                        onValueChange = { monthlyRentText = it },
                        label = { Text("${strings.monthlyRate} (IDR)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                item {
                    OutlinedTextField(
                        value = depositText,
                        onValueChange = { depositText = it },
                        label = { Text("${strings.deposit} (IDR)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                item {
                    OutlinedTextField(
                        value = emergencyContact,
                        onValueChange = { emergencyContact = it },
                        label = { Text(strings.emergencyContact) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (fullName.isNotBlank()) {
                        val rent = monthlyRentText.toDoubleOrNull() ?: 3800000.0
                        val deposit = depositText.toDoubleOrNull() ?: 3800000.0
                        onSave(fullName, email, phone, selectedRoomNumber, moveInDate, leaseEndDate, rent, deposit, emergencyContact, emergencyPhone, ktpNumber)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Navy800),
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
