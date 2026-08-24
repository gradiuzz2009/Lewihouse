package com.example.ui.screens.tenant

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
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
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.language.AppLanguage
import com.example.data.language.LanguageManager
import com.example.data.language.StringsDict
import com.example.data.model.*
import com.example.ui.components.EmptyStateCard
import com.example.ui.screens.admin.TokenHistoryCard
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantElectricityScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val tenant by viewModel.currentTenant.collectAsState()
    val tokens by viewModel.currentTenantTokens.collectAsState()
    val meters by viewModel.meters.collectAsState()

    val tenantMeter = meters.find { it.roomNumber == tenant?.roomNumber }

    var showRequestTokenDialog by remember { mutableStateOf(false) }
    var selectedNominal by remember { mutableDoubleStateOf(100000.0) }

    val context = LocalContext.current
    val haptic = LocalHapticFeedback.current

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
                text = strings.electricity,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
        }

        // Meter Info Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(strings.meterId, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f))
                            Text(
                                text = tenantMeter?.meterNumber ?: "PLN-${tenant?.roomNumber ?: "204"}-94015",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    color = Color.White
                                )
                            )
                        }
                        Surface(shape = RoundedCornerShape(8.dp), color = MaterialTheme.colorScheme.secondaryContainer) {
                            Text(
                                text = "Tarif R1 / 1300VA",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    HorizontalDivider(color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.15f))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(strings.currentReading, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f))
                            Text(
                                text = "${tenantMeter?.currentReadingKwh ?: 420.5} kWh",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("Tarif PLN", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f))
                            Text(
                                text = "Rp 1.699,53 / kWh",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.secondary
                            )
                        }
                    }
                }
            }
        }

        // Top Up Action Card
        item {
            ElevatedCard(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(MaterialTheme.colorScheme.secondaryContainer),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Bolt, contentDescription = null, tint = MaterialTheme.colorScheme.onSecondaryContainer)
                        }
                        Column {
                            Text(strings.buyToken, fontWeight = FontWeight.Bold)
                            Text("Beli token listrik PLN 20 angka", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    Button(
                        onClick = { showRequestTokenDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.testTag("btn_request_token")
                    ) {
                        Text(strings.buyToken, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSecondary)
                    }
                }
            }
        }

        // Guide on How to Enter PLN Token
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Cara Memasukkan Token Listrik ke Meteran",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.primary
                    )
                    GuideStepItem(number = "1", text = "Cari kotak meteran PLN prabayar di luar atau samping pintu kamar.")
                    GuideStepItem(number = "2", text = "Ketik 20 angka kode token menggunakan tombol angka pada meteran.")
                    GuideStepItem(number = "3", text = "Tekan tombol ENTER (berwarna merah atau biru di pojok kanan bawah).")
                    GuideStepItem(number = "4", text = "Layar meteran akan menampilkan tulisan 'BENAR' dan kWh langsung bertambah.")
                }
            }
        }

        // Token History List
        item {
            Text(
                text = "Dompet & Riwayat Token Saya",
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }

        if (tokens.isEmpty()) {
            item {
                EmptyStateCard(
                    icon = Icons.Default.ElectricBolt,
                    title = "Belum Ada Token",
                    description = "Riwayat pembelian token listrik Anda akan muncul di sini."
                )
            }
        } else {
            items(tokens) { token ->
                TokenHistoryCard(
                    token = token,
                    language = language,
                    strings = strings,
                    onCopy = {
                        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("PLN Token", token.tokenCode)
                        clipboard.setPrimaryClip(clip)
                        viewModel.showSnackbar(strings.tokenCopied)
                    }
                )
            }
        }
    }

    // Request / Buy Token Dialog
    if (showRequestTokenDialog) {
        val kwh = (selectedNominal / 1699.53)
        AlertDialog(
            onDismissRequest = { showRequestTokenDialog = false },
            title = { Text(strings.buyToken, fontWeight = FontWeight.Bold) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("Pilih Nominal Token untuk Unit ${tenant?.roomNumber ?: "204"}:")
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(listOf(50000.0, 100000.0, 200000.0, 500000.0)) { nominal ->
                            FilterChip(
                                selected = selectedNominal == nominal,
                                onClick = { selectedNominal = nominal },
                                label = { Text(LanguageManager.formatCurrency(nominal, language)) }
                            )
                        }
                    }

                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("${strings.kwhReceived}: ${LanguageManager.formatKwh(kwh)}", fontWeight = FontWeight.Bold, color = Emerald600)
                            Text("Tarif: Rp 1.699,53 / kWh", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val roomNo = tenant?.roomNumber ?: "204"
                        val name = tenant?.fullName ?: "Fauzie Ali Akhmad"
                        viewModel.issueElectricityToken(roomNo, selectedNominal, name)
                        showRequestTokenDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                    modifier = Modifier.testTag("btn_confirm_buy_token")
                ) {
                    Text("Beli & Terbitkan")
                }
            },
            dismissButton = {
                TextButton(onClick = { showRequestTokenDialog = false }) {
                    Text(strings.cancel)
                }
            }
        )
    }
}

@Composable
fun GuideStepItem(number: String, text: String) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(20.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary),
            contentAlignment = Alignment.Center
        ) {
            Text(text = number, color = MaterialTheme.colorScheme.onPrimary, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold))
        }
        Text(text = text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
