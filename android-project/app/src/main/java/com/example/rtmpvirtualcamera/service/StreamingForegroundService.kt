package com.example.rtmpvirtualcamera.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.rtmpvirtualcamera.ui.MainActivity

/**
 * Foreground service to maintain RTMP streaming when the user navigates away or turns off screen.
 * Complies with Android 14+ foregroundServiceType="mediaPlayback" requirements.
 */
class StreamingForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "rtmp_virtual_camera_stream"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "com.example.rtmpvirtualcamera.START_STREAM"
        const val ACTION_STOP = "com.example.rtmpvirtualcamera.STOP_STREAM"
        const val EXTRA_STREAM_URL = "extra_stream_url"

        fun startStreamingService(context: Context, streamUrl: String) {
            val intent = Intent(context, StreamingForegroundService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_STREAM_URL, streamUrl)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopStreamingService(context: Context) {
            val intent = Intent(context, StreamingForegroundService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val streamUrl = intent.getStringExtra(EXTRA_STREAM_URL) ?: "RTMP Stream"
                startForegroundWithNotification(streamUrl)
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "RTMP Virtual Camera Streaming",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows live RTMP camera background stream status"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun startForegroundWithNotification(streamUrl: String) {
        // Tap notification to return to MainActivity
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openAppPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openAppIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Action button to stop streaming immediately from notification
        val stopIntent = Intent(this, StreamingForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("RTMP Virtual Camera Active")
            .setContentText("Streaming from: $streamUrl")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .setContentIntent(openAppPendingIntent)
            .addAction(
                android.R.drawable.ic_media_pause,
                "Stop Streaming",
                stopPendingIntent
            )
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }
}
