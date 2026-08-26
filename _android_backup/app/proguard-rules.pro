# ==========================================
# ProGuard & R8 Optimization Rules
# ==========================================

# Preserve Line Numbers for Crash Reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- Kotlin Coroutines & Flow ---
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembernames class kotlinx.** {
    volatile <fields>;
}

# --- Room Database ---
-keep class androidx.room.RoomDatabase
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao class * { *; }
-dontwarn androidx.room.paging.**

# --- Data Models & Domain Models ---
-keep class com.example.data.model.** { *; }
-keep class com.example.data.local.** { *; }

# --- Moshi JSON Serialization ---
-keepclasseswithmembers class * {
    @com.squareup.moshi.* <methods>;
}
-keep @com.squareup.moshi.JsonQualifier interface *
-keepclassmembers class * {
    @com.squareup.moshi.FromJson *;
    @com.squareup.moshi.ToJson *;
}

# --- Firebase Services & Firestore ---
-keepattributes *Annotation*
-keepclassmembers class * {
    @com.google.firebase.firestore.PropertyName <fields>;
    @com.google.firebase.firestore.PropertyName <methods>;
    @com.google.firebase.firestore.Exclude <fields>;
    @com.google.firebase.firestore.Exclude <methods>;
}
-dontwarn com.google.firebase.**

# --- AndroidX Security Crypto & Keystore ---
-keep class androidx.security.crypto.** { *; }

# --- Dagger / Hilt ---
-keep class * extends dagger.hilt.internal.UnsafeCasts { *; }
-keep class dagger.hilt.** { *; }
-dontwarn dagger.hilt.**

# --- Timber Logging ---
-dontwarn timber.log.**
