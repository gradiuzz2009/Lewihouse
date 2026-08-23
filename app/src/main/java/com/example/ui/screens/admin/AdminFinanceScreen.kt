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
import com.example.ui.components.PaymentStatusBadge
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminFinanceScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val payments by viewModel.payments.collectAsState()
    val residents by viewModel.residents.collectAsState()
    var selectedStatus by remember { mutableStateOf<PaymentStatus?>(null) }
    var showRecordPaymentDialog by remember { mutableStateOf(false) }
    var viewingPaymentReceipt by remember { mutableStateOf<Payment?>(null) }

    val totalPaid = payments.filter { it.status == PaymentStatus.PAID }.sumOf { it.amount }
    val totalPending = payments.filter { it.status == PaymentStatus.PENDING }.sumOf { it.amount }
    val totalOverdue = payments.filter { it.status == PaymentStatus.OVERDUE }.sumOf { it.amount }

    val rentIncome = payments.filter { it.type == PaymentType.RENT && it.status == PaymentStatus.PAID }.sumOf { it.amount }
    val utilityIncome = payments.filter { it.type == PaymentType.ELECTRICITY && it.status == PaymentStatus.PAID }.sumOf { it.amount }

    val filteredPayments = payments.filter {
        selectedStatus == null || it.status == selectedStatus
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showRecordPaymentDialog = true },
                containerColor = MaterialTheme.colorScheme.secondary,
                contentColor = MaterialTheme.colorScheme.onSecondary,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .padding(bottom = 72.dp)
                    .testTag("fab_record_payment")
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.AddCard, contentDescription = strings.recordPayment)
                    Text(text = strings.recordPayment, fontWeight = FontWeight.Bold)
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
            // Header
            item {
                Text(
                    text = strings.financialSummary,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
            }

            // Financial Summary Card
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = strings.totalRevenueThisMonth,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                                )
                                Text(
                                    text = LanguageManager.formatCurrency(totalPaid, language),
                                    style = MaterialTheme.typography.headlineLarge.copy(
                                        fontWeight = FontWeight.ExtraBold,
                                        color = MaterialTheme.colorScheme.onPrimary
                                    )
                                )
                            }
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = Emerald500
                            ) {
                                Text(
                                    text = strings.collected,
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White,
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.15f))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    text = strings.pending,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Gold400
                                )
                                Text(
                                    text = LanguageManager.formatCurrency(totalPending, language),
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onPrimary
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = strings.overdue,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Rose100
                                )
                                Text(
                                    text = LanguageManager.formatCurrency(totalOverdue, language),
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = Rose100
                                )
                            }
                        }
                    }
                }
            }

            // Revenue Streams Breakdown
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
                            text = strings.revenueBreakdown,
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                        )

                        StreamRow(
                            title = strings.rentalIncome,
                            amount = LanguageManager.formatCurrency(rentIncome, language),
                            percent = if (totalPaid > 0) (rentIncome / totalPaid * 100).toInt() else 0,
                            barColor = MaterialTheme.colorScheme.primary
                        )

                        StreamRow(
                            title = strings.utilityIncome,
                            amount = LanguageManager.formatCurrency(utilityIncome, language),
                            percent = if (totalPaid > 0) (utilityIncome / totalPaid * 100).toInt() else 0,
                            barColor = MaterialTheme.colorScheme.secondary
                        )
                    }
                }
            }

            // Ledger Section Title & Status Filters
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = strings.paymentsLedger,
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        item {
                            FilterChip(
                                selected = selectedStatus == null,
                                onClick = { selectedStatus = null },
                                label = { Text(strings.all) }
                            )
                        }
                        items(PaymentStatus.values()) { status ->
                            FilterChip(
                                selected = selectedStatus == status,
                                onClick = { selectedStatus = status },
                                label = {
                                    Text(
                                        when (status) {
                                            PaymentStatus.PAID -> strings.paid
                                            PaymentStatus.PENDING -> strings.pending
                                            PaymentStatus.OVERDUE -> strings.overdue
                                        }
                                    )
                                }
                            )
                        }
                    }
                }
            }

            // Payment rows & Empty state
            if (filteredPayments.isEmpty()) {
                item {
                    EmptyStateCard(
                        icon = Icons.Default.Receipt,
                        title = strings.emptyPaymentsTitle,
                        description = strings.emptyPaymentsDesc,
                        actionButtonText = strings.resetFilter,
                        onActionClick = { selectedStatus = null }
                    )
                }
            } else {
                items(filteredPayments) { payment ->
                    PaymentLedgerCard(
                        payment = payment,
                        language = language,
                        strings = strings,
                        onViewReceipt = { viewingPaymentReceipt = payment }
                    )
                }
            }
        }
    }

    // Receipt Detail Modal
    if (viewingPaymentReceipt != null) {
        val pay = viewingPaymentReceipt!!
        AlertDialog(
            onDismissRequest = { viewingPaymentReceipt = null },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.Receipt, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Text(strings.viewReceipt, fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = strings.appTitle.uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp),
                        color = MaterialTheme.colorScheme.primary
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    ReceiptDetailLine("No. Kuitansi", pay.receiptRef.ifBlank { "LW-SYS-PENDING" })
                    ReceiptDetailLine("Tanggal", pay.date)
                    ReceiptDetailLine(strings.occupant, pay.residentName)
                    ReceiptDetailLine(strings.roomNumber, "Unit ${pay.roomNumber}")
                    ReceiptDetailLine(strings.paymentType, pay.type.name)
                    ReceiptDetailLine("Metode", pay.paymentMethod.label)
                    HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = LanguageManager.formatCurrency(pay.amount, language),
                            fontWeight = FontWeight.ExtraBold,
                            color = MaterialTheme.colorScheme.primary,
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                    if (pay.notes.isNotBlank()) {
                        Text("Catatan: ${pay.notes}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { viewingPaymentReceipt = null },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text(strings.close)
                }
            }
        )
    }

    // Record Manual Payment Dialog
    if (showRecordPaymentDialog) {
        RecordPaymentDialog(
            residents = residents,
            strings = strings,
            language = language,
            onDismiss = { showRecordPaymentDialog = false },
            onSave = { residentId, residentName, roomNumber, amount, type, status, method, notes ->
                viewModel.recordPayment(residentId, residentName, roomNumber, amount, type, status, method, notes)
                showRecordPaymentDialog = false
            }
        )
    }
}

