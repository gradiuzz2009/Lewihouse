package com.example.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import com.example.ui.components.UnitStatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminRoomsScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val rooms by viewModel.rooms.collectAsState()
    var selectedFloor by remember { mutableStateOf<Int?>(null) } // null = all
    var selectedStatus by remember { mutableStateOf<UnitStatus?>(null) } // null = all
    var showAddEditDialog by remember { mutableStateOf(false) }
    var editingRoom by remember { mutableStateOf<RoomUnit?>(null) }
    var statusChangeRoom by remember { mutableStateOf<RoomUnit?>(null) }

    val filteredRooms = rooms.filter { room ->
        (selectedFloor == null || room.floor == selectedFloor) &&
        (selectedStatus == null || room.status == selectedStatus)
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    editingRoom = null
                    showAddEditDialog = true
                },
                containerColor = MaterialTheme.colorScheme.secondary,
                contentColor = MaterialTheme.colorScheme.onSecondary,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .padding(bottom = 72.dp)
                    .testTag("fab_add_room")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.Add, contentDescription = strings.addRoom)
                    Text(text = strings.addRoom, fontWeight = FontWeight.Bold)
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
            // Header summary
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "${strings.rooms} (${rooms.size})",
                            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "${rooms.count { it.status == UnitStatus.VACANT }} ${strings.vacant} • ${rooms.count { it.status == UnitStatus.OCCUPIED }} ${strings.occupied}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Floor Filter Chips
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    item {
                        FilterChip(
                            selected = selectedFloor == null,
                            onClick = { selectedFloor = null },
                            label = { Text(strings.allFloors) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primary,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                            )
                        )
                    }
                    items(listOf(1, 2, 3)) { floor ->
                        FilterChip(
                            selected = selectedFloor == floor,
                            onClick = { selectedFloor = floor },
                            label = { Text(String.format(strings.floorNumber, floor)) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = MaterialTheme.colorScheme.primary,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                            )
                        )
                    }
                }
            }

            // Status Filter Chips
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    item {
                        FilterChip(
                            selected = selectedStatus == null,
                            onClick = { selectedStatus = null },
                            label = { Text(strings.all) }
                        )
                    }
                    items(UnitStatus.values()) { status ->
                        FilterChip(
                            selected = selectedStatus == status,
                            onClick = { selectedStatus = status },
                            label = {
                                Text(
                                    when (status) {
                                        UnitStatus.OCCUPIED -> strings.occupied
                                        UnitStatus.VACANT -> strings.vacant
                                        UnitStatus.MAINTENANCE -> strings.underMaintenance
                                    }
                                )
                            }
                        )
                    }
                }
            }

            // Empty state
            if (filteredRooms.isEmpty()) {
                item {
                    EmptyStateCard(
                        icon = Icons.Default.MeetingRoom,
                        title = strings.emptyRoomsTitle,
                        description = strings.emptyRoomsDesc,
                        actionButtonText = strings.resetFilter,
                        onActionClick = {
                            selectedFloor = null
                            selectedStatus = null
                        }
                    )
                }
            } else {
                items(filteredRooms) { room ->
                    RoomUnitCard(
                        room = room,
                        language = language,
                        strings = strings,
                        onEdit = {
                            editingRoom = room
                            showAddEditDialog = true
                        },
                        onChangeStatus = {
                            statusChangeRoom = room
                        },
                        onDelete = {
                            viewModel.deleteRoom(room.id)
                        }
                    )
                }
            }
        }
    }

    // Status Change Dialog
    if (statusChangeRoom != null) {
        val targetRoom = statusChangeRoom!!
        AlertDialog(
            onDismissRequest = { statusChangeRoom = null },
            title = { Text("${strings.editRoomTitle} ${targetRoom.roomNumber}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    UnitStatus.values().forEach { status ->
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (targetRoom.status == status) MaterialTheme.colorScheme.primaryContainer else Color.Transparent,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    viewModel.updateRoomStatus(targetRoom.id, status)
                                    statusChangeRoom = null
                                }
                                .padding(12.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = when (status) {
                                        UnitStatus.OCCUPIED -> strings.occupied
                                        UnitStatus.VACANT -> strings.vacant
                                        UnitStatus.MAINTENANCE -> strings.underMaintenance
                                    },
                                    fontWeight = if (targetRoom.status == status) FontWeight.Bold else FontWeight.Normal
                                )
                                if (targetRoom.status == status) {
                                    Icon(Icons.Default.Check, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { statusChangeRoom = null }) {
                    Text(strings.close)
                }
            }
        )
    }

    // Add / Edit Room Modal Dialog
    if (showAddEditDialog) {
        AddEditRoomDialog(
            existingRoom = editingRoom,
            strings = strings,
            language = language,
            onDismiss = { showAddEditDialog = false },
            onSave = { roomNumber, type, floor, monthlyRate, status, amenities, sizeSqm, notes ->
                viewModel.saveRoom(
                    id = editingRoom?.id,
                    roomNumber = roomNumber,
                    type = type,
                    floor = floor,
                    monthlyRate = monthlyRate,
                    status = status,
                    amenities = amenities,
                    sizeSqm = sizeSqm,
                    notes = notes
                )
                showAddEditDialog = false
            }
        )
    }
}

