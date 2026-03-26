import { Linking, Platform } from 'react-native';

const SAMSUNG_HEALTH_PACKAGE = 'com.sec.android.app.shealth';
const SAMSUNG_HEALTH_PLAY_URL = 'https://play.google.com/store/apps/details?id=' + SAMSUNG_HEALTH_PACKAGE;

let HealthConnect = null;
let SdkAvailabilityStatus = null;

if (Platform.OS === 'android') {
  try {
    const hc = require('react-native-health-connect');
    HealthConnect = {
      initialize: hc.initialize,
      getSdkStatus: hc.getSdkStatus,
      requestPermission: hc.requestPermission,
      getGrantedPermissions: hc.getGrantedPermissions,
      readRecords: hc.readRecords,
      openHealthConnectSettings: hc.openHealthConnectSettings,
    };
    SdkAvailabilityStatus = hc.SdkAvailabilityStatus;
  } catch (e) {
    console.log('Health Connect not available:', e.message);
  }
}

export const isAvailable = () => Platform.OS === 'android' && HealthConnect !== null;

export const checkStatus = async () => {
  if (!isAvailable()) return { available: false, status: 'NOT_ANDROID' };
  try {
    const status = await HealthConnect.getSdkStatus();
    const isAvailableStatus = SdkAvailabilityStatus
      ? status === SdkAvailabilityStatus.SDK_AVAILABLE
      : status === 3;
    return { available: isAvailableStatus, status };
  } catch (err) {
    console.error('Health Connect checkStatus:', err);
    return { available: false, status: 'ERROR', error: err.message };
  }
};

export const initialize = async () => {
  if (!isAvailable()) return false;
  try {
    return await HealthConnect.initialize();
  } catch (err) {
    console.error('Health Connect initialize:', err);
    return false;
  }
};

export const getGrantedPermissions = async () => {
  if (!isAvailable()) return [];
  try {
    const list = await HealthConnect.getGrantedPermissions();
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn('Health Connect getGrantedPermissions:', err);
    return [];
  }
};

const HEALTH_READ_PERMISSIONS = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
];

function hasStepsReadPermission(list) {
  if (!Array.isArray(list)) return false;
  return list.some(
    (p) =>
      p &&
      String(p.accessType).toLowerCase() === 'read' &&
      p.recordType === 'Steps',
  );
}

export const requestPermissions = async () => {
  if (!isAvailable()) return false;
  try {
    await HealthConnect.requestPermission(HEALTH_READ_PERMISSIONS);
    const grantedList = await getGrantedPermissions();
    const ok = hasStepsReadPermission(grantedList);
    if (ok) {
      console.log('Health Connect Steps read granted (verified)');
    } else {
      console.log('Health Connect: no Steps read after dialog');
    }
    return ok;
  } catch (err) {
    console.error('Health Connect requestPermissions:', err);
    return false;
  }
};

function stepsFromRecord(r) {
  if (r == null) return 0;
  return r.count ?? r.steps ?? r.value ?? 0;
}

export const getTodaySteps = async () => {
  if (!isAvailable()) return 0;
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const result = await HealthConnect.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      },
    });
    const records = result?.records ?? result ?? [];
    if (!Array.isArray(records)) return 0;
    const total = records.reduce((sum, r) => sum + stepsFromRecord(r), 0);
    return total;
  } catch (err) {
    console.error('Health Connect getTodaySteps:', err);
    return 0;
  }
};

export const getStepsInRange = async (startDate, endDate) => {
  if (!isAvailable()) return 0;
  try {
    const result = await HealthConnect.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });
    const records = result?.records || result || [];
    return Array.isArray(records)
      ? records.reduce((sum, r) => sum + (r.count || r.steps || 0), 0)
      : 0;
  } catch (err) {
    console.error('Health Connect getStepsInRange:', err);
    return 0;
  }
};

export const openSettings = async () => {
  if (!isAvailable()) return;
  try {
    await HealthConnect.openHealthConnectSettings();
  } catch (err) {
    console.error('Health Connect openSettings:', err);
  }
};

/** Opens Samsung Health app (or Play Store if not installed) */
export const openSamsungHealth = async () => {
  if (Platform.OS !== 'android') return;
  try {
    const intentUrl = `intent://#Intent;package=${SAMSUNG_HEALTH_PACKAGE};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;S.browser_fallback_url=${encodeURIComponent(SAMSUNG_HEALTH_PLAY_URL)};end`;
    await Linking.openURL(intentUrl);
  } catch {
    await Linking.openURL(SAMSUNG_HEALTH_PLAY_URL);
  }
};
