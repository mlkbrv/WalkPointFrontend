import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

let FitnessTracker = null;
let FitnessDataType = null;
let HealthKitDataType = null;
let GoogleFitDataType = null;

try {
  const ft = require('@kilohealth/rn-fitness-tracker');
  FitnessTracker = ft.default || ft.FitnessTracker;
  FitnessDataType = ft.FitnessDataType;
  HealthKitDataType = ft.HealthKitDataType;
  GoogleFitDataType = ft.GoogleFitDataType;
} catch (e) {
  console.log('FitnessTracker not available:', e.message);
}

const isHuaweiDevice = async () => {
  try {
    const brand = await DeviceInfo.getBrand();
    const manufacturer = await DeviceInfo.getManufacturer();
    const lowerBrand = brand.toLowerCase();
    const lowerManufacturer = manufacturer.toLowerCase();
    return lowerBrand.includes('huawei') || lowerBrand.includes('honor') ||
           lowerManufacturer.includes('huawei') || lowerManufacturer.includes('honor');
  } catch {
    return false;
  }
};

export const checkFitnessAvailability = async () => {
  if (!FitnessTracker) {
    return { available: false, reason: 'LIBRARY_NOT_INSTALLED' };
  }

  if (Platform.OS === 'android') {
    const isHuawei = await isHuaweiDevice();
    if (isHuawei) {
      return { available: false, reason: 'HUAWEI_NOT_SUPPORTED' };
    }
  }

  return { available: true, reason: null };
};

export const authorizeFitnessTracker = async () => {
  const availability = await checkFitnessAvailability();
  if (!availability.available) {
    console.log('FitnessTracker not available:', availability.reason);
    return { authorized: false, reason: availability.reason };
  }

  try {
    const permissions = {
      healthReadPermissions: HealthKitDataType ? [HealthKitDataType.StepCount] : [],
      googleFitReadPermissions: GoogleFitDataType ? [GoogleFitDataType.Steps] : [],
    };

    const authorized = await FitnessTracker.authorize(permissions);
    console.log('FitnessTracker authorization:', authorized);
    return { authorized: !!authorized, reason: authorized ? null : 'PERMISSION_DENIED' };
  } catch (err) {
    console.error('FitnessTracker authorization error:', err);
    return { authorized: false, reason: 'AUTH_ERROR', error: err.message };
  }
};

export const getTodaySteps = async () => {
  const availability = await checkFitnessAvailability();
  if (!availability.available) {
    return { steps: 0, error: availability.reason };
  }

  try {
    const steps = await FitnessTracker.getStatisticTodayTotal(FitnessDataType.Steps);
    console.log('FitnessTracker steps today:', steps);
    return { steps: steps || 0, error: null };
  } catch (err) {
    console.error('FitnessTracker getTodaySteps error:', err);
    return { steps: 0, error: err.message };
  }
};

export const getWeeklySteps = async () => {
  const availability = await checkFitnessAvailability();
  if (!availability.available) {
    return { data: [], error: availability.reason };
  }

  try {
    const weekData = await FitnessTracker.getStatisticWeekDaily(FitnessDataType.Steps);
    console.log('FitnessTracker weekly steps:', weekData);
    return { data: weekData || [], error: null };
  } catch (err) {
    console.error('FitnessTracker getWeeklySteps error:', err);
    return { data: [], error: err.message };
  }
};

export const isTrackerAvailable = () => {
  return FitnessTracker !== null;
};

export { FitnessTracker, FitnessDataType, HealthKitDataType, GoogleFitDataType };