@Composable
fun RoomUnitCard(
    room: RoomUnit,
    language: AppLanguage,
    strings: StringsDict,
    onEdit: () -> Unit,
    onChangeStatus: () -> Unit,
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
            // Top Row: Unit #, Type badge, Status
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
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = room.roomNumber,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                    Column {
                        Text(
                            text = if (language == AppLanguage.ID) room.type.displayNameId else room.type.displayNameEn,
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "${String.format(strings.floorNumber, room.floor)} • ${room.sizeSqm.toInt()} m²",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.clickable { onChangeStatus() }
                ) {
                    UnitStatusBadge(status = room.status, strings = strings)
                }
            }

            // Pricing & Occupant info
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = strings.monthlyRate,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = LanguageManager.formatCurrency(room.monthlyRate, language),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = strings.occupant,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = room.currentResidentName ?: strings.noOccupant,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.SemiBold,
                            color = if (room.currentResidentName != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    )
                }
            }

            // Amenities List
            if (room.amenities.isNotEmpty()) {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(room.amenities) { amenity ->
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Text(
                                text = amenity,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
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
                    onClick = { onChangeStatus() },
                    contentPadding = PaddingValues(horizontal = 10.dp)
                ) {
                    Icon(Icons.Default.Sync, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(strings.status, color = MaterialTheme.colorScheme.primary, style = MaterialTheme.typography.labelMedium)
                }
                TextButton(
                    onClick = onEdit,
                    contentPadding = PaddingValues(horizontal = 10.dp)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.secondary)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(strings.edit, color = MaterialTheme.colorScheme.secondary, style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditRoomDialog(
    existingRoom: RoomUnit?,
    strings: StringsDict,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onSave: (
        roomNumber: String,
        type: UnitType,
        floor: Int,
        monthlyRate: Double,
        status: UnitStatus,
        amenities: List<String>,
        sizeSqm: Double,
        notes: String
    ) -> Unit
) {
    var roomNumber by remember { mutableStateOf(existingRoom?.roomNumber ?: "") }
    var selectedType by remember { mutableStateOf(existingRoom?.type ?: UnitType.STANDARD) }
    var floorText by remember { mutableStateOf(existingRoom?.floor?.toString() ?: "1") }
    var rateText by remember { mutableStateOf(existingRoom?.monthlyRate?.toLong()?.toString() ?: "3000000") }
    var selectedStatus by remember { mutableStateOf(existingRoom?.status ?: UnitStatus.VACANT) }
    var amenitiesText by remember {
        mutableStateOf(existingRoom?.amenities?.joinToString(", ") ?: "AC Inverter, En-suite Bath, Smart TV, WiFi")
    }
    var sizeText by remember { mutableStateOf(existingRoom?.sizeSqm?.toString() ?: "20") }
    var notesText by remember { mutableStateOf(existingRoom?.notes ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = if (existingRoom != null) strings.editRoomTitle else strings.newRoomTitle,
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    OutlinedTextField(
                        value = roomNumber,
                        onValueChange = { roomNumber = it },
                        label = { Text(strings.roomNumber) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("input_room_number"),
                        singleLine = true
                    )
                }

                item {
                    Text(text = strings.roomType, style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(UnitType.values()) { type ->
                            FilterChip(
                                selected = selectedType == type,
                                onClick = { selectedType = type },
                                label = { Text(if (language == AppLanguage.ID) type.displayNameId else type.displayNameEn) }
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
                            value = floorText,
                            onValueChange = { floorText = it },
                            label = { Text(strings.floorLevel) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = sizeText,
                            onValueChange = { sizeText = it },
                            label = { Text(strings.size) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.weight(1f),
                            singleLine = true
                        )
                    }
                }

                item {
                    OutlinedTextField(
                        value = rateText,
                        onValueChange = { rateText = it },
                        label = { Text("${strings.monthlyRate} (IDR)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                item {
                    OutlinedTextField(
                        value = amenitiesText,
                        onValueChange = { amenitiesText = it },
                        label = { Text("${strings.amenities} (comma separated)") },
                        modifier = Modifier.fillMaxWidth()
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
                    if (roomNumber.isNotBlank()) {
                        val floor = floorText.toIntOrNull() ?: 1
                        val rate = rateText.toDoubleOrNull() ?: 3000000.0
                        val size = sizeText.toDoubleOrNull() ?: 20.0
                        val amenitiesList = amenitiesText.split(",").map { it.trim() }.filter { it.isNotBlank() }
                        onSave(roomNumber, selectedType, floor, rate, selectedStatus, amenitiesList, size, notesText)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier.testTag("btn_save_room")
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
