package com.example.data.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.example.ui.viewmodels.AppRole
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EncryptedSessionManager @Inject constructor(
    @ApplicationContext context: Context
) {

    private val masterKey: MasterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = runCatching {
        EncryptedSharedPreferences.create(
            context,
            PREFS_FILENAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }.getOrElse {
        // Fallback or recreate if corrupted
        context.deleteSharedPreferences(PREFS_FILENAME)
        EncryptedSharedPreferences.create(
            context,
            PREFS_FILENAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    companion object {
        private const val PREFS_FILENAME = "lewi_house_secure_session"
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"
        private const val KEY_USER_ROLE = "key_user_role"
        private const val KEY_SELECTED_TENANT_ID = "key_selected_tenant_id"
        private const val KEY_AUTH_TOKEN = "key_auth_token"
        private const val KEY_BIOMETRIC_ENABLED = "key_biometric_enabled"
    }

    var isLoggedIn: Boolean
        get() = prefs.getBoolean(KEY_IS_LOGGED_IN, false)
        set(value) = prefs.edit().putBoolean(KEY_IS_LOGGED_IN, value).apply()

    var userRole: AppRole
        get() {
            val roleStr = prefs.getString(KEY_USER_ROLE, AppRole.TENANT.name)
            return runCatching { AppRole.valueOf(roleStr!!) }.getOrDefault(AppRole.TENANT)
        }
        set(value) = prefs.edit().putString(KEY_USER_ROLE, value.name).apply()

    var selectedTenantId: String
        get() = prefs.getString(KEY_SELECTED_TENANT_ID, "res_204") ?: "res_204"
        set(value) = prefs.edit().putString(KEY_SELECTED_TENANT_ID, value).apply()

    var authToken: String?
        get() = prefs.getString(KEY_AUTH_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_AUTH_TOKEN, value).apply()

    var isBiometricEnabled: Boolean
        get() = prefs.getBoolean(KEY_BIOMETRIC_ENABLED, false)
        set(value) = prefs.edit().putBoolean(KEY_BIOMETRIC_ENABLED, value).apply()

    fun saveSession(role: AppRole, tenantId: String? = null, token: String? = null) {
        prefs.edit().apply {
            putBoolean(KEY_IS_LOGGED_IN, true)
            putString(KEY_USER_ROLE, role.name)
            tenantId?.let { putString(KEY_SELECTED_TENANT_ID, it) }
            token?.let { putString(KEY_AUTH_TOKEN, it) }
            apply()
        }
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
