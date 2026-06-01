package expo.modules.stepcounter

import android.app.ActivityManager
import android.content.Context
import android.content.SharedPreferences
import java.util.Calendar
import java.util.Locale

internal object StepCounterStorage {
  private const val PREF = "expo_step_counter_v1"
  private const val KEY_DAY = "day_key"
  private const val KEY_TODAY = "today_steps"
  private const val KEY_LAST = "last_counter_total"
  private const val KEY_ACTIVE_MS = "active_walk_ms"
  private const val KEY_TRACKING = "is_tracking"

  private fun prefs(ctx: Context): SharedPreferences =
    ctx.applicationContext.getSharedPreferences(PREF, Context.MODE_PRIVATE)

  private fun currentDayString(): String {
    val cal = Calendar.getInstance()
    val y = cal.get(Calendar.YEAR)
    val m = cal.get(Calendar.MONTH) + 1
    val d = cal.get(Calendar.DAY_OF_MONTH)
    return String.format(Locale.US, "%04d-%02d-%02d", y, m, d)
  }

  fun setTracking(ctx: Context, tracking: Boolean) {
    prefs(ctx).edit().putBoolean(KEY_TRACKING, tracking).apply()
  }

  fun isTracking(ctx: Context): Boolean = prefs(ctx).getBoolean(KEY_TRACKING, false)

  /**
   * If the app process was killed or the user swiped the task away, [KEY_TRACKING] can stay true
   * while the foreground service is no longer running. Clears the stale flag so the UI can start again.
   * Returns true when we had to clear a stale "tracking" flag (so JS can notify the user once).
   */
  fun repairTrackingIfNeeded(ctx: Context): Boolean {
    val app = ctx.applicationContext
    val p = prefs(app)
    val saved = p.getBoolean(KEY_TRACKING, false)
    val running = isStepForegroundServiceRunning(app)
    if (saved && !running) {
      p.edit().putBoolean(KEY_TRACKING, false).apply()
      return true
    }
    if (!saved && running) {
      p.edit().putBoolean(KEY_TRACKING, true).apply()
    }
    return false
  }

  @Suppress("DEPRECATION")
  private fun isStepForegroundServiceRunning(ctx: Context): Boolean {
    val expected = StepForegroundService::class.java.name
    val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    for (info in am.getRunningServices(64)) {
      if (info.service.packageName == ctx.packageName && expected == info.service.className) {
        return true
      }
    }
    return false
  }

  fun applyReading(ctx: Context, total: Long) {
    val p = prefs(ctx)
    val todayKey = currentDayString()

    var dayKey = p.getString(KEY_DAY, null)
    var todaySteps = p.getLong(KEY_TODAY, 0L)
    var activeMs = p.getLong(KEY_ACTIVE_MS, 0L)
    var last = p.getLong(KEY_LAST, -1L)

    if (dayKey == null) {
      dayKey = todayKey
    }
    if (dayKey != todayKey) {
      todaySteps = 0L
      activeMs = 0L
      dayKey = todayKey
      last = -1L
    }

    if (last < 0L) {
      last = total
    } else if (total >= last) {
      val delta = total - last
      if (delta > 0L) {
        todaySteps += delta
        activeMs += (delta * 60_000L) / 110L
      }
      last = total
    } else {
      last = total
    }

    p.edit()
      .putString(KEY_DAY, dayKey)
      .putLong(KEY_TODAY, todaySteps)
      .putLong(KEY_LAST, last)
      .putLong(KEY_ACTIVE_MS, activeMs)
      .apply()
  }

  fun getTodayStats(ctx: Context): TodayStats {
    val p = prefs(ctx)
    val todayKey = currentDayString()
    val storedDay = p.getString(KEY_DAY, todayKey) ?: todayKey

    if (storedDay != todayKey) {
      p.edit()
        .putString(KEY_DAY, todayKey)
        .putLong(KEY_TODAY, 0L)
        .putLong(KEY_ACTIVE_MS, 0L)
        .putLong(KEY_LAST, -1L)
        .apply()
      return TodayStats(0L, 0L, p.getBoolean(KEY_TRACKING, false))
    }

    return TodayStats(
      steps = p.getLong(KEY_TODAY, 0L),
      activeWalkingMs = p.getLong(KEY_ACTIVE_MS, 0L),
      tracking = p.getBoolean(KEY_TRACKING, false)
    )
  }

  data class TodayStats(
    val steps: Long,
    val activeWalkingMs: Long,
    val tracking: Boolean
  )
}
