package expo.modules.stepcounter

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class StepForegroundService : Service(), SensorEventListener {
  private lateinit var sensorManager: SensorManager
  private var stepSensor: Sensor? = null

  override fun onCreate() {
    super.onCreate()
    sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
    stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (stepSensor == null) {
      StepCounterStorage.setTracking(this, false)
      stopSelf()
      return START_NOT_STICKY
    }

    StepCounterStorage.setTracking(this, true)

    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }

    val ok = sensorManager.registerListener(
      this,
      stepSensor,
      SensorManager.SENSOR_DELAY_NORMAL
    )
    if (!ok) {
      StepCounterStorage.setTracking(this, false)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        stopForeground(STOP_FOREGROUND_REMOVE)
      } else {
        @Suppress("DEPRECATION")
        stopForeground(true)
      }
      stopSelf()
      return START_NOT_STICKY
    }

    return START_STICKY
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    try {
      sensorManager.unregisterListener(this)
    } catch (_: Exception) {
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION")
      stopForeground(true)
    }
    StepCounterStorage.setTracking(this, false)
    stopSelf()
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    try {
      sensorManager.unregisterListener(this)
    } catch (_: Exception) {
    }
    StepCounterStorage.setTracking(this, false)
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

  override fun onSensorChanged(event: SensorEvent?) {
    if (event == null || event.sensor.type != Sensor.TYPE_STEP_COUNTER) return
    val total = event.values[0].toLong()
    StepCounterStorage.applyReading(this, total)

    val stats = StepCounterStorage.getTodayStats(this)
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.notify(NOTIFICATION_ID, buildNotification(stats.steps))
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Step tracking",
      NotificationManager.IMPORTANCE_LOW
    ).apply {
      description = "Shows while steps are counted in the background"
    }
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.createNotificationChannel(channel)
  }

  private fun buildNotification(liveSteps: Long? = null): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
      ?: Intent()
    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or pendingIntentImmutableFlag()
    )

    val steps = liveSteps ?: StepCounterStorage.getTodayStats(this).steps
    val text = "Today: $steps steps"

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Step counter")
      .setContentText(text)
      .setSmallIcon(android.R.drawable.ic_dialog_info)
      .setOngoing(true)
      .setContentIntent(pendingIntent)
      .setOnlyAlertOnce(true)
      .build()
  }

  private fun pendingIntentImmutableFlag(): Int {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      PendingIntent.FLAG_IMMUTABLE
    } else {
      0
    }
  }

  companion object {
    private const val CHANNEL_ID = "expo_step_counter_tracking"
    private const val NOTIFICATION_ID = 71042

    fun start(context: Context) {
      val intent = Intent(context, StepForegroundService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.applicationContext.startForegroundService(intent)
      } else {
        context.applicationContext.startService(intent)
      }
    }

    fun stop(context: Context) {
      val intent = Intent(context, StepForegroundService::class.java)
      context.applicationContext.stopService(intent)
    }
  }
}
