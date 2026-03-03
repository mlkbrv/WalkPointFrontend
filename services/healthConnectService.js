import { Platform } from 'react-native';

let HealthConnect = null;
let SdkAvailabilityStatus = null;

// Only import on Android
if (Platform.OS === 'android') {
  try {
    const hc = require('react-native-health-connect');
    HealthConnect = {
      initialize: hc.initialize,
      getSdkStatus: hc.getSdkStatus,
      requestPermission: hc.requestPermission,
      readRecords: hc.readRecords,
      openHealthConnectSettings: hc.openHealthConnectSettings,
    };
    SdkAvailabilityStatus = hc.SdkAvailabilityStatus;
  } catch (e) {
    console.log('Health Connect not available:', e.message);
  }
}

export const isHealthConnectAvailable = () => {
  return Platform.OS === 'android' && HealthConnect !== null;
};

export const checkHealthConnectStatus = async () => {
  if (!isHealthConnectAvailable()) {
    return { available: false, status: 'NOT_ANDROID' };
  }

  try {
    const status = await HealthConnect.getSdkStatus();
    console.log('Health Connect SDK status:', status);
    
    const isAvailable = SdkAvailabilityStatus 
      ? status === SdkAvailabilityStatus.SDK_AVAILABLE
      : status === 3; // SDK_AVAILABLE = 3
    
    return {
      available: isAvailable,
      status,
    };
  } catch (err) {
    console.error('Error checking Health Connect status:', err);
    return { available: false, status: 'ERROR', error: err.message };
  }
};

export const initializeHealthConnect = async () => {
  if (!isHealthConnectAvailable()) {
    console.log('Health Connect not available on this platform');
    return false;
  }

  try {
    const initialized = await HealthConnect.initialize();
    console.log('Health Connect initialized:', initialized);
    return initialized;
  } catch (err) {
    console.error('Error initializing Health Connect:', err);
    return false;
  }
};

export const requestHealthConnectPermissions = async () => {
  if (!isHealthConnectAvailable()) {
    return false;
  }

  try {
    const permissions = await HealthConnect.requestPermission([
      { accessType: 'read', recordType: 'Steps' },
    ]);
    
    console.log('Health Connect permissions:', permissions);
    return Array.isArray(permissions) && permissions.length > 0;
  } catch (err) {
    console.error('Error requesting Health Connect permissions:', err);
    return false;
  }
};

export const getTodaySteps = async () => {
  if (!isHealthConnectAvailable()) {
    return 0;
  }

  try {
    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await HealthConnect.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startOfDay.toISOString(),
        endTime: now.toISOString(),
      },
    });

    // Handle different response formats
    const records = result?.records || result || [];
    const totalSteps = Array.isArray(records) 
      ? records.reduce((sum, record) => sum + (record.count || record.steps || 0), 0)
      : 0;
    
    console.log('Health Connect steps today:', totalSteps);
    return totalSteps;
  } catch (err) {
    console.error('Error reading steps from Health Connect:', err);
    return 0;
  }
};

export const getStepsInRange = async (startDate, endDate) => {
  if (!isHealthConnectAvailable()) {
    return 0;
  }

  try {
    const result = await HealthConnect.readRecords('Steps', {
      timeRangeFilter: {
        operator: 'between',
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    const records = result?.records || result || [];
    const totalSteps = Array.isArray(records)
      ? records.reduce((sum, record) => sum + (record.count || record.steps || 0), 0)
      : 0;
    
    return totalSteps;
  } catch (err) {
    console.error('Error reading steps range from Health Connect:', err);
    return 0;
  }
};

export const openHealthConnectSettings = async () => {
  if (!isHealthConnectAvailable()) {
    return;
  }

  try {
    await HealthConnect.openHealthConnectSettings();
  } catch (err) {
    console.error('Error opening Health Connect settings:', err);
  }
};
