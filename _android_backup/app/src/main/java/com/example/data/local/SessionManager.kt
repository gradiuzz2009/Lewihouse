package com.example.data.local

import android.content.Context
import com.example.data.security.EncryptedSessionManager
import com.example.ui.viewmodels.AppRole

@Deprecated("Use EncryptedSessionManager with AES256 encryption instead", ReplaceWith("EncryptedSessionManager"))
class SessionManager(context: Context) {

    private val encryptedManager = EncryptedSessionManager(context)

    var isLoggedIn: Boolean
        get() = encryptedManager.isLoggedIn
        set(value) { encryptedManager.isLoggedIn = value }

    var userRole: AppRole
        get() = encryptedManager.userRole
        set(value) { encryptedManager.userRole = value }

    var selectedTenantId: String
        get() = encryptedManager.selectedTenantId
        set(value) { encryptedManager.selectedTenantId = value }

    fun saveSession(role: AppRole, tenantId: String? = null) {
        encryptedManager.saveSession(role, tenantId)
    }

    fun clearSession() {
        encryptedManager.clearSession()
    }
}
