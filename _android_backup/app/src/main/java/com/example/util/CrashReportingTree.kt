package com.example.util

import android.util.Log
import com.google.firebase.crashlytics.FirebaseCrashlytics
import timber.log.Timber

class CrashReportingTree : Timber.Tree() {

    override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
        if (priority == Log.VERBOSE || priority == Log.DEBUG || priority == Log.INFO) {
            return
        }

        val crashlytics = runCatching { FirebaseCrashlytics.getInstance() }.getOrNull() ?: return
        crashlytics.log("[${tag ?: "APP"}] $message")

        if (t != null) {
            crashlytics.recordException(t)
        } else if (priority == Log.ERROR) {
            crashlytics.recordException(Exception("ERROR: $message"))
        }
    }
}
