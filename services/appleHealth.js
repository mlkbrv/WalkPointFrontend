import { Platform } from 'react-native';

let HealthKit = null;
if (Platform.OS === 'ios') {
  try {
    HealthKit = require('react-native-health');
    if (HealthKit && HealthKit.default) HealthKit = HealthKit.default;
  } catch (e) {
    console.log('Apple Health not available:', e.message);
  }
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
          read: [HealthKit.Constants?.Permissions?.StepCount || 'StepCount'],
          write: [],
        },
      },
      (err) => {
        resolve(!err);
      }
    );
  });
};

export const requestPermissions = async () => {
  return initialize();
};

export const getTodaySteps = async () => {
  if (!isAvailable()) return 0;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return new Promise((resolve) => {
    HealthKit.getStepCount(
      { startDate: startOfDay.toISOString(), endDate: now.toISOString() },
      (err, result) => {
        if (err) {
          console.error('Apple Health getStepCount:', err);
          resolve(0);
          return;
        }
        const value = result?.value ?? result ?? 0;
        resolve(typeof value === 'number' ? value : 0);
      }
    );
  });
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
      }
    );
  });
};

export const openSettings = async () => {
  if (Platform.OS !== 'ios') return;
  const { Linking } = require('react-native');
  Linking.openSettings();
};