@Composable
fun StreamRow(title: String, amount: String, percent: Int, barColor: Color) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = title, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(text = "$amount ($percent%)", style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold))
        }
        LinearProgressIndicator(
            progress = { (percent / 100f).coerceIn(0f, 1f) },
            color = barColor,
            trackColor = MaterialTheme.colorScheme.surfaceVariant,
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp))
        )
    }
}

@Composable
fun PaymentLedgerCard(
    payment: Payment,
    language: AppLanguage,
    strings: StringsDict,
    onViewReceipt: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(14.dp),
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
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(42.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(
                            when (payment.type) {
                                PaymentType.RENT -> MaterialTheme.colorScheme.primaryContainer
                                PaymentType.ELECTRICITY -> MaterialTheme.colorScheme.secondaryContainer
                                PaymentType.DEPOSIT -> MaterialTheme.colorScheme.tertiaryContainer
                                else -> MaterialTheme.colorScheme.surfaceVariant
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = when (payment.type) {
                            PaymentType.RENT -> Icons.Default.Home
                            PaymentType.ELECTRICITY -> Icons.Default.Bolt
                            PaymentType.DEPOSIT -> Icons.Default.Savings
                            else -> Icons.Default.Payment
                        },
                        contentDescription = null,
                        tint = when (payment.type) {
                            PaymentType.RENT -> MaterialTheme.colorScheme.onPrimaryContainer
                            PaymentType.ELECTRICITY -> MaterialTheme.colorScheme.onSecondaryContainer
                            PaymentType.DEPOSIT -> MaterialTheme.colorScheme.onTertiaryContainer
                            else -> MaterialTheme.colorScheme.onSurfaceVariant
                        },
                        modifier = Modifier.size(22.dp)
                    )
                }

                Column {
                    Text(
                        text = payment.residentName.ifBlank { "Unit ${payment.roomNumber}" },
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Unit ${payment.roomNumber} • ${payment.date}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "${payment.type.name} • ${payment.paymentMethod.label}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = LanguageManager.formatCurrency(payment.amount, language),
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    PaymentStatusBadge(status = payment.status, strings = strings)
                    IconButton(
                        onClick = onViewReceipt,
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Receipt,
                            contentDescription = strings.viewReceipt,
                            modifier = Modifier.size(16.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ReceiptDetailLine(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Medium))
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecordPaymentDialog(
    residents: List<Resident>,
    strings: StringsDict,
    language: AppLanguage,
    onDismiss: () -> Unit,
    onSave: (
        residentId: String,
        residentName: String,
        roomNumber: String,
        amount: Double,
        type: PaymentType,
        status: PaymentStatus,
        method: PaymentMethod,
        notes: String
    ) -> Unit
) {
    var selectedResident by remember { mutableStateOf(residents.firstOrNull()) }
    var amountText by remember { mutableStateOf(selectedResident?.monthlyRent?.toLong()?.toString() ?: "3800000") }
    var selectedType by remember { mutableStateOf(PaymentType.RENT) }
    var selectedStatus by remember { mutableStateOf(PaymentStatus.PAID) }
    var selectedMethod by remember { mutableStateOf(PaymentMethod.BANK_TRANSFER) }
    var notes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(text = strings.recordPayment, fontWeight = FontWeight.Bold)
        },
        text = {
            LazyColumn(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Text(text = strings.residents, style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(residents) { res ->
                            FilterChip(
                                selected = selectedResident?.id == res.id,
                                onClick = {
                                    selectedResident = res
                                    amountText = res.monthlyRent.toLong().toString()
                                },
                                label = { Text("${res.fullName} (${res.roomNumber})") }
                            )
                        }
                    }
                }

                item {
                    OutlinedTextField(
                        value = amountText,
                        onValueChange = { amountText = it },
                        label = { Text("Nominal Pembayaran (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }

                item {
                    Text(text = strings.paymentType, style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(PaymentType.values()) { t ->
                            FilterChip(
                                selected = selectedType == t,
                                onClick = { selectedType = t },
                                label = { Text(t.name) }
                            )
                        }
                    }
                }

                item {
                    Text(text = strings.status, style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(PaymentStatus.values()) { s ->
                            FilterChip(
                                selected = selectedStatus == s,
                                onClick = { selectedStatus = s },
                                label = {
                                    Text(
                                        when (s) {
                                            PaymentStatus.PAID -> strings.paid
                                            PaymentStatus.PENDING -> strings.pending
                                            PaymentStatus.OVERDUE -> strings.overdue
                                        }
                                    )
                                }
                            )
                        }
                    }
                }

                item {
                    Text(text = "Metode Pembayaran", style = MaterialTheme.typography.labelMedium)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(PaymentMethod.values()) { m ->
                            FilterChip(
                                selected = selectedMethod == m,
                                onClick = { selectedMethod = m },
                                label = { Text(m.label) }
                            )
                        }
                    }
                }

                item {
                    OutlinedTextField(
                        value = notes,
                        onValueChange = { notes = it },
                        label = { Text(strings.details) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amount = amountText.toDoubleOrNull() ?: 0.0
                    val res = selectedResident
                    if (amount > 0 && res != null) {
                        onSave(res.id, res.fullName, res.roomNumber, amount, selectedType, selectedStatus, selectedMethod, notes)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                modifier = Modifier.testTag("btn_save_payment")
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
