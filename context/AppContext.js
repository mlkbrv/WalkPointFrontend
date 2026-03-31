import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import { Pedometer } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';
import React, { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, PermissionsAndroid, Platform, View } from 'react-native';
import { useHealthData } from '../hooks/useHealthData';
import {
  convertSteps as apiConvertSteps,
  getWallet,
} from '../services/apiService';
import { getGoogleFitTodaySteps } from '../services/googleFitSteps';
import * as healthService from '../services/healthService';
import {
  calculateCaloriesMET,
  calculateDistanceFromSteps,
  calculateWalkingCaloriesFromSteps,
  getDateKey
} from '../utils/calculations';
import i18n from '../i18n/config';
// Lazy to avoid require cycle: AppContext -> HealthConnectRequiredScreen -> useApp (AppContext)
const HealthConnectRequiredScreen = lazy(() => import('../screens/HealthConnectRequiredScreen'));
const StepsOnboardingScreen = lazy(() => import('../screens/StepsOnboardingScreen'));

// Import background actions for foreground service (works on Android for background step counting)
let BackgroundService = null;
try {
  BackgroundService = require('react-native-background-actions').default;
} catch (e) {
  console.log('react-native-background-actions not available');
}

const BACKGROUND_FETCH_INTERVAL_SEC = 15 * 60; // 15 minutes
const FOREGROUND_SYNC_INTERVAL_MS = 30 * 1000; // 30 seconds when app is active
const BACKGROUND_SERVICE_SYNC_INTERVAL_MS = 60 * 1000; // 60 seconds in background service

const defaultDailyStatsShape = () => ({
  steps: 0,
  time: 0,
  calories: 0,
  distance: 0,
  date: getDateKey(),
});

const DEFAULT_APP_VALUE = {
  stepCount: 0,
  isTracking: false,
  dailyStats: defaultDailyStatsShape(),
  weeklyProgress: [],
  trackingHistory: [],
  totalStats: { steps: 0, time: 0, calories: 0, distance: 0 },
  currentRoute: [],
  isTrackingRoute: false,
  startStepTracking: () => {},
  stopStepTracking: () => {},
  resetDailyStats: () => {},
  addTrackingSession: () => {},
  updateWeeklyProgress: () => {},
  setCurrentRoute: () => {},
  setIsTrackingRoute: () => {},
  getHistoricalStats: async () => null,
  requestActivityPermission: async () => false,
  activityPermissionGranted: false,
  healthConnectReady: false,
  useHealthConnect: false,
  initHealthConnect: async () => false,
  requestHealthConnectPermission: async () => false,
  openHealthConnectSettings: () => {},
  openSamsungHealth: async () => {},
  needsHealthConnectScreen: false,
  healthConnectAvailable: null,
  refreshHealthConnectStatus: () => {},
  healthConnectPlayUrl: null,
  syncStepsFromSystem: async () => {},
  isBackgroundServiceRunning: false,
  startBackgroundService: async () => {},
  stopBackgroundService: async () => {},
  walletBalance: '0.00',
  isSyncing: false,
  convertStepsToCoins: async () => null,
  refreshWallet: async () => {},
  fetchBackendData: async () => {},
};

const AppContext = createContext(DEFAULT_APP_VALUE);

export const useApp = () => useContext(AppContext) ?? DEFAULT_APP_VALUE;

const BACKGROUND_STEP_TASK = 'background-step-tracking';

// Background service configuration for Android foreground service
const backgroundServiceOptions = {
  taskName: 'WalkPoint',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#8140F3',
  linkingURI: 'walkpoint://',
  parameters: {
    delay: BACKGROUND_SERVICE_SYNC_INTERVAL_MS,
  },
};

