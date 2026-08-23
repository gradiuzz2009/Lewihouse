package com.example.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.example.data.language.LanguageManager
import com.example.data.language.StringsDict
import com.example.data.model.*
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

@Composable
fun AdminTransferCalculatorScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val residents by viewModel.residents.collectAsState()
    val rooms by viewModel.rooms.collectAsState()

    var selectedResidentId by remember { mutableStateOf<String?>(null) }
    var selectedTargetRoomNumber by remember { mutableStateOf<String?>(null) }
    var daysUsedInMonth by remember { mutableFloatStateOf(10f) }
    var effectiveDate by remember { mutableStateOf("2026-08-25") }
    var showConfirmDialog by remember { mutableStateOf(false) }

    // Resolve current resident and current room
    val activeResidents = residents.filter { it.status == ResidentStatus.ACTIVE }
    val resident = activeResidents.find { it.id == selectedResidentId } ?: activeResidents.firstOrNull()
    val currentRoom = rooms.find { it.roomNumber == resident?.roomNumber }
    
    // Target room candidate options (excluding the current room)
    val availableTargetRooms = rooms.filter { it.roomNumber != currentRoom?.roomNumber }
    val targetRoom = availableTargetRooms.find { it.roomNumber == selectedTargetRoomNumber } ?: availableTargetRooms.firstOrNull()

    // Calculation result
    val calculation: RoomTransferCalculation? = if (resident != null && currentRoom != null && targetRoom != null) {
        RoomTransferCalculation.calculate(
            resident = resident,
            currentRoom = currentRoom,
            targetRoom = targetRoom,
            transferDate = effectiveDate,
            daysUsedInCurrentMonth = daysUsedInMonth.toInt(),
            totalCycleDays = 30
        )
    } else null

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp)
    ) {
        // Title Banner
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Calculate, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
                        Text(
                            text = strings.transferCalcTitle,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    }
                    Text(
                        text = strings.transferCalcDesc,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.85f)
                    )
                }
            }
        }

        // Step 1: Select Resident
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
                    Text(
                        text = "1. ${strings.residents}",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(activeResidents) { res ->
                            val isSelected = (res.id == resident?.id)
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedResidentId = res.id },
                                label = { Text("${res.fullName} (Unit ${res.roomNumber})") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                                )
                            )
                        }
                    }

                    if (currentRoom != null && resident != null) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(strings.currentRoom, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text("Unit ${currentRoom.roomNumber} (${currentRoom.type.name})", fontWeight = FontWeight.Bold)
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(strings.monthlyRate, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text(LanguageManager.formatCurrency(currentRoom.monthlyRate, language), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 2: Select Target Room
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
                    Text(
                        text = "2. ${strings.destinationRoom}",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(availableTargetRooms) { rm ->
                            val isSelected = (rm.roomNumber == targetRoom?.roomNumber)
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedTargetRoomNumber = rm.roomNumber },
                                label = { Text("Unit ${rm.roomNumber} - ${rm.type.name} (${LanguageManager.formatCurrency(rm.monthlyRate, language)})") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.secondary,
                                    selectedLabelColor = MaterialTheme.colorScheme.onSecondary
                                )
                            )
                        }
                    }

                    if (targetRoom != null) {
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.5f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(strings.destinationRoom, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondaryContainer)
                                    Text("Unit ${targetRoom.roomNumber} (${targetRoom.type.name})", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondaryContainer)
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(strings.monthlyRate, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSecondaryContainer)
                                    Text(LanguageManager.formatCurrency(targetRoom.monthlyRate, language), fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondaryContainer)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 3: Proration Timing Slider
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
                            text = "3. Sisa & Durasi Hari",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.primaryContainer
                        ) {
                            Text(
                                text = "${daysUsedInMonth.toInt()} ${strings.daysUsed}",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onPrimaryContainer,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Slider(
                        value = daysUsedInMonth,
                        onValueChange = { daysUsedInMonth = it },
                        valueRange = 1f..29f,
                        steps = 27,
                        colors = SliderDefaults.colors(
                            thumbColor = MaterialTheme.colorScheme.primary,
                            activeTrackColor = MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier.fillMaxWidth().testTag("slider_days_used")
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Hari ke-1 (Awal Bulan)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("Hari ke-30 (Akhir Bulan)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }

        // Calculation Result Card
        if (calculation != null) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (calculation.isPayable()) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.5f)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Rincian Perhitungan Prorata",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.ExtraBold),
                            color = MaterialTheme.colorScheme.primary
                        )

                        CalculationLine(
                            label = "Tarif Harian Kamar Lama (${calculation.fromRoomNumber})",
                            value = "${LanguageManager.formatCurrency(calculation.oldRoomDailyRate, language)} / hari"
                        )
                        CalculationLine(
                            label = "Tarif Harian Kamar Baru (${calculation.toRoomNumber})",
                            value = "${LanguageManager.formatCurrency(calculation.newRoomDailyRate, language)} / hari"
                        )
                        CalculationLine(
                            label = "${strings.oldRoomCredit} (${calculation.remainingDaysInBillingCycle} hari)",
                            value = "- ${LanguageManager.formatCurrency(calculation.unusedOldRoomCredit, language)}",
                            valueColor = Emerald600
                        )
                        CalculationLine(
                            label = "${strings.newRoomCharge} (${calculation.remainingDaysInBillingCycle} hari)",
                            value = "+ ${LanguageManager.formatCurrency(calculation.newRoomProratedCharge, language)}",
                            valueColor = MaterialTheme.colorScheme.onSurface
                        )
                        CalculationLine(
                            label = "Selisih Penyesuaian Deposit",
                            value = if (calculation.depositAdjustment >= 0) {
                                "+ ${LanguageManager.formatCurrency(calculation.depositAdjustment, language)}"
                            } else {
                                "- ${LanguageManager.formatCurrency(-calculation.depositAdjustment, language)}"
                            }
                        )

                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))

                        // Grand Total Highlight
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (calculation.isPayable()) MaterialTheme.colorScheme.primary else Emerald600)
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = if (calculation.isPayable()) strings.residentPays else strings.propertyRefunds,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.secondary
                                )
                                Text(
                                    text = if (calculation.isPayable()) "Selisih yang Harus Dibayar" else "Kredit yang Dikembalikan",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.White
                                )
                            }
                            Text(
                                text = LanguageManager.formatCurrency(
                                    if (calculation.totalNetPayableOrRefund < 0) -calculation.totalNetPayableOrRefund else calculation.totalNetPayableOrRefund,
                                    language
                                ),
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Color.White
                                )
                            )
                        }

                        // Execute Transfer Button
                        Button(
                            onClick = { showConfirmDialog = true },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(50.dp)
                                .testTag("btn_execute_transfer")
                        ) {
                            Icon(Icons.Default.SwapHoriz, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondary)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = strings.executeTransfer,
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSecondary
                            )
                        }
                    }
                }
            }
        }
    }

    // Transfer Confirmation Dialog
    if (showConfirmDialog && calculation != null) {
        AlertDialog(
            onDismissRequest = { showConfirmDialog = false },
            title = {
                Text("Konfirmasi Pindah Kamar", fontWeight = FontWeight.Bold)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Terapkan perpindahan kamar untuk ${calculation.residentName}:")
                    Text("• Kamar ${calculation.fromRoomNumber} -> Kamar ${calculation.toRoomNumber}")
                    Text("• Tanggal Efektif: ${calculation.transferEffectiveDate}")
                    Text(
                        text = if (calculation.isPayable()) {
                            "• Penghuni membayar selisih: ${LanguageManager.formatCurrency(calculation.totalNetPayableOrRefund, language)}"
                        } else {
                            "• Pengembalian ke penghuni: ${LanguageManager.formatCurrency(-calculation.totalNetPayableOrRefund, language)}"
                        },
                        fontWeight = FontWeight.Bold
                    )
                    Text("Data status kamar, kontrak penghuni, dan buku kas akan langsung diperbarui.")
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.executeRoomTransfer(calculation)
                        showConfirmDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text(strings.confirm)
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirmDialog = false }) {
                    Text(strings.cancel)
                }
            }
        )
    }
}

@Composable
fun CalculationLine(label: String, value: String, valueColor: Color = MaterialTheme.colorScheme.onSurface) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold), color = valueColor)
    }
}
