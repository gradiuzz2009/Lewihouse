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
import com.example.data.language.LanguageManager
import com.example.data.language.StringsDict
import com.example.data.model.Resident
import com.example.ui.screens.admin.DetailRow
import com.example.ui.theme.*
import com.example.ui.viewmodels.AppViewModel

@Composable
fun TenantProfileScreen(
    viewModel: AppViewModel,
    strings: StringsDict,
    language: AppLanguage,
    modifier: Modifier = Modifier
) {
    val tenant by viewModel.currentTenant.collectAsState()
    val residents by viewModel.residents.collectAsState()
    val room by viewModel.currentTenantRoom.collectAsState()

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
                text = strings.profile,
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
            )
        }

        // Demo Tenant Switcher Card (Convenient testing feature)
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Slate100),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Simulate as Resident (Demo Switcher)",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = Navy800
                    )
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(residents) { res ->
                            FilterChip(
                                selected = res.id == tenant?.id,
                                onClick = { viewModel.selectTenant(res.id) },
                                label = { Text("${res.fullName} (${res.roomNumber})") },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Navy800,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                }
            }
        }

        // Resident Digital ID Card
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Navy800),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(52.dp)
                                    .clip(CircleShape)
                                    .background(Gold500),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = tenant?.fullName?.take(2)?.uppercase() ?: "LH",
                                    style = MaterialTheme.typography.titleLarge.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                )
                            }
                            Column {
                                Text(
                                    text = tenant?.fullName ?: "Resident",
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Color.White
                                    )
                                )
                                Text(
                                    text = "Unit ${tenant?.roomNumber ?: "204"} • ${room?.type?.name ?: "Deluxe"}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Gold400
                                )
                            }
                        }

                        Surface(shape = RoundedCornerShape(8.dp), color = Emerald500) {
                            Text(
                                text = "ACTIVE",
                                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }

                    Divider(color = Navy700)

                    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        ProfileInfoRow(label = "KTP / Passport", value = tenant?.ktpNumber ?: "3271040000000001")
                        ProfileInfoRow(label = "Phone", value = tenant?.phone ?: "+62 812-3456-7890")
                        ProfileInfoRow(label = "Email", value = tenant?.email ?: "tenant@example.com")
                        ProfileInfoRow(label = "Lease End", value = tenant?.leaseEndDate ?: "2027-04-30")
                        ProfileInfoRow(label = "Monthly Rent", value = LanguageManager.formatCurrency(tenant?.monthlyRent ?: 3800000.0, language))
                        ProfileInfoRow(label = "Deposit Held", value = LanguageManager.formatCurrency(tenant?.depositAmount ?: 3800000.0, language))
                        ProfileInfoRow(label = "Emergency Contact", value = "${tenant?.emergencyContact} (${tenant?.emergencyPhone})")
                    }
                }
            }
        }

        // House Rules Handbook Card
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
                        text = if (language == AppLanguage.ID) "Tata Tertib & Peraturan Hunian" else "House Rules & Guidelines",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )

                    RuleItem(icon = Icons.Default.VolumeOff, title = "Quiet Hours (22:00 - 06:00)", desc = "Please respect neighbor rest and keep media volume low.")
                    RuleItem(icon = Icons.Default.People, title = "Guest Policy", desc = "Guests must register with front desk. Overnight guests require 24h notice.")
                    RuleItem(icon = Icons.Default.DeleteSweep, title = "Waste Disposal", desc = "Dispose trash bags in the designated ground floor bins by 08:00 AM.")
                    RuleItem(icon = Icons.Default.SmokeFree, title = "No Smoking Inside Rooms", desc = "Smoking is strictly confined to outdoor balconies and rooftop terrace.")
                }
            }
        }

        // Property Concierge Hotline Card
        item {
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
                    Text(
                        text = "Lewi House Concierge & Care Desk",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold)
                    )
                    Text(
                        text = "Need emergency assistance or lease questions? Our on-site manager is available 24/7.",
                        style = MaterialTheme.typography.bodySmall,
                        color = Slate700
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = {
                                viewModel.showSnackbar("Calling Lewi House Desk: +62 811-9988-7711")
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Navy800),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Call Manager")
                        }

                        Button(
                            onClick = {
                                viewModel.showSnackbar("Opening WhatsApp chat with Lewi House Concierge")
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Emerald600),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(Icons.Default.Chat, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("WhatsApp")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ProfileInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodySmall, color = Navy100)
        Text(text = value, style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.SemiBold), color = Color.White)
    }
}

@Composable
fun RuleItem(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, desc: String) {
    Row(
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(Navy100),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = Navy800, modifier = Modifier.size(18.dp))
        }
        Column {
            Text(text = title, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold))
            Text(text = desc, style = MaterialTheme.typography.bodySmall, color = Slate600)
        }
    }
}
