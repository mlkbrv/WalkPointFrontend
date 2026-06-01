import { PermissionsAndroid, Platform } from 'react-native';

let ExpoStepCounter = null;
try {
  ExpoStepCounter = require('expo-step-counter').default;
} catch (_) {
  ExpoStepCounter = null;
}

export function isNativeStepCounterSupported() {
  if (Platform.OS !== 'android' || !ExpoStepCounter) return false;
  try {
    return ExpoStepCounter.isStepCounterSupported();
  } catch {
    return false;
  }
}

/** @returns {null | { steps: number, activeWalkingMs: number, tracking: boolean, trackingInterrupted?: boolean }} */
export function getNativeTodayStatsSafe() {
  if (Platform.OS !== 'android' || !ExpoStepCounter) return null;
  try {
    return ExpoStepCounter.getTodayStats();
  } catch {
    return null;
  }
}

export async function ensureAndroidStepPermissions() {
  if (Platform.OS !== 'android') return false;

  const activity = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
  );
  if (activity !== PermissionsAndroid.RESULTS.GRANTED) {
    return false;
  }

  if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
    const notif = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (notif !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }

  return true;
}

export async function startNativeStepTracking() {
  if (Platform.OS !== 'android' || !ExpoStepCounter) return false;
  if (!ExpoStepCounter.isStepCounterSupported()) return false;
  const ok = await ensureAndroidStepPermissions();
  if (!ok) return false;
  try {
    await ExpoStepCounter.startTracking();
    return true;
  } catch {
    return false;
  }
}
