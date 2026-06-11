import { Platform } from 'react-native';

let HealthKit = null;
let Permissions = null;

if (Platform.OS === 'ios') {
  try {
    const mod = require('react-native-health');
    HealthKit = mod.default ?? mod;
    Permissions = HealthKit.Constants?.Permissions;
  } catch (e) {
    console.log('Apple Health not available:', e.message);
  }
}

function readPermissionsList() {
  const P = Permissions;
  if (!P) {
    return ['StepCount', 'DistanceWalkingRunning', 'ActiveEnergyBurned', 'Height', 'Weight'];
  }
  return [P.StepCount, P.DistanceWalkingRunning, P.ActiveEnergyBurned, P.Height, P.Weight].filter(Boolean);
}

function startOfLocalDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function promisifyHealthKit(method, options) {
  return new Promise((resolve) => {
    method(options, (err, result) => {
      if (err) {
        resolve(0);
        return;
      }
      const value = result?.value ?? result ?? 0;
      resolve(typeof value === 'number' ? value : 0);
    });
  });
}

export const isAvailable = () => Platform.OS === 'ios' && HealthKit != null;

export const checkStatus = async () => {
  if (!isAvailable()) return { available: false, status: 'NOT_IOS' };
  return new Promise((resolve) => {
    HealthKit.isAvailable((err, available) => {
      if (err) {
        resolve({ available: false, status: 'ERROR', error: err?.message });
        return;
      }
      resolve({ available: !!available, status: available ? 'AVAILABLE' : 'UNAVAILABLE' });
    });
  });
};

export const initialize = async () => {
  if (!isAvailable()) return false;
  return new Promise((resolve) => {
    HealthKit.initHealthKit(
      {
        permissions: {
          read: readPermissionsList(),
          write: [],
        },
      },
      (err) => {
        resolve(!err);
      },
    );
  });
};

export const requestPermissions = async () => initialize();

/** Android hook parity: HealthKit has no equivalent list API. */
export const getGrantedPermissions = async () => [];

export const getTodaySteps = async () => {
  if (!isAvailable()) return 0;
  const now = new Date();
  const startOfDay = startOfLocalDay(now);
  return promisifyHealthKit(HealthKit.getStepCount.bind(HealthKit), {
    startDate: startOfDay.toISOString(),
    endDate: now.toISOString(),
  });
};

export const getTodayDistance = async () => {
  if (!isAvailable() || !HealthKit.getDistanceWalkingRunning) return 0;
  const now = new Date();
  const start = startOfLocalDay(now);
  const meters = await promisifyHealthKit(HealthKit.getDistanceWalkingRunning.bind(HealthKit), {
    startDate: start.toISOString(),
    endDate: now.toISOString(),
    unit: 'meter',
  });
  return meters;
};

export const getTodayActiveCalories = async () => {
  if (!isAvailable() || !HealthKit.getActiveEnergyBurned) return 0;
  const now = new Date();
  const start = startOfLocalDay(now);
  const kcal = await promisifyHealthKit(HealthKit.getActiveEnergyBurned.bind(HealthKit), {
    startDate: start.toISOString(),
    endDate: now.toISOString(),
    unit: 'kilocalorie',
  });
  return Math.round(kcal);
};

export const getDailyMetrics = async () => {
  if (!isAvailable()) {
    return { steps: 0, distanceM: 0, activeCalories: 0, activeMinutes: 0 };
  }
  const [steps, distanceM, activeCalories] = await Promise.all([
    getTodaySteps(),
    getTodayDistance(),
    getTodayActiveCalories(),
  ]);
  const activeMinutes = steps > 0 ? Math.max(1, Math.round(steps / 100)) : 0;
  return { steps, distanceM, activeCalories, activeMinutes };
};

export const getStepsHistory = async (days = 7) => {
  if (!isAvailable()) return [];
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const start = startOfLocalDay(day);
    const end = i === 0 ? now : new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
    const steps = await getStepsInRange(start, end);
    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    result.push({ date: dateKey, steps });
  }
  return result;
};

export const getStepsInRange = async (startDate, endDate) => {
  if (!isAvailable()) return 0;
  return new Promise((resolve) => {
    HealthKit.getStepCount(
      { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
      (err, result) => {
        if (err) {
          console.error('Apple Health getStepsInRange:', err);
          resolve(0);
          return;
        }
        const value = result?.value ?? result ?? 0;
        resolve(typeof value === 'number' ? value : 0);
      },
    );
  });
};

export const getBodyProfile = async () => {
  if (!isAvailable()) return { weightKg: null, heightCm: null };
  const weightKg = await new Promise((resolve) => {
    HealthKit.getLatestWeight({ unit: 'kg' }, (err, res) => {
      if (err || res == null || typeof res.value !== 'number') {
        resolve(null);
        return;
      }
      resolve(res.value);
    });
  });
  const heightCm = await new Promise((resolve) => {
    HealthKit.getLatestHeight({ unit: 'meter' }, (err, res) => {
      if (err || res == null || typeof res.value !== 'number') {
        resolve(null);
        return;
      }
      resolve(res.value * 100);
    });
  });
  return { weightKg, heightCm };
};

export const openSettings = async () => {
  if (Platform.OS !== 'ios') return;
  const { Linking } = require('react-native');
  Linking.openSettings();
};
