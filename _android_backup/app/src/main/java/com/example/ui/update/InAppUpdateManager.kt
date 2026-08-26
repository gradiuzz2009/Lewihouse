package com.example.ui.update

import android.app.Activity
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class InAppUpdateManager @Inject constructor() {

    fun checkForAppUpdate(
        activity: Activity,
        isImmediate: Boolean = false,
        onUpdateAvailable: ((AppUpdateInfo) -> Unit)? = null
    ) {
        val appUpdateManager: AppUpdateManager = AppUpdateManagerFactory.create(activity)
        val appUpdateInfoTask = appUpdateManager.appUpdateInfo

        appUpdateInfoTask.addOnSuccessListener { appUpdateInfo ->
            val updateType = if (isImmediate) AppUpdateType.IMMEDIATE else AppUpdateType.FLEXIBLE

            if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
                && appUpdateInfo.isUpdateTypeAllowed(updateType)
            ) {
                Timber.i("Google Play In-App Update available: ${appUpdateInfo.availableVersionCode()}")
                onUpdateAvailable?.invoke(appUpdateInfo)

                val options = AppUpdateOptions.newBuilder(updateType).build()
                appUpdateManager.startUpdateFlow(appUpdateInfo, activity, options)
            }
        }.addOnFailureListener { e ->
            Timber.w(e, "Google Play In-App Update check failed")
        }
    }

    fun resumeUpdateIfNeeded(activity: Activity) {
        val appUpdateManager = AppUpdateManagerFactory.create(activity)
        appUpdateManager.appUpdateInfo.addOnSuccessListener { appUpdateInfo ->
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                val options = AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build()
                appUpdateManager.startUpdateFlow(appUpdateInfo, activity, options)
            }
        }
    }
}
