package expo.modules.stepcounter

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoStepCounterModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoStepCounter")

    Function("isStepCounterSupported") {
      val ctx = requireAppContext()
      val sm = ctx.getSystemService(Context.SENSOR_SERVICE) as SensorManager
      sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
    }

    Function("getTodayStats") {
      val ctx = requireAppContext()
      val interrupted = StepCounterStorage.repairTrackingIfNeeded(ctx)
      val s = StepCounterStorage.getTodayStats(ctx)
      mapOf(
        "steps" to s.steps,
        "activeWalkingMs" to s.activeWalkingMs,
        "tracking" to s.tracking,
        "trackingInterrupted" to interrupted
      )
    }

    AsyncFunction("startTracking") {
      val ctx = requireAppContext()
      val sm = ctx.getSystemService(Context.SENSOR_SERVICE) as SensorManager
      if (sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) == null) {
        throw IllegalStateException("Step counter sensor is not available on this device")
      }
      StepForegroundService.start(ctx)
    }

    AsyncFunction("stopTracking") {
      val ctx = requireAppContext()
      StepForegroundService.stop(ctx)
    }
  }

  private fun requireAppContext(): Context =
    appContext.reactContext?.applicationContext
      ?: throw IllegalStateException("React context is not available")
}
