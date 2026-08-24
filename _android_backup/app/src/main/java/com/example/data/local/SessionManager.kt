package com.example.data.local

import android.content.Context
import android.content.SharedPreferences
import com.example.ui.viewmodels.AppRole

class SessionManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences("lewi_house_session", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_SELECTED_TENANT_ID = "selected_tenant_id"
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

    fun saveSession(role: AppRole, tenantId: String? = null) {
        prefs.edit()
            .putBoolean(KEY_IS_LOGGED_IN, true)
            .putString(KEY_USER_ROLE, role.name)
            .apply()
        if (tenantId != null) {
            selectedTenantId = tenantId
        }
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
