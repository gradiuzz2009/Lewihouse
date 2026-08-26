package com.example.domain.usecase

import com.example.data.repository.RoomRepository
import com.example.data.security.AuthResult
import com.example.data.security.EncryptedSessionManager
import com.example.data.security.FirebaseAuthManager
import com.example.ui.viewmodels.AppRole
import javax.inject.Inject

class AuthenticateTenantUseCase @Inject constructor(
    private val authManager: FirebaseAuthManager,
    private val sessionManager: EncryptedSessionManager,
    private val roomRepository: RoomRepository
) {

    suspend operator fun invoke(
        identifier: String,
        role: AppRole,
        passwordInput: String
    ): AuthResult {
        val result = authManager.loginWithCredentials(identifier, role, passwordInput)
        if (result is AuthResult.Success) {
            val resident = if (role == AppRole.TENANT) {
                roomRepository.authenticateTenant(identifier)
            } else null

            val targetTenantId = resident?.id ?: result.residentId
            sessionManager.saveSession(
                role = result.role,
                tenantId = targetTenantId,
                token = result.token
            )
        }
        return result
    }
}
