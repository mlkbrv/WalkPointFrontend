import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = 'walkpoint_google_fit_ok';
const DENIED_UNTIL_KEY = 'walkpoint_google_fit_denied_until';

let sessionSkipAuth = false;
let pendingAuthorize = null;

export async function clearGoogleFitDeniedCooldown() {
  try {
    await AsyncStorage.removeItem(DENIED_UNTIL_KEY);
  } catch (_) {}
}

export async function clearGoogleFitAuthCache() {
  sessionSkipAuth = false;
  pendingAuthorize = null;
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, DENIED_UNTIL_KEY]);
  } catch (_) {}
}

async function isDeniedCooldown() {
  try {
    const until = await AsyncStorage.getItem(DENIED_UNTIL_KEY);
    if (!until) return false;
    const t = parseInt(until, 10);
    if (Number.isNaN(t) || Date.now() >= t) {
      await AsyncStorage.removeItem(DENIED_UNTIL_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function setDeniedCooldown(hours = 24) {
  try {
    await AsyncStorage.setItem(
      DENIED_UNTIL_KEY,
      String(Date.now() + hours * 60 * 60 * 1000),
    );
  } catch (_) {}
}

export async function getGoogleFitTodaySteps() {
  if (Platform.OS !== 'android') return 0;
  if (await isDeniedCooldown()) return 0;

  let FitnessTracker;
  let FitnessDataType;
  let GoogleFitDataType;
  let HealthKitDataType;
  try {
    const m = require('@kilohealth/rn-fitness-tracker');
    FitnessTracker = m.FitnessTracker;
    FitnessDataType = m.FitnessDataType;
    GoogleFitDataType = m.GoogleFitDataType;
    HealthKitDataType = m.HealthKitDataType;
  } catch {
    return 0;
  }

  const readSteps = async () => {
    const { today } = await FitnessTracker.getData(FitnessDataType.Steps);
    const n = typeof today === 'number' ? today : 0;
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  };

  let useFastPath = sessionSkipAuth;
  if (!useFastPath) {
    try {
      useFastPath = (await AsyncStorage.getItem(STORAGE_KEY)) === '1';
    } catch (_) {}
  }

  if (useFastPath) {
    try {
      return await readSteps();
    } catch (e) {
      console.warn('Google Fit read:', e?.message ?? e);
      return 0;
    }
  }

  if (!pendingAuthorize) {
    pendingAuthorize = FitnessTracker.authorize({
      googleFitReadPermissions: [GoogleFitDataType.Steps],
      healthReadPermissions: [HealthKitDataType.StepCount],
    }).finally(() => {
      pendingAuthorize = null;
    });
  }

  let authorized;
  try {
    authorized = await pendingAuthorize;
  } catch (e) {
    console.warn('Google Fit authorize:', e?.message ?? e);
    return 0;
  }

  if (!authorized) {
    await setDeniedCooldown(24);
    return 0;
  }

  sessionSkipAuth = true;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '1');
  } catch (_) {}

  try {
    return await readSteps();
  } catch (e) {
    console.warn('Google Fit read after authorize:', e?.message ?? e);
    return 0;
  }
}