TaskManager.defineTask(BACKGROUND_STEP_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return;
  }

  try {
    const dateKey = getDateKey();
    const storageKey = `dailyStats_${dateKey}`;

    const savedStats = await AsyncStorage.getItem(storageKey);
    let currentStats = savedStats ? JSON.parse(savedStats) : {
      steps: 0,
      time: 0,
      calories: 0,
      distance: 0,
      date: dateKey,
    };

    // On Android, Pedometer.getStepCountAsync(date range) is not supported; steps come from Health Connect when app is in foreground
    const isAvailable = await Pedometer.isAvailableAsync();
    if (isAvailable && Platform.OS !== 'android') {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const now = new Date();

        let newSteps = currentStats.steps || 0;
        try {
          const stepResult = await Pedometer.getStepCountAsync(startOfDay, now);
          if (stepResult && stepResult.steps !== undefined) {
            newSteps = stepResult.steps;
          }
        } catch {
          // keep current
        }

        let weightKg = 75;
        let heightCm = null;
        try {
          const ws = await AsyncStorage.getItem('userBodyWeightKg');
          const hs = await AsyncStorage.getItem('userBodyHeightCm');
          if (ws != null) {
            const n = parseFloat(ws, 10);
            if (Number.isFinite(n) && n > 20) weightKg = n;
          }
          if (hs != null) {
            const n = parseFloat(hs, 10);
            if (Number.isFinite(n) && n > 40) heightCm = n;
          }
        } catch (_) {}
        const newCalories = calculateWalkingCaloriesFromSteps(newSteps, weightKg, heightCm);
        const newDistance = calculateDistanceFromSteps(newSteps, heightCm);

        const updatedStats = {
          ...currentStats,
          steps: newSteps,
          calories: newCalories,
          distance: newDistance,
          lastUpdated: new Date().toISOString(),
        };

        await AsyncStorage.setItem(storageKey, JSON.stringify(updatedStats));

        if (newSteps > (currentStats.steps || 0)) {
          const totalStatsKey = 'totalStats';
          const savedTotal = await AsyncStorage.getItem(totalStatsKey);
          let totalStats = savedTotal ? JSON.parse(savedTotal) : {
            steps: 0,
            time: 0,
            calories: 0,
            distance: 0,
          };

          const stepDiff = newSteps - (currentStats.steps || 0);
          totalStats.steps += stepDiff;
          totalStats.calories = newCalories;
          totalStats.distance = newDistance;
          await AsyncStorage.setItem(totalStatsKey, JSON.stringify(totalStats));
        }
      } catch (stepError) {
        console.error('Error in background step tracking:', stepError);
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task execution error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const AppProvider = ({ children }) => {
  const [stepCount, setStepCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const defaultDailyStats = {
    steps: 0,
    time: 0,
    calories: 0,
    distance: 0,
    date: getDateKey(),
  };
  const [dailyStats, setDailyStats] = useState(defaultDailyStats);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [trackingHistory, setTrackingHistory] = useState([]);
  const [totalStats, setTotalStats] = useState({
    steps: 0,
    time: 0,
    calories: 0,
    distance: 0,
  });
  const [currentRoute, setCurrentRoute] = useState([]);
  const [isTrackingRoute, setIsTrackingRoute] = useState(false);
  const [timeTrackingInterval, setTimeTrackingInterval] = useState(null);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
  const [bodyProfile, setBodyProfile] = useState({ weightKg: 75, heightCm: null });
  const bodyProfileRef = useRef({ weightKg: 75, heightCm: null });
  const subscriptionRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const dateCheckIntervalRef = useRef(null);
  const lastDateRef = useRef(getDateKey());
  const stepsAtSubscriptionStartRef = useRef(0);
  const dailyStatsRef = useRef(defaultDailyStats);
  const [activityPermissionGranted, setActivityPermissionGranted] = useState(false);
  const permissionRequestedRef = useRef(false);
  const [isBackgroundServiceRunning, setIsBackgroundServiceRunning] = useState(false);
  const backgroundServiceRef = useRef(false);

  const healthData = useHealthData();

  dailyStatsRef.current = dailyStats ?? defaultDailyStats;

  useEffect(() => {
    bodyProfileRef.current = bodyProfile;
  }, [bodyProfile]);

  useEffect(() => {
    (async () => {
      try {
        const w = await AsyncStorage.getItem('userBodyWeightKg');
        const h = await AsyncStorage.getItem('userBodyHeightCm');
        const next = { weightKg: 75, heightCm: null };
        if (w != null) {
          const n = parseFloat(w, 10);
          if (Number.isFinite(n) && n > 20 && n < 400) next.weightKg = n;
        }
        if (h != null) {
          const n = parseFloat(h, 10);
          if (Number.isFinite(n) && n > 40 && n < 260) next.heightCm = n;
        }
        bodyProfileRef.current = next;
        setBodyProfile(next);
      } catch (_) {}
    })();
  }, []);

  // ── Wallet / backend state ──
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [isSyncing, setIsSyncing] = useState(false);

  // Request notification permission (required for foreground service on Android 13+)
  const requestNotificationPermission = useCallback(async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
      }
      return true;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }, []);

  // Request Activity Recognition permission (required for step counting on Android 10+)
  const requestActivityPermission = useCallback(async () => {
    if (permissionRequestedRef.current) return activityPermissionGranted;
    permissionRequestedRef.current = true;

    try {
      // Request notification permission first (needed for foreground service)
      await requestNotificationPermission();

      if (Platform.OS === 'android' && Platform.Version >= 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
          {
            title: i18n.t('permissions.activityTitle'),
            message: i18n.t('permissions.activityMessage'),
            buttonNeutral: i18n.t('permissions.askLater'),
            buttonNegative: i18n.t('common.cancel'),
            buttonPositive: i18n.t('permissions.allow'),
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Activity recognition permission granted');
          setActivityPermissionGranted(true);
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            i18n.t('permissions.activityDeniedTitle'),
            i18n.t('permissions.activityDeniedMessage'),
            [
              { text: i18n.t('common.cancel'), style: 'cancel' },
              { text: i18n.t('common.settings'), onPress: () => Linking.openSettings() },
            ]
          );
          setActivityPermissionGranted(false);
          return false;
        } else {
          console.log('Activity recognition permission denied');
          setActivityPermissionGranted(false);
          return false;
        }
      } else if (Platform.OS === 'ios') {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (isAvailable) {
          setActivityPermissionGranted(true);
          return true;
        }
        Alert.alert(
          i18n.t('permissions.pedometerUnavailableTitle'),
          i18n.t('permissions.pedometerUnavailableMessage'),
          [
            { text: i18n.t('common.cancel'), style: 'cancel' },
            { text: i18n.t('common.settings'), onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }
      setActivityPermissionGranted(true);
      return true;
    } catch (err) {
      console.error('Error requesting activity permission:', err);
      return false;
    }
  }, [activityPermissionGranted, requestNotificationPermission]);

  // Background task function that runs in foreground service
  const backgroundStepTask = async (taskDataArguments) => {
    const { delay } = taskDataArguments;
    
    await new Promise(async (resolve) => {
      const syncStepsInBackground = async () => {
        try {
          // Android: Pedometer.getStepCountAsync(date range) not supported; steps sync via Health Connect when app is in foreground
          if (Platform.OS === 'android') return;

          const isAvailable = await Pedometer.isAvailableAsync();
          if (!isAvailable) return;

          const dateKey = getDateKey();
          const storageKey = `dailyStats_${dateKey}`;
          const savedStats = await AsyncStorage.getItem(storageKey);
          let currentStats = savedStats ? JSON.parse(savedStats) : {
            steps: 0, time: 0, calories: 0, distance: 0, date: dateKey,
          };

          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const now = new Date();
          const stepResult = await Pedometer.getStepCountAsync(startOfDay, now);
          const systemStepsToday = stepResult?.steps ?? 0;

          if (systemStepsToday > currentStats.steps) {
            let weightKg = 75;
            let heightCm = null;
            try {
              const ws = await AsyncStorage.getItem('userBodyWeightKg');
              const hs = await AsyncStorage.getItem('userBodyHeightCm');
              if (ws != null) {
                const n = parseFloat(ws, 10);
                if (Number.isFinite(n) && n > 20) weightKg = n;
              }
              if (hs != null) {
                const n = parseFloat(hs, 10);
                if (Number.isFinite(n) && n > 40) heightCm = n;
              }
            } catch (_) {}
            const newCalories = calculateWalkingCaloriesFromSteps(systemStepsToday, weightKg, heightCm);
            const newDistance = calculateDistanceFromSteps(systemStepsToday, heightCm);
            const updatedStats = {
              ...currentStats,
              steps: systemStepsToday,
              calories: newCalories,
              distance: newDistance,
              lastUpdated: new Date().toISOString(),
            };
            await AsyncStorage.setItem(storageKey, JSON.stringify(updatedStats));
            
            // Update total stats
            const savedTotal = await AsyncStorage.getItem('totalStats');
            let totalStats = savedTotal ? JSON.parse(savedTotal) : { steps: 0, time: 0, calories: 0, distance: 0 };
            const stepDiff = systemStepsToday - currentStats.steps;
            totalStats.steps += stepDiff;
            totalStats.distance = newDistance;
            totalStats.calories = newCalories;
            await AsyncStorage.setItem('totalStats', JSON.stringify(totalStats));
            
            console.log(`Background sync: ${systemStepsToday} steps`);
          }
        } catch (err) {
          if (Platform.OS === 'android' && err?.message?.includes('not supported on Android')) return;
          console.error('Background step sync error:', err);
        }
      };

      // Keep running while background service is active
      while (BackgroundService?.isRunning()) {
        await syncStepsInBackground();
        await new Promise(r => setTimeout(r, delay));
      }
      resolve();
    });
  };

  // Start background foreground service for step counting
  const startBackgroundService = useCallback(async () => {
    if (!BackgroundService || backgroundServiceRef.current) return;
    
    try {
      if (Platform.OS === 'android') {
        await BackgroundService.start(backgroundStepTask, {
          ...backgroundServiceOptions,
          taskTitle: i18n.t('background.taskTitle'),
          taskDesc: i18n.t('background.taskDesc'),
        });
        backgroundServiceRef.current = true;
        setIsBackgroundServiceRunning(true);
        console.log('Background step service started');
      }
    } catch (err) {
      console.error('Failed to start background service:', err);
    }
  }, []);

  // Stop background foreground service
  const stopBackgroundService = useCallback(async () => {
    if (!BackgroundService || !backgroundServiceRef.current) return;
    
    try {
      await BackgroundService.stop();
      backgroundServiceRef.current = false;
      setIsBackgroundServiceRunning(false);
      console.log('Background step service stopped');
    } catch (err) {
      console.error('Failed to stop background service:', err);
    }
  }, []);

  // Sync steps from Health Connect or system pedometer
  const syncStepsFromSystem = useCallback(async () => {
    try {
      const dateKey = getDateKey();
      const storageKey = `dailyStats_${dateKey}`;
      const savedStats = await AsyncStorage.getItem(storageKey);
      let currentStats = savedStats ? JSON.parse(savedStats) : {
        steps: 0,
        time: 0,
        calories: 0,
        distance: 0,
        date: dateKey,
      };

      let systemStepsToday = 0;

      if (Platform.OS === 'android') {
        if (healthData.healthConnectAvailable === null) return;
        try {
          if (healthData.healthConnectAvailable === true && healthData.isReady) {
            const hcSteps = await healthData.getTodaySteps();
            if (hcSteps > 0) console.log('Health Connect steps today:', hcSteps);
            const gfSteps = await getGoogleFitTodaySteps();
            if (gfSteps > 0) console.log('Google Fit steps today:', gfSteps);
            systemStepsToday = Math.max(hcSteps || 0, gfSteps || 0);
          } else {
            systemStepsToday = await getGoogleFitTodaySteps();
            if (systemStepsToday > 0) console.log('Google Fit steps today:', systemStepsToday);
          }
        } catch (err) {
          console.warn('Step count not supported on Android:', err?.message ?? err);
          systemStepsToday = 0;
        }
      }
      // iOS: HealthKit when ready, else Pedometer fallback
      else if (Platform.OS === 'ios') {
        if (healthData.isReady) {
          try {
            systemStepsToday = await healthData.getTodaySteps();
            console.log('iOS HealthKit steps today:', systemStepsToday);
          } catch (err) {
            console.warn('HealthKit step count failed:', err?.message ?? err);
          }
        } else {
          const pedometerAvailable = await Pedometer.isAvailableAsync();
          if (pedometerAvailable) {
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const now = new Date();
            try {
              const stepResult = await Pedometer.getStepCountAsync(startOfDay, now);
              systemStepsToday = stepResult?.steps ?? 0;
              console.log('iOS Pedometer steps today:', systemStepsToday);
            } catch (err) {
              console.log('iOS getStepCountAsync failed:', err.message);
            }
          }
        }
      }

      if (healthData.isReady) {
        try {
          const { weightKg, heightCm } = await healthService.getBodyProfile();
          const next = { ...bodyProfileRef.current };
          if (weightKg != null && Number.isFinite(weightKg) && weightKg > 20 && weightKg < 400) {
            next.weightKg = weightKg;
            await AsyncStorage.setItem('userBodyWeightKg', String(weightKg));
          }
          if (heightCm != null && Number.isFinite(heightCm) && heightCm > 40 && heightCm < 260) {
            next.heightCm = heightCm;
            await AsyncStorage.setItem('userBodyHeightCm', String(heightCm));
          }
          bodyProfileRef.current = next;
          setBodyProfile(next);
        } catch (_) {}
      }

      if (systemStepsToday <= 0) return;

      const prevSteps = currentStats.steps || 0;
      
      // Only update if system has MORE steps (Health Connect tracks all day)
      if (systemStepsToday <= prevSteps) {
        console.log('No new steps:', systemStepsToday, 'vs saved', prevSteps);
        return;
      }

      console.log('Updating steps from system:', prevSteps, '->', systemStepsToday);
      
      const w = bodyProfileRef.current.weightKg;
      const h = bodyProfileRef.current.heightCm;
      const newCalories = calculateWalkingCaloriesFromSteps(systemStepsToday, w, h);
      const newDistance = calculateDistanceFromSteps(systemStepsToday, h);

      const updatedStats = {
        ...currentStats,
        steps: systemStepsToday,
        calories: newCalories,
        distance: newDistance,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(storageKey, JSON.stringify(updatedStats));
      setDailyStats(updatedStats);
      setStepCount(systemStepsToday);

      if (systemStepsToday > prevSteps) {
        const totalStatsKey = 'totalStats';
        const savedTotal = await AsyncStorage.getItem(totalStatsKey);
        let totalStats = savedTotal ? JSON.parse(savedTotal) : { steps: 0, time: 0, calories: 0, distance: 0 };
        const stepDiff = systemStepsToday - prevSteps;
        totalStats.steps += stepDiff;
        totalStats.calories = newCalories;
        totalStats.distance = newDistance;
        await AsyncStorage.setItem(totalStatsKey, JSON.stringify(totalStats));
        setTotalStats(totalStats);
      }
    } catch (err) {
      console.error('syncStepsFromSystem error:', err);
    }
  }, [
    healthData.isReady,
    healthData.getTodaySteps,
    healthData.healthConnectAvailable,
  ]);

  // On mount: do NOT call healthData.init() here — it triggers requestPermissions() which crashes
  // (HealthConnectPermissionDelegate.requestPermission not yet set by MainActivity). Permission
  // is requested only when user taps "Подключить шаги"; restore of existing permission is done in useHealthData.
  useEffect(() => {
    const initialize = async () => {
      try {
        await requestActivityPermission();
        loadData();
        initializeBackgroundFetch();
        fetchBackendData();
      } catch (err) {
        console.error('AppContext initialize error:', err);
      }
    };
    initialize();
  }, [requestActivityPermission]);

  // Load today's stats, then sync from system (catch so unhandled rejection doesn't crash the app)
  useEffect(() => {
    const initSteps = async () => {
      try {
        const hasPermission = await requestActivityPermission();
        if (hasPermission) {
          await loadTodayStats();
          setTimeout(() => syncStepsFromSystem(), 500);
        }
      } catch (err) {
        console.error('AppContext initSteps error:', err);
      }
    };
    initSteps();
  }, [syncStepsFromSystem, requestActivityPermission]);

  // When app comes to foreground, sync steps immediately and once more after delay (Samsung Health → Health Connect may need a moment).
  useEffect(() => {
    let delayTimer = null;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncStepsFromSystem();
        if (delayTimer) clearTimeout(delayTimer);
        delayTimer = setTimeout(syncStepsFromSystem, 2000);
      }
    });
    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      sub?.remove();
    };
  }, [syncStepsFromSystem]);

  useEffect(() => {
    dateCheckIntervalRef.current = setInterval(() => {
      const currentDateKey = getDateKey();
      if (currentDateKey !== lastDateRef.current) {
        lastDateRef.current = currentDateKey;
        resetDailyStatsForNewDay();
      }
    }, 60000);

    return () => {
      if (dateCheckIntervalRef.current) {
        clearInterval(dateCheckIntervalRef.current);
        dateCheckIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
        timeIntervalRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      if (dateCheckIntervalRef.current) {
        clearInterval(dateCheckIntervalRef.current);
        dateCheckIntervalRef.current = null;
      }
    };
  }, []);

  // ── Backend sync ──

  const fetchBackendData = async () => {
    try {
      const wallet = await getWallet();
      setWalletBalance(wallet.balance || '0.00');
    } catch {
      // offline or not authed yet
    }
  };

  const convertStepsToCoins = async () => {
    const stats = dailyStats ?? defaultDailyStats;
    if (!stats || stats.steps < 1) return null;
    setIsSyncing(true);
    try {
      const result = await apiConvertSteps(stats.steps);
      setWalletBalance(result.new_balance);
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshWallet = async () => {
    try {
      const wallet = await getWallet();
      setWalletBalance(wallet.balance || '0.00');
      return wallet;
    } catch {
      return null;
    }
  };

  // ── Existing local logic (unchanged) ──

  const initializeBackgroundFetch = async () => {
    try {
      const bgStatus = await BackgroundFetch.getStatusAsync();
      if (bgStatus === BackgroundFetch.BackgroundFetchStatus.Available) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_STEP_TASK, {
          minimumInterval: BACKGROUND_FETCH_INTERVAL_SEC,
          stopOnTerminate: false,
          startOnBoot: true,
        });
      }
    } catch {
      // silently ignore in dev
    }
  };

  const loadTodayStats = async () => {
    try {
      const dateKey = getDateKey();
      lastDateRef.current = dateKey;
      const storageKey = `dailyStats_${dateKey}`;
      const savedStats = await AsyncStorage.getItem(storageKey);

      if (savedStats) {
        const stats = JSON.parse(savedStats);
        setDailyStats(stats);
        setStepCount(stats.steps || 0);
      } else {
        const newStats = {
          steps: 0,
          time: 0,
          calories: 0,
          distance: 0,
          date: dateKey,
        };
        setDailyStats(newStats);
        await saveData(storageKey, newStats);
      }
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  };

  const loadData = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('trackingHistory');
      const savedTotal = await AsyncStorage.getItem('totalStats');
      const savedWeekly = await AsyncStorage.getItem('weeklyProgress');

      if (savedHistory) setTrackingHistory(JSON.parse(savedHistory));
      if (savedTotal) setTotalStats(JSON.parse(savedTotal));
      if (savedWeekly) setWeeklyProgress(JSON.parse(savedWeekly));

      await loadWeeklyProgress();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadWeeklyProgress = async () => {
    try {
      const today = new Date();
      const week = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = getDateKey(date);
        const storageKey = `dailyStats_${dateKey}`;
        const savedStats = await AsyncStorage.getItem(storageKey);

        if (savedStats) {
          const stats = JSON.parse(savedStats);
          week.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.getDate(),
            steps: stats.steps || 0,
          });
        } else {
          week.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.getDate(),
            steps: 0,
          });
        }
      }

      setWeeklyProgress(week);
      await saveData('weeklyProgress', week);
    } catch (error) {
      console.error('Error loading weekly progress:', error);
    }
  };

  const saveData = async (key, data) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const startStepTracking = async () => {
    if (isTracking) return true;

    // Ensure permission is granted before starting
    const hasPermission = await requestActivityPermission();
    if (!hasPermission) {
      console.warn('Activity permission not granted');
      Alert.alert(
        i18n.t('permissions.noPermissionTitle'),
        i18n.t('permissions.noPermissionMessage')
      );
      return false;
    }

    const isAvailable = await Pedometer.isAvailableAsync();
    console.log('Pedometer available:', isAvailable);

    const healthBackedSteps =
      healthData.isReady ||
      (Platform.OS === 'android' && healthData.healthConnectAvailable === true);
    if (!isAvailable && !healthBackedSteps) {
      console.warn('Pedometer is not available');
      Alert.alert(
        i18n.t('permissions.pedometerNoDeviceTitle'),
        i18n.t('permissions.pedometerNoDeviceMessage')
      );
      return false;
    }

    setIsTracking(true);
    setTrackingStartTime(new Date());
    const startTime = new Date();

    // Start background foreground service for continuous step counting (Android)
    if (Platform.OS === 'android') {
      startBackgroundService();
    }

    // On Android with Health Connect: Pedometer conflicts with syncStepsFromSystem (overwrites 1354 with ~10).
    // Skip Pedometer, rely only on syncStepsFromSystem interval.
    const usePedometer = Platform.OS !== 'android' || !healthData.isReady;

    stepsAtSubscriptionStartRef.current = dailyStatsRef.current?.steps ?? 0;

    const sub = usePedometer ? Pedometer.watchStepCount((result) => {
      const baseSteps = stepsAtSubscriptionStartRef.current;
      const newSteps = baseSteps + (result?.steps ?? 0);
      if (newSteps > 0) console.log('Live step update:', newSteps);

      setDailyStats((prev) => {
        const safePrev = prev ?? defaultDailyStats;
        const steps = baseSteps + (result?.steps ?? 0);
        const bp = bodyProfileRef.current;
        const newDistance = calculateDistanceFromSteps(steps, bp.heightCm);
        const newCalories = calculateWalkingCaloriesFromSteps(steps, bp.weightKg, bp.heightCm);

        const newStats = {
          ...safePrev,
          steps,
          distance: newDistance,
          calories: newCalories,
          lastUpdated: new Date().toISOString(),
        };

        const dateKey = getDateKey();
        const storageKey = `dailyStats_${dateKey}`;
        saveData(storageKey, newStats);

        return newStats;
      });

      setStepCount(baseSteps + (result?.steps ?? 0));
    }) : null;
    
    subscriptionRef.current = sub;
    setSubscription(sub);
    if (usePedometer) console.log('Step tracking subscription started');

    // Time elapsed (active walking) – update every minute
    timeIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((new Date() - startTime) / 1000 / 60);
      const timeHours = elapsed / 60;

      setDailyStats((prev) => {
        const safePrev = prev ?? defaultDailyStats;
        const bp = bodyProfileRef.current;
        const newCalories = calculateWalkingCaloriesFromSteps(safePrev.steps, bp.weightKg, bp.heightCm);
        const newDistance = calculateDistanceFromSteps(safePrev.steps, bp.heightCm);

        const newStats = {
          ...safePrev,
          time: elapsed,
          calories: newCalories,
          distance: newDistance,
        };

        const dateKey = getDateKey();
        const storageKey = `dailyStats_${dateKey}`;
        saveData(storageKey, newStats);
        return newStats;
      });
    }, 60000);

    // Also try to sync historical steps (works on iOS, may work on some Android)
    syncStepsFromSystem();
    syncIntervalRef.current = setInterval(syncStepsFromSystem, FOREGROUND_SYNC_INTERVAL_MS);

    return true;
  };

  const stopStepTracking = async () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
      setSubscription(null);
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    // Stop background foreground service (Android)
    if (Platform.OS === 'android') {
      await stopBackgroundService();
    }
    
    setTrackingStartTime(null);
    setIsTracking(false);
  };

  const resetDailyStats = () => {
    const dateKey = getDateKey();
    const resetStats = {
      steps: 0,
      time: 0,
      calories: 0,
      distance: 0,
      date: dateKey,
    };
    setDailyStats(resetStats);
    setStepCount(0);
    const storageKey = `dailyStats_${dateKey}`;
    saveData(storageKey, resetStats);
    if (isTracking) {
      stopStepTracking();
    }
  };

  const resetDailyStatsForNewDay = async () => {
    try {
      const previousDateKey = lastDateRef.current;
      const previousStorageKey = `dailyStats_${previousDateKey}`;
      const previousStats = await AsyncStorage.getItem(previousStorageKey);

      if (previousStats) {
        const stats = JSON.parse(previousStats);
        if (stats.steps > 0 || stats.time > 0) {
          await addTrackingSession({
            ...stats,
            date: previousDateKey,
            id: Date.now().toString(),
          });
        }
      }

      stopStepTracking();

      const dateKey = getDateKey();
      const resetStats = {
        steps: 0,
        time: 0,
        calories: 0,
        distance: 0,
        date: dateKey,
      };
      setDailyStats(resetStats);
      setStepCount(0);
      const storageKey = `dailyStats_${dateKey}`;
      await saveData(storageKey, resetStats);

      await loadWeeklyProgress();

      setTimeout(async () => {
        await startStepTracking();
      }, 1000);
    } catch (error) {
      console.error('Error resetting stats for new day:', error);
    }
  };

  const addTrackingSession = async (session) => {
    const newHistory = [session, ...trackingHistory];
    setTrackingHistory(newHistory);
    await saveData('trackingHistory', newHistory);

    const newTotal = {
      steps: totalStats.steps + session.steps,
      time: totalStats.time + session.time,
      calories: totalStats.calories + session.calories,
      distance: totalStats.distance + session.distance,
    };
    setTotalStats(newTotal);
    await saveData('totalStats', newTotal);
  };

  const updateWeeklyProgress = async (weekData) => {
    setWeeklyProgress(weekData);
    await saveData('weeklyProgress', weekData);
  };

  const getHistoricalStats = async (date) => {
    try {
      const dateKey = getDateKey(date);
      const storageKey = `dailyStats_${dateKey}`;
      const savedStats = await AsyncStorage.getItem(storageKey);
      return savedStats ? JSON.parse(savedStats) : null;
    } catch (error) {
      console.error('Error getting historical stats:', error);
      return null;
    }
  };

  const value = {
    stepCount,
    isTracking,
    dailyStats: dailyStats ?? defaultDailyStats,
    weeklyProgress,
    trackingHistory,
    totalStats,
    currentRoute,
    isTrackingRoute,
    startStepTracking,
    stopStepTracking,
    resetDailyStats,
    addTrackingSession,
    updateWeeklyProgress,
    setCurrentRoute,
    setIsTrackingRoute,
    getHistoricalStats,
    // permissions
    requestActivityPermission,
    activityPermissionGranted,
    // Health (Health Connect / HealthKit)
    healthConnectReady: healthData.isReady,
    useHealthConnect: healthData.isAvailable,
    initHealthConnect: healthData.init,
    requestHealthConnectPermission: healthData.retryInit,
    openHealthConnectSettings: healthData.openSettings,
    openSamsungHealth: healthData.openSamsungHealth,
    needsHealthConnectScreen: healthData.needsHealthConnectScreen,
    healthConnectAvailable: healthData.healthConnectAvailable,
    refreshHealthConnectStatus: healthData.refreshHealthConnectStatus,
    healthConnectPlayUrl: healthData.healthConnectPlayUrl,
    syncStepsFromSystem,
    // background service
    isBackgroundServiceRunning,
    startBackgroundService,
    stopBackgroundService,
    // backend-connected
    walletBalance,
    isSyncing,
    convertStepsToCoins,
    refreshWallet,
    fetchBackendData,
  };

  if (healthData.isCheckingHealthConnect) {
    return (
      <AppContext.Provider value={value}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
          <ActivityIndicator size="large" color="#8140F3" />
        </View>
      </AppContext.Provider>
    );
  }
  // 1) HC not installed → install screen
  // 2) HC installed but no permission → onboarding "Подключить шаги"
  // 3) else → main app
  const showStepsOnboarding =
    healthData.isAvailable &&
    healthData.healthConnectAvailable === true &&
    !healthData.isReady &&
    (Platform.OS === 'android' || Platform.OS === 'ios');

  return (
    <AppContext.Provider value={value}>
      {healthData.needsHealthConnectScreen ? (
        <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}><ActivityIndicator size="large" color="#8140F3" /></View>}>
          <HealthConnectRequiredScreen />
        </Suspense>
      ) : showStepsOnboarding ? (
        <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}><ActivityIndicator size="large" color="#8140F3" /></View>}>
          <StepsOnboardingScreen />
        </Suspense>
      ) : (
        children
      )}
    </AppContext.Provider>
  );
};
