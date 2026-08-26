package com.example.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.security.AuthResult
import com.example.data.security.EncryptedSessionManager
import com.example.domain.usecase.AuthenticateTenantUseCase
import com.example.ui.common.UiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiData(
    val isLoggedIn: Boolean,
    val currentRole: AppRole,
    val selectedTenantId: String
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authenticateTenantUseCase: AuthenticateTenantUseCase,
    private val sessionManager: EncryptedSessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<UiState<AuthUiData>>(
        UiState.Success(
            AuthUiData(
                isLoggedIn = sessionManager.isLoggedIn,
                currentRole = sessionManager.userRole,
                selectedTenantId = sessionManager.selectedTenantId
            )
        )
    )
    val uiState: StateFlow<UiState<AuthUiData>> = _uiState.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(sessionManager.isLoggedIn)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    private val _currentRole = MutableStateFlow(sessionManager.userRole)
    val currentRole: StateFlow<AppRole> = _currentRole.asStateFlow()

    private val _selectedTenantId = MutableStateFlow(sessionManager.selectedTenantId)
    val selectedTenantId: StateFlow<String> = _selectedTenantId.asStateFlow()

    fun login(
        identifier: String,
        role: AppRole,
        passwordInput: String
    ) {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            when (val result = authenticateTenantUseCase(identifier, role, passwordInput)) {
                is AuthResult.Success -> {
                    _isLoggedIn.value = true
                    _currentRole.value = result.role
                    _selectedTenantId.value = result.residentId
                    _uiState.value = UiState.Success(
                        AuthUiData(
                            isLoggedIn = true,
                            currentRole = result.role,
                            selectedTenantId = result.residentId
                        )
                    )
                }
                is AuthResult.InvalidCredentials -> {
                    _uiState.value = UiState.Error("Invalid credentials provided")
                }
                is AuthResult.NetworkError -> {
                    _uiState.value = UiState.Error("Network connection error")
                }
                is AuthResult.Error -> {
                    _uiState.value = UiState.Error(result.message)
                }
            }
        }
    }

    fun setRole(role: AppRole) {
        _currentRole.value = role
        sessionManager.userRole = role
    }

    fun logout() {
        sessionManager.clearSession()
        _isLoggedIn.value = false
        _uiState.value = UiState.Success(
            AuthUiData(
                isLoggedIn = false,
                currentRole = AppRole.TENANT,
                selectedTenantId = "res_204"
            )
        )
    }
}
