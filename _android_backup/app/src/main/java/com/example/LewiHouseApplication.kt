package com.example

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import com.example.data.security.AppCheckManager
import com.example.data.security.EncryptedSessionManager
import com.example.util.CrashReportingTree
import com.google.firebase.crashlytics.FirebaseCrashlytics
import dagger.hilt.android.HiltAndroidApp
import timber.log.Timber
import javax.inject.Inject

@HiltAndroidApp
class LewiHouseApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    @Inject
    lateinit var appCheckManager: AppCheckManager

    @Inject
    lateinit var sessionManager: EncryptedSessionManager

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        super.onCreate()

        // 1. Initialize Timber Logging
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        } else {
            Timber.plant(CrashReportingTree())
        }

        // 2. Initialize Firebase App Check with Play Integrity
        appCheckManager.initialize(this)

        // 3. Configure Crashlytics Observability Context (non-PII)
        configureCrashlytics()
    }

    private fun configureCrashlytics() {
        runCatching {
            val crashlytics = FirebaseCrashlytics.getInstance()
            crashlytics.setCustomKey("app_version", BuildConfig.VERSION_NAME)
            crashlytics.setCustomKey("build_type", BuildConfig.BUILD_TYPE)
            crashlytics.setCustomKey("user_role", sessionManager.userRole.name)
            if (sessionManager.isLoggedIn) {
                crashlytics.setUserId("resident_${sessionManager.selectedTenantId.hashCode()}")
            }
        }
    }
}
