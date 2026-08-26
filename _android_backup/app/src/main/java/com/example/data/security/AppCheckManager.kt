package com.example.data.security

import android.content.Context
import com.example.BuildConfig
import com.google.firebase.FirebaseApp
import com.google.firebase.appcheck.FirebaseAppCheck
import com.google.firebase.appcheck.playintegrity.PlayIntegrityAppCheckProviderFactory
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AppCheckManager @Inject constructor() {

    fun initialize(context: Context) {
        try {
            FirebaseApp.initializeApp(context)
            val firebaseAppCheck = FirebaseAppCheck.getInstance()

            val providerFactory = if (BuildConfig.DEBUG) {
                try {
                    val debugClass = Class.forName("com.google.firebase.appcheck.debug.DebugAppCheckProviderFactory")
                    val getInstanceMethod = debugClass.getMethod("getInstance")
                    getInstanceMethod.invoke(null) as com.google.firebase.appcheck.AppCheckProviderFactory
                } catch (_: Exception) {
                    PlayIntegrityAppCheckProviderFactory.getInstance()
                }
            } else {
                // In Release mode, enforce Google Play Integrity
                PlayIntegrityAppCheckProviderFactory.getInstance()
            }

            firebaseAppCheck.installAppCheckProviderFactory(providerFactory)
            Timber.i("Firebase App Check initialized successfully (Debug: ${BuildConfig.DEBUG})")
        } catch (e: Exception) {
            Timber.w(e, "Firebase App Check initialization skipped/failed")
        }
    }
}
