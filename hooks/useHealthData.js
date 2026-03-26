import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import * as healthService from '../services/healthService';

const HEALTH_CONNECT_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';
const STORAGE_KEY_HEALTH_READY = 'healthConnectReady';

export function useHealthData() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [statusChecked, setStatusChecked] = useState(false);
  const [healthConnectAvailable, setHealthConnectAvailable] = useState(null);
  const initRef = useRef(false);
  const restoredRef = useRef(false);
  const isReadyRef = useRef(false);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  const isAvailable = healthService.isAvailable();

  const checkStatusOnce = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    if (!isAvailable) {
      setStatusChecked(true);
      setHealthConnectAvailable(false);
      return;
    }
    try {
      const status = await healthService.checkStatus();
      setHealthConnectAvailable(status.available);
      setStatusChecked(true);
    } catch (e) {
      setStatusChecked(true);
      setHealthConnectAvailable(false);
    }
  }, [isAvailable]);

  const needsHealthConnectScreen = false;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    checkStatusOnce();
  }, [checkStatusOnce]);

  // Restore Health Connect ready state so we don't lose it on remount/navigation
  useEffect(() => {
    if (Platform.OS !== 'android' || !isAvailable || !statusChecked || healthConnectAvailable !== true || restoredRef.current) return;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY_HEALTH_READY);
        if (stored !== '1') return;
        const initialized = await healthService.initialize();
        if (!initialized) return;
        const granted = await healthService.getGrantedPermissions();
        const hasStepsRead =
          Array.isArray(granted) &&
          granted.some(
            (p) =>
              p &&
              String(p.accessType).toLowerCase() === 'read' &&
              p.recordType === 'Steps',
          );
        if (hasStepsRead) {
          initRef.current = true;
          setIsReady(true);
          restoredRef.current = true;
          console.log('Health Connect state restored (Steps read)');
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY_HEALTH_READY);
        }
      } catch (_) {}
    })();
  }, [isAvailable, statusChecked, healthConnectAvailable]);

  const tryAdoptGrantedStepsFromSystem = useCallback(async () => {
    if (Platform.OS !== 'android' || !isAvailable || healthConnectAvailable !== true) return;
    if (isReadyRef.current) return;
    try {
      const initialized = await healthService.initialize();
      if (!initialized) return;
      const granted = await healthService.getGrantedPermissions();
      const hasStepsRead =
        Array.isArray(granted) &&
        granted.some(
          (p) =>
            p &&
            String(p.accessType).toLowerCase() === 'read' &&
            p.recordType === 'Steps',
        );
      if (!hasStepsRead) return;
      initRef.current = true;
      setIsReady(true);
      restoredRef.current = true;
      await AsyncStorage.setItem(STORAGE_KEY_HEALTH_READY, '1');
    } catch (_) {}
  }, [isAvailable, healthConnectAvailable]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !statusChecked || healthConnectAvailable !== true || !isAvailable) return;
    tryAdoptGrantedStepsFromSystem();
  }, [statusChecked, healthConnectAvailable, isAvailable, tryAdoptGrantedStepsFromSystem]);

  useEffect(() => {
    if (Platform.OS !== 'android' || !statusChecked) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkStatusOnce();
        tryAdoptGrantedStepsFromSystem();
      }
    });
    return () => sub?.remove();
  }, [statusChecked, checkStatusOnce, tryAdoptGrantedStepsFromSystem]);

  const init = useCallback(async () => {
    if (!isAvailable) return false;
    if (initRef.current) return isReady;
    initRef.current = true;
    setError(null);

    try {
      const status = await healthService.checkStatus();
      if (!status.available) {
        console.warn('Health Connect init: not available', status);
        initRef.current = false;
        return false;
      }
      console.log('Health Connect init: checkStatus OK');

      const initialized = await healthService.initialize();
      if (!initialized) {
        console.warn('Health Connect init: initialize() failed');
        initRef.current = false;
        return false;
      }
      console.log('Health Connect init: initialize OK');

      // This opens the system permission dialog — WalkPoint will appear there and in Health Connect app list after grant
      const hasPermission = await healthService.requestPermissions();
      if (!hasPermission) {
        console.warn('Health Connect init: requestPermissions returned false (dialog dismissed or denied)');
        if (Platform.OS === 'android') {
          Alert.alert(
            'Разрешения не предоставлены',
            'На экране разрешений выберите WalkPoint и включите доступ к «Шаги». После этого приложение появится в Health Connect.',
            [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Ещё раз', onPress: () => retryInit() },
              { text: 'Настройки Health Connect', onPress: () => healthService.openSettings() },
            ]
          );
        }
        initRef.current = false;
        return false;
      }

      setIsReady(true);
      try {
        await AsyncStorage.setItem(STORAGE_KEY_HEALTH_READY, '1');
      } catch (_) {}
      return true;
    } catch (err) {
      console.error('useHealthData init:', err);
      setError(err?.message ?? 'Unknown error');
      initRef.current = false;
      return false;
    }
  }, [isAvailable, isReady]);

  // Allow user to open the Health Connect permission dialog again (so WalkPoint appears there)
  const retryInit = useCallback(() => {
    initRef.current = false;
    return init();
  }, [init]);

  // On Android, only call Health Connect when isReady (permission already requested and granted).
  // Calling getTodaySteps() before that can trigger the permission dialog and crash if
  // HealthConnectPermissionDelegate is not set in MainActivity.onCreate().
  const getTodaySteps = useCallback(async () => {
    if (!isAvailable) return 0;
    if (Platform.OS === 'android') {
      if (!isReady) {
        console.warn('Health Connect not ready (permission not granted), skipping steps');
        return 0;
      }
    }
    try {
      return await healthService.getTodaySteps();
    } catch (error) {
      console.warn('Step count not supported on this device:', error?.message ?? error);
      return 0;
    }
  }, [isAvailable, isReady]);

  const openSettings = useCallback(() => {
    healthService.openSettings();
  }, []);

  const openSamsungHealth = useCallback(async () => {
    return healthService.openSamsungHealth();
  }, []);

  const requestPermissions = useCallback(async () => {
    return healthService.requestPermissions();
  }, []);

  return {
    isAvailable,
    isReady,
    error,
    init,
    retryInit,
    getTodaySteps,
    requestPermissions,
    openSettings,
    openSamsungHealth,
    needsHealthConnectScreen,
    healthConnectAvailable: statusChecked ? healthConnectAvailable : null,
    isCheckingHealthConnect: Platform.OS === 'android' && !statusChecked,
    refreshHealthConnectStatus: checkStatusOnce,
    healthConnectPlayUrl: HEALTH_CONNECT_PLAY_URL,
  };
}
