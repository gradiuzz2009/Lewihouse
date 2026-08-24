package com.example.ui.screens.admin

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.language.AppLanguage
import com.example.data.language.LanguageManager
import com.example.data.language.StringsDict
import com.example.data.model.*
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminElectricityScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val rooms by viewModel.rooms.collectAsState()
    val meters by viewModel.meters.collectAsState()
    val tokens by viewModel.tokens.collectAsState()

    var selectedRoomForToken by remember { mutableStateOf(rooms.firstOrNull()?.roomNumber ?: "204") }
    var selectedNominal by remember { mutableDoubleStateOf(200000.0) }
    var showRecordReadingDialog by remember { mutableStateOf(false) }
    var recordingMeter by remember { mutableStateOf<ElectricityMeter?>(null) }

    val context = LocalContext.current
    val kwhEstimate = (selectedNominal / 1699.53)

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp)
    ) {
        // Title
        item {
            Text(
                text = strings.electricityLedger,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
        }

        // Section 1: PLN Token Generator Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(MaterialTheme.colorScheme.secondaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.ElectricBolt, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondaryContainer)
                        }
                        Column {
                            Text(
                                text = strings.tokenGenerator,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                            )
                            Text(
                                text = "Terbitkan token 20 angka PLN prabayar ke meteran kamar",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Target Room Selector
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(text = strings.roomNumber, style = MaterialTheme.typography.labelMedium)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(rooms) { room ->
                                FilterChip(
                                    selected = selectedRoomForToken == room.roomNumber,
                                    onClick = { selectedRoomForToken = room.roomNumber },
                                    label = { Text("Unit ${room.roomNumber}") },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = MaterialTheme.colorScheme.primary,
                                        selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                                    )
                                )
                            }
                        }
                    }

                    // Nominal buttons
                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(text = strings.tokenAmount, style = MaterialTheme.typography.labelMedium)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            val nominals = listOf(50000.0, 100000.0, 200000.0, 500000.0, 1000000.0)
                            items(nominals) { nominal ->
                                FilterChip(
                                    selected = selectedNominal == nominal,
                                    onClick = { selectedNominal = nominal },
                                    label = { Text(LanguageManager.formatCurrency(nominal, language)) },
                                    colors = FilterChipDefaults.filterChipColors(
                                        selectedContainerColor = MaterialTheme.colorScheme.secondary,
                                        selectedLabelColor = MaterialTheme.colorScheme.onSecondary
                                    )
                                )
                            }
                        }
                    }

                    // Estimated kWh preview
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
                            Text("${strings.kwhReceived}:", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(
                                text = LanguageManager.formatKwh(kwhEstimate),
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Emerald600)
                            )
                        }
                    }

                    // Generate Token Button
                    Button(
                        onClick = {
                            val room = rooms.find { it.roomNumber == selectedRoomForToken }
                            val residentName = room?.currentResidentName ?: "Resident Unit $selectedRoomForToken"
                            viewModel.issueElectricityToken(selectedRoomForToken, selectedNominal, residentName)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                            .testTag("btn_generate_token")
                    ) {
                        Icon(Icons.Default.Bolt, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(strings.generateToken, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // Section 2: Room Meter Readings
        item {
            Text(
                text = strings.meterReadingTitle,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }

        items(meters) { meter ->
            MeterCardRow(
                meter = meter,
                language = language,
                strings = strings,
                onRecord = {
                    recordingMeter = meter
                    showRecordReadingDialog = true
                }
            )
        }

        // Section 3: Issued Token History
        item {
            Text(
                text = "Riwayat Token Diterbitkan",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }

        items(tokens) { token ->
            TokenHistoryCard(
                token = token,
                language = language,
                strings = strings,
                onCopy = {
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    val clip = ClipData.newPlainText("PLN Token", token.tokenCode)
                    clipboard.setPrimaryClip(clip)
                    viewModel.showSnackbar(strings.tokenCopied)
                }
            )
        }
    }

    // Record Meter Reading Modal
    if (showRecordReadingDialog && recordingMeter != null) {
        val target = recordingMeter!!
        var readingText by remember { mutableStateOf(target.currentReadingKwh.toString()) }

        AlertDialog(
            onDismissRequest = { showRecordReadingDialog = false },
            title = { Text("${strings.recordReading} - Unit ${target.roomNumber}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("${strings.meterId}: ${target.meterNumber}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("${strings.lastReading}: ${target.currentReadingKwh} kWh", fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(
                        value = readingText,
                        onValueChange = { readingText = it },
                        label = { Text("${strings.currentReading} (kWh)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth().testTag("input_meter_kwh"),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val kwh = readingText.toDoubleOrNull() ?: target.currentReadingKwh
                        viewModel.saveMeterReading(target.roomNumber, kwh)
                        showRecordReadingDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text(strings.save)
                }
            },
            dismissButton = {
                TextButton(onClick = { showRecordReadingDialog = false }) {
                    Text(strings.cancel)
                }
            }
        )
    }
}

@Composable
fun MeterCardRow(
    meter: ElectricityMeter,
    language: AppLanguage,
    strings: StringsDict,
    onRecord: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "Unit ${meter.roomNumber}",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Surface(shape = RoundedCornerShape(4.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
                        Text(
                            text = meter.meterNumber,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                Text(
                    text = "${strings.consumption}: ${LanguageManager.formatKwh(meter.consumptionKwh)} (${LanguageManager.formatCurrency(meter.estimatedCost, language)})",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Button(
                onClick = onRecord,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(strings.recordReading, style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

@Composable
fun TokenHistoryCard(
    token: ElectricityToken,
    language: AppLanguage,
    strings: StringsDict,
    onCopy: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
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
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.secondaryContainer),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Bolt, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondaryContainer, modifier = Modifier.size(20.dp))
                    }
                    Column {
                        Text(
                            text = "Unit ${token.roomNumber} • ${token.residentName}",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                        )
                        Text(
                            text = "${token.generatedAt} • ${LanguageManager.formatCurrency(token.amountRp, language)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                Surface(shape = RoundedCornerShape(6.dp), color = MaterialTheme.colorScheme.tertiaryContainer) {
                    Text(
                        text = "+${LanguageManager.formatKwh(token.kwhAmount)}",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onTertiaryContainer,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            // 20-digit token display box
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(Navy900)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = token.tokenCode,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    ),
                    color = Gold400
                )
                IconButton(
                    onClick = onCopy,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = strings.copyToken, tint = Color.White, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}
