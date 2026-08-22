package com.example.ui.screens.tenant

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.language.AppLanguage
import com.example.data.language.LanguageManager
import com.example.data.language.StringsDict
import com.example.data.model.*
import com.example.ui.components.PaymentStatusBadge
import com.example.ui.screens.admin.ReceiptDetailLine
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TenantPaymentsScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val payments by viewModel.currentTenantPayments.collectAsState()
    val tenant by viewModel.currentTenant.collectAsState()

    var payingPayment by remember { mutableStateOf<Payment?>(null) }
    var viewingReceipt by remember { mutableStateOf<Payment?>(null) }

    val pendingList = payments.filter { it.status == PaymentStatus.PENDING || it.status == PaymentStatus.OVERDUE }
    val paidList = payments.filter { it.status == PaymentStatus.PAID }

    val context = LocalContext.current

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 120.dp)
    ) {
        // Title & Summary
        item {
            Text(
                text = strings.myBills,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
        }

        // Outstanding Bills Section
        if (pendingList.isNotEmpty()) {
            item {
                Text(
                    text = strings.pendingCollections,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, color = Gold600)
                )
            }

            items(pendingList) { payment ->
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
                            Column {
                                Text(
                                    text = payment.type.name,
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "Due date: ${payment.dueDate}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            PaymentStatusBadge(status = payment.status, strings = strings)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = LanguageManager.formatCurrency(payment.amount, language),
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Navy800
                                )
                            )

                            Button(
                                onClick = { payingPayment = payment },
                                colors = ButtonDefaults.buttonColors(containerColor = Navy800),
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.testTag("btn_pay_bill_${payment.id}")
                            ) {
                                Icon(Icons.Default.QrCode, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(strings.payNow)
                            }
                        }
                    }
                }
            }
        }

        // Payment History Section
        item {
            Text(
                text = strings.paymentsLedger,
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
            )
        }

        if (paidList.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.ReceiptLong, contentDescription = null, tint = Slate400, modifier = Modifier.size(40.dp))
                        Text("No payment history yet", style = MaterialTheme.typography.bodyMedium, color = Slate600)
                    }
                }
            }
        } else {
            items(paidList) { payment ->
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
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Emerald100),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Check, contentDescription = null, tint = Emerald700, modifier = Modifier.size(20.dp))
                            }
                            Column {
                                Text(
                                    text = payment.type.name,
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold)
                                )
                                Text(
                                    text = "${payment.date} • ${payment.paymentMethod.label}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                text = LanguageManager.formatCurrency(payment.amount, language),
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold, color = Emerald700)
                            )
                            TextButton(
                                onClick = { viewingReceipt = payment },
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text("Receipt", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = Navy800)
                            }
                        }
                    }
                }
            }
        }
    }

    // Interactive Digital Payment Modal (QRIS & Virtual Account)
    if (payingPayment != null) {
        val targetPay = payingPayment!!
        var selectedMethod by remember { mutableStateOf(PaymentMethod.QRIS) }

        AlertDialog(
            onDismissRequest = { payingPayment = null },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, tint = Navy800)
                    Text("Digital Checkout", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                LazyColumn(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Navy800,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(
                                modifier = Modifier.padding(14.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text("Total Amount Due", style = MaterialTheme.typography.labelSmall, color = Navy100)
                                Text(
                                    text = LanguageManager.formatCurrency(targetPay.amount, language),
                                    style = MaterialTheme.typography.headlineMedium.copy(
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White
                                    )
                                )
                                Text(
                                    text = "Unit ${targetPay.roomNumber} • ${targetPay.type.name}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Gold400
                                )
                            }
                        }
                    }

                    item {
                        Text("Select Payment Method", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            items(listOf(PaymentMethod.QRIS, PaymentMethod.BCA_VA, PaymentMethod.MANDIRI_VA, PaymentMethod.BANK_TRANSFER)) { method ->
                                FilterChip(
                                    selected = selectedMethod == method,
                                    onClick = { selectedMethod = method },
                                    label = { Text(method.label) }
                                )
                            }
                        }
                    }

                    if (selectedMethod == PaymentMethod.QRIS) {
                        item {
                            // QRIS Mock Box
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.White)
                                    .border(1.dp, Slate200, RoundedCornerShape(12.dp))
                                    .padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "QRIS NATIONAL STANDARD",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold, letterSpacing = 1.sp),
                                    color = Rose700
                                )
                                Box(
                                    modifier = Modifier
                                        .size(150.dp)
                                        .background(Slate100, RoundedCornerShape(8.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.QrCode2, contentDescription = null, modifier = Modifier.size(120.dp), tint = Navy900)
                                }
                                Text(
                                    text = "NMID: ID1029384950284",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Slate600
                                )
                                Text(
                                    text = "Scan with BCA Mobile, GoPay, OVO, ShopeePay, or Dana",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Slate600
                                )
                            }
                        }
                    } else {
                        item {
                            // Virtual Account Box
                            val vaNumber = when (selectedMethod) {
                                PaymentMethod.BCA_VA -> "3901 0812 9482 1029"
                                PaymentMethod.MANDIRI_VA -> "8902 0812 9482 1029"
                                else -> "BCA 8400-2918-29"
                            }
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Slate100)
                                    .padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Text(text = "${selectedMethod.label} Number:", style = MaterialTheme.typography.labelSmall, color = Slate600)
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = vaNumber,
                                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace),
                                        color = Navy800
                                    )
                                    IconButton(
                                        onClick = {
                                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                            clipboard.setPrimaryClip(ClipData.newPlainText("VA Number", vaNumber))
                                            viewModel.showSnackbar("VA Number copied!")
                                        }
                                    ) {
                                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy", tint = Navy800, modifier = Modifier.size(18.dp))
                                    }
                                }
                                Text(
                                    text = "Account Name: LEWI HOUSE - ${tenant?.fullName}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Slate700
                                )
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.confirmTenantPayment(targetPay.id, selectedMethod)
                        payingPayment = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                    modifier = Modifier.testTag("btn_confirm_payment_complete")
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("I Have Paid (Confirm)")
                }
            },
            dismissButton = {
                TextButton(onClick = { payingPayment = null }) {
                    Text(strings.cancel)
                }
            }
        )
    }

    // Receipt Dialog
    if (viewingReceipt != null) {
        val pay = viewingReceipt!!
        AlertDialog(
            onDismissRequest = { viewingReceipt = null },
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.Receipt, contentDescription = null, tint = Navy800)
                    Text("Official Payment Receipt", fontWeight = FontWeight.Bold)
                }
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Slate100)
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "LEWI HOUSE RESIDENCES",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp),
                        color = Navy800
                    )
                    Divider(color = Slate200)
                    ReceiptDetailLine("Receipt No.", pay.receiptRef.ifBlank { "LW-SYS-PAID" })
                    ReceiptDetailLine("Date", pay.date)
                    ReceiptDetailLine("Resident", pay.residentName)
                    ReceiptDetailLine("Unit Number", "Room ${pay.roomNumber}")
                    ReceiptDetailLine("Category", pay.type.name)
                    ReceiptDetailLine("Payment Channel", pay.paymentMethod.label)
                    ReceiptDetailLine("Status", "PAID & VERIFIED")
                    Divider(color = Slate200)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Total Amount", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text(
                            text = LanguageManager.formatCurrency(pay.amount, language),
                            fontWeight = FontWeight.ExtraBold,
                            color = Emerald700,
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { viewingReceipt = null },
                    colors = ButtonDefaults.buttonColors(containerColor = Navy800)
                ) {
                    Text(strings.close)
                }
            }
        )
    }
}
