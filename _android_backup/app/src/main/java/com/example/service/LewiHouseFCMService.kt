package com.example.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.MainActivity
import com.example.ui.viewmodels.AppRole
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import timber.log.Timber

class LewiHouseFCMService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Timber.d("FCM Token refreshed: $token")
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        val actionType = remoteMessage.data["actionType"] ?: remoteMessage.data["type"] ?: "ANNOUNCEMENT"
        val isChat = actionType == "chat" || actionType == "OPEN_CHAT"
        val title = remoteMessage.notification?.title
            ?: remoteMessage.data["title"]
            ?: if (isChat) "Pesan Chat Baru" else "Lewi House Notice"
        val body = remoteMessage.notification?.body
            ?: remoteMessage.data["message"]
            ?: "You have a new update in Lewi House."
        val targetPayload = remoteMessage.data["actionPayload"] ?: remoteMessage.data["tenantId"]

        showNotification(title, body, actionType, targetPayload)
    }

    private fun showNotification(
        title: String,
        message: String,
        actionType: String,
        actionPayload: String? = null
    ) {
        val isChat = actionType == "chat" || actionType == "OPEN_CHAT"
        val channelId = if (isChat) "lewi_house_chat_channel" else "lewi_house_channel"
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channelName = if (isChat) "Lewi House Chat" else "Lewi House Updates"
            val channelDesc = if (isChat) "Real-time messages from tenant & management" else "Push announcements and billing updates"
            val channel = NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = channelDesc
                enableVibration(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("ACTION_TYPE", actionType)
            actionPayload?.let { putExtra("ACTION_PAYLOAD", it) }
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(if (isChat) NotificationCompat.CATEGORY_MESSAGE else NotificationCompat.CATEGORY_EVENT)
            .build()

        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    companion object {
        fun subscribeToTopics(role: AppRole, tenantId: String?) {
            val messaging = FirebaseMessaging.getInstance()
            messaging.subscribeToTopic("all_announcements")

            if (role == AppRole.ADMIN) {
                messaging.subscribeToTopic("admin_alerts")
                messaging.subscribeToTopic("admin_tickets")
            } else if (tenantId != null) {
                messaging.subscribeToTopic("tenant_$tenantId")
            }
        }

        fun unsubscribeTopics() {
            val messaging = FirebaseMessaging.getInstance()
            messaging.unsubscribeFromTopic("all_announcements")
            messaging.unsubscribeFromTopic("admin_alerts")
            messaging.unsubscribeFromTopic("admin_tickets")
        }
    }
}
