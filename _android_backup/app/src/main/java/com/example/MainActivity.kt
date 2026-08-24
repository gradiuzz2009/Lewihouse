package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.navigation.AppNavigation
import com.example.ui.theme.MyApplicationTheme
import com.example.ui.viewmodels.AppViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val appViewModel: AppViewModel = viewModel()

                    // Handle Push Notification Intent Routing
                    LaunchedEffect(intent) {
                        if (intent?.getStringExtra("NAVIGATE_TO") == "CHAT") {
                            val targetTenantId = intent.getStringExtra("TARGET_TENANT_ID")
                            if (appViewModel.currentRole.value == com.example.ui.viewmodels.AppRole.ADMIN) {
                                appViewModel.setAdminTab(com.example.ui.viewmodels.AdminTab.CHAT)
                                targetTenantId?.let { appViewModel.selectChatTenant(it) }
                            } else {
                                appViewModel.setTenantTab(com.example.ui.viewmodels.TenantTab.CHAT)
                            }
                        }
                    }

                    AppNavigation(viewModel = appViewModel)
                }
            }
        }
    }
}
