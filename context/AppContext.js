import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, lazy, Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, View } from 'react-native';
import BodyProfileModal from '../components/BodyProfileModal';
import { useHealthData } from '../hooks/useHealthData';
import {
  convertSteps as apiConvertSteps,
  getTokens,
  getWallet,
  syncActivity as apiSyncActivity,
} from '../services/apiService';
import * as healthService from '../services/healthService';
import {
  calculateDistanceFromSteps,
  calculateWalkingCaloriesFromSteps,
  getDateKey
} from '../utils/calculations';
import i18n from '../i18n/config';
// Lazy to avoid require cycle: AppContext -> HealthConnectRequiredScreen -> useApp (AppContext)
const HealthConnectRequiredScreen = lazy(() => import('../screens/HealthConnectRequiredScreen'));
const StepsOnboardingScreen = lazy(() => import('../screens/StepsOnboardingScreen'));

const FOREGROUND_SYNC_INTERVAL_MS = 30 * 1000; // 30 seconds when app is active
const ACTIVITY_PUSH_DEBOUNCE_MS = 12 * 1000;
const STORAGE_USER_BODY_PROFILE_DISMISSED = 'userBodyProfilePromptDismissed';
/** Persisted calendar day for detecting overnight gap when app was closed. */
const CALENDAR_ROLLOVER_STORAGE_KEY = 'walkpoint_last_activity_calendar_date';
/**
 * On local calendar day change: POST /activity/sync/ then /activity/convert/ for the completed day.
 * Disable if you only want manual exchange from Profile.
 */
const AUTO_FINALIZE_PREVIOUS_DAY_ON_SERVER = true;

/** Matches backend ActivitySource (health_connect | pedometer | ios_health | unknown). */
const activitySourceFromSystemSync = (platform, usedHealthKitOrHc) => {
  if (usedHealthKitOrHc) {
    return platform === 'ios' ? 'ios_health' : 'health_connect';
  }
  if (platform === 'ios') return 'pedometer';
  return 'unknown';
};

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
  bodyProfile: { weightKg: 75, heightCm: null },
  openBodyProfileEditor: () => {},
};

const AppContext = createContext(DEFAULT_APP_VALUE);

export const useApp = () => useContext(AppContext) ?? DEFAULT_APP_VALUE;

export const AppProvider = ({ children }) => {
  const [stepCount, setStepCount] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStartTime, setTrackingStartTime] = useState(null);
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
  const [bodyProfile, setBodyProfile] = useState({ weightKg: 75, heightCm: null });
  const bodyProfileRef = useRef({ weightKg: 75, heightCm: null });
  const [bodyProfileStorageLoaded, setBodyProfileStorageLoaded] = useState(false);
  const [showBodyProfileModal, setShowBodyProfileModal] = useState(false);
  const bodyProfileModalManualOpenRef = useRef(false);
  const syncIntervalRef = useRef(null);
  const dateCheckIntervalRef = useRef(null);
  const lastDateRef = useRef(getDateKey());
  const dailyStatsRef = useRef(defaultDailyStats);
  const lastActivityPushRef = useRef({ date: '', steps: -1 });
  const activityPushTimerRef = useRef(null);
  const resetDailyStatsForNewDayRef = useRef(async (_previousDateKey) => {});
  const syncStepsInFlightRef = useRef(false);
  const rolloverInProgressRef = useRef(false);
  const [activityPermissionGranted, setActivityPermissionGranted] = useState(true); // Always true now
  const [isBackgroundServiceRunning] = useState(false);

  const healthData = useHealthData();

  const refreshBodyProfileFromHealth = useCallback(async () => {
    if (!healthData.isReady) return;
    try {
      const { weightKg, heightCm } = await healthService.getBodyProfile();
      const prev = { ...bodyProfileRef.current };
      const next = { ...bodyProfileRef.current };
      let changed = false;
      if (weightKg != null && Number.isFinite(weightKg) && weightKg > 20 && weightKg < 400) {
        next.weightKg = weightKg;
        await AsyncStorage.setItem('userBodyWeightKg', String(weightKg));
        changed = true;
      }
      if (heightCm != null && Number.isFinite(heightCm) && heightCm > 40 && heightCm < 260) {
        next.heightCm = heightCm;
        await AsyncStorage.setItem('userBodyHeightCm', String(heightCm));
        changed = true;
      }
      if (changed) {
        bodyProfileRef.current = next;
        setBodyProfile(next);
        const hadHeight =
          prev.heightCm != null && Number.isFinite(prev.heightCm) && prev.heightCm > 40;
        if (
          !hadHeight &&
          next.heightCm != null &&
          Number.isFinite(next.heightCm) &&
          next.heightCm > 40
        ) {
          setShowBodyProfileModal(false);
        }
      }
    } catch (_) {}
  }, [healthData.isReady]);

  dailyStatsRef.current = dailyStats ?? defaultDailyStats;

  // POST /activity/sync/ only — never calls /activity/convert/ (exchange is manual on Profile).
  const pushActivityToBackend = useCallback(async (stats, source) => {
    try {
      const tokens = await getTokens();
      if (!tokens?.access) return;
      const date = stats.date || getDateKey();
      const steps = Math.max(0, Math.floor(stats.steps ?? 0));
      if (lastActivityPushRef.current.date === date && lastActivityPushRef.current.steps === steps) return;

      const distanceKm = Number(stats.distance) || 0;
      const payload = {
        date,
        steps,
        calories: stats.calories != null ? Math.round(Number(stats.calories)) : undefined,
        distance_m: distanceKm > 0 ? Math.round(distanceKm * 1000) : undefined,
        duration_sec:
          stats.time != null && Number(stats.time) > 0
            ? Math.round(Number(stats.time) * 60)
            : undefined,
        source,
      };

      await apiSyncActivity(payload);
      lastActivityPushRef.current = { date, steps };
    } catch (err) {
      console.warn('pushActivityToBackend:', err?.message ?? err);
    }
  }, []);

  const scheduleDebouncedActivityPush = useCallback(
    (source) => {
      if (activityPushTimerRef.current) clearTimeout(activityPushTimerRef.current);
      activityPushTimerRef.current = setTimeout(() => {
        activityPushTimerRef.current = null;
        const stats = dailyStatsRef.current;
        if (!stats || (stats.steps ?? 0) < 1) return;
        void pushActivityToBackend(stats, source);
      }, ACTIVITY_PUSH_DEBOUNCE_MS);
    },
    [pushActivityToBackend],
  );

  /** End-of-day: sync + convert for a completed calendar day (yesterday). */
  const finalizePreviousCalendarDayOnServer = useCallback(
    async (previousDateKey, stats) => {
      if (!AUTO_FINALIZE_PREVIOUS_DAY_ON_SERVER || !previousDateKey || !stats) return;
      try {
        const tokens = await getTokens();
        if (!tokens?.access) return;
        const steps = Math.max(0, Math.floor(stats.steps ?? 0));
        if (steps < 1) return;

        const usedNative =
          Platform.OS === 'ios'
            ? healthData.isReady
            : Platform.OS === 'android' &&
              healthData.healthConnectAvailable === true &&
              healthData.isReady;
        const source = activitySourceFromSystemSync(Platform.OS, usedNative);
        const distanceKm = Number(stats.distance) || 0;
        const payload = {
          date: previousDateKey,
          steps,
          calories: stats.calories != null ? Math.round(Number(stats.calories)) : undefined,
          distance_m: distanceKm > 0 ? Math.round(distanceKm * 1000) : undefined,
          duration_sec:
            stats.time != null && Number(stats.time) > 0
              ? Math.round(Number(stats.time) * 60)
              : undefined,
          source,
        };

        await apiSyncActivity(payload);
        const result = await apiConvertSteps(payload);
        const bal = result?.new_balance ?? result?.balance;
        if (bal != null && bal !== '') setWalletBalance(String(bal));
        lastActivityPushRef.current = { date: previousDateKey, steps };
      } catch (err) {
        console.warn('finalizePreviousCalendarDayOnServer:', err?.message ?? err);
      }
    },
    [healthData.isReady, healthData.healthConnectAvailable],
  );

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
      } catch (_) {
      } finally {
        setBodyProfileStorageLoaded(true);
      }
    })();
  }, []);

  // ── Wallet / backend state ──
  const [walletBalance, setWalletBalance] = useState('0.00');
  const [isSyncing, setIsSyncing] = useState(false);

  // Steps come from Health Connect / Apple Health only.
  const requestActivityPermission = useCallback(async () => {
    setActivityPermissionGranted(true);
    return true;
  }, []);

  // Sync steps from Health Connect or Apple Health
  const syncStepsFromSystem = useCallback(async () => {
    if (syncStepsInFlightRef.current) return;
    syncStepsInFlightRef.current = true;
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
      let usedHealthNative = false;

      if (Platform.OS === 'android') {
        if (healthData.healthConnectAvailable === null) return;
        try {
          if (healthData.healthConnectAvailable === true && healthData.isReady) {
            const hcSteps = await healthData.getTodaySteps();
            if (hcSteps > 0) console.log('Health Connect steps today:', hcSteps);
            systemStepsToday = hcSteps || 0;
            usedHealthNative = true;
          }
        } catch (err) {
          console.warn('Health Connect sync failed:', err?.message ?? err);
          systemStepsToday = 0;
        }
      }
      else if (Platform.OS === 'ios') {
        if (healthData.isReady) {
          try {
            systemStepsToday = await healthData.getTodaySteps();
            usedHealthNative = true;
            console.log('iOS HealthKit steps today:', systemStepsToday);
          } catch (err) {
            console.warn('HealthKit step count failed:', err?.message ?? err);
          }
        }
      }

      await refreshBodyProfileFromHealth();

      if (systemStepsToday <= 0) return;

      const prevSteps = currentStats.steps || 0;
      
      if (systemStepsToday <= prevSteps) {
        console.log('No new steps:', systemStepsToday, 'vs saved', prevSteps);
        return;
      }

      console.log('Updating steps from system:', prevSteps, '->', systemStepsToday);
      
      const w = bodyProfileRef.current.weightKg;
      const h = bodyProfileRef.current.heightCm;
      const newCalories = calculateWalkingCaloriesFromSteps(systemStepsToday, w, h);
      const newDistance = calculateDistanceFromSteps(systemStepsToday, h);
      
      // Calculate time based on steps (approx 100 steps per minute)
      const newTime = Math.round(systemStepsToday / 100);

      const updatedStats = {
        ...currentStats,
        steps: systemStepsToday,
        time: newTime,
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
        totalStats.time = newTime;
        totalStats.calories = newCalories;
        totalStats.distance = newDistance;
        await AsyncStorage.setItem(totalStatsKey, JSON.stringify(totalStats));
        setTotalStats(totalStats);
      }

      const syncSource = activitySourceFromSystemSync(Platform.OS, usedHealthNative);
      void pushActivityToBackend(updatedStats, syncSource);
    } catch (err) {
      console.error('syncStepsFromSystem error:', err);
    } finally {
      syncStepsInFlightRef.current = false;
    }
  }, [
    healthData.isReady,
    healthData.getTodaySteps,
    healthData.healthConnectAvailable,
    pushActivityToBackend,
    refreshBodyProfileFromHealth,
  ]);

  const saveUserBodyProfile = useCallback(
    async (weightKg, heightCm) => {
      const w = Number(weightKg);
      const h = Number(heightCm);
      if (!Number.isFinite(w) || w < 20 || w > 400 || !Number.isFinite(h) || h < 40 || h > 260) return;
      try {
        await AsyncStorage.setItem('userBodyWeightKg', String(w));
        await AsyncStorage.setItem('userBodyHeightCm', String(h));
        await AsyncStorage.setItem(STORAGE_USER_BODY_PROFILE_DISMISSED, '1');
        const next = { weightKg: w, heightCm: h };
        bodyProfileRef.current = next;
        setBodyProfile(next);
        bodyProfileModalManualOpenRef.current = false;
        setShowBodyProfileModal(false);

        const dateKey = getDateKey();
        const storageKey = `dailyStats_${dateKey}`;
        const stats = dailyStatsRef.current ?? defaultDailyStats;
        const steps = stats.steps ?? 0;
        if (steps > 0) {
          const newCalories = calculateWalkingCaloriesFromSteps(steps, w, h);
          const newDistance = calculateDistanceFromSteps(steps, h);
          const updated = {
            ...stats,
            calories: newCalories,
            distance: newDistance,
            lastUpdated: new Date().toISOString(),
          };
          await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
          setDailyStats(updated);
          const savedTotal = await AsyncStorage.getItem('totalStats');
          let total = savedTotal ? JSON.parse(savedTotal) : { steps: 0, time: 0, calories: 0, distance: 0 };
          total.calories = newCalories;
          total.distance = newDistance;
          await AsyncStorage.setItem('totalStats', JSON.stringify(total));
          setTotalStats(total);
        }
        scheduleDebouncedActivityPush('unknown');
      } catch (err) {
        console.warn('saveUserBodyProfile:', err?.message ?? err);
      }
    },
    [scheduleDebouncedActivityPush],
  );

  const dismissBodyProfilePrompt = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_USER_BODY_PROFILE_DISMISSED, '1');
    } catch (_) {}
    setShowBodyProfileModal(false);
  }, []);

  const closeBodyProfileModalOnly = useCallback(() => {
    bodyProfileModalManualOpenRef.current = false;
    setShowBodyProfileModal(false);
  }, []);

  const handleBodyProfileLater = useCallback(async () => {
    if (bodyProfileModalManualOpenRef.current) {
      closeBodyProfileModalOnly();
      return;
    }
    await dismissBodyProfilePrompt();
  }, [closeBodyProfileModalOnly, dismissBodyProfilePrompt]);

  const openBodyProfileEditor = useCallback(() => {
    bodyProfileModalManualOpenRef.current = true;
    setShowBodyProfileModal(true);
  }, []);

  useEffect(() => {
    if (!bodyProfileStorageLoaded) return;
    if (healthData.isCheckingHealthConnect) return;

    const onboardingBlocking =
      healthData.needsHealthConnectScreen ||
      (healthData.isAvailable &&
        healthData.healthConnectAvailable === true &&
        !healthData.isReady &&
        (Platform.OS === 'android' || Platform.OS === 'ios'));

    if (onboardingBlocking) return;

    let cancelled = false;
    (async () => {
      try {
        const dismissed = await AsyncStorage.getItem(STORAGE_USER_BODY_PROFILE_DISMISSED);
        if (cancelled || dismissed === '1') return;
        if (healthData.isReady) {
          await refreshBodyProfileFromHealth();
        }
        if (cancelled) return;
        const h = bodyProfileRef.current.heightCm;
        if (h != null && Number.isFinite(h) && h > 40) return;
        bodyProfileModalManualOpenRef.current = false;
        setShowBodyProfileModal(true);
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [
    bodyProfileStorageLoaded,
    healthData.isCheckingHealthConnect,
    healthData.isReady,
    healthData.isAvailable,
    healthData.healthConnectAvailable,
    healthData.needsHealthConnectScreen,
    refreshBodyProfileFromHealth,
  ]);

  // On mount: do NOT call healthData.init() here — it triggers requestPermissions() which crashes
  // (HealthConnectPermissionDelegate.requestPermission not yet set by MainActivity). Permission
  // is requested only when user taps "Подключить шаги"; restore of existing permission is done in useHealthData.
  useEffect(() => {
    const initialize = async () => {
      try {
        await requestActivityPermission();
        loadData();
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
        const today = getDateKey();
        const stored = await AsyncStorage.getItem(CALENDAR_ROLLOVER_STORAGE_KEY);
        if (!stored) {
          await AsyncStorage.setItem(CALENDAR_ROLLOVER_STORAGE_KEY, today);
          lastDateRef.current = today;
        } else if (stored !== today) {
          await resetDailyStatsForNewDayRef.current(stored);
          lastDateRef.current = today;
        } else {
          lastDateRef.current = today;
        }

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
        const today = getDateKey();
        if (today !== lastDateRef.current) {
          const previousDateKey = lastDateRef.current;
          lastDateRef.current = today;
          void resetDailyStatsForNewDayRef.current(previousDateKey);
        }
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
        const previousDateKey = lastDateRef.current;
        lastDateRef.current = currentDateKey;
        void resetDailyStatsForNewDayRef.current(previousDateKey);
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
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      if (dateCheckIntervalRef.current) {
        clearInterval(dateCheckIntervalRef.current);
        dateCheckIntervalRef.current = null;
      }
      if (activityPushTimerRef.current) {
        clearTimeout(activityPushTimerRef.current);
        activityPushTimerRef.current = null;
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
    const usedNative =
      Platform.OS === 'ios'
        ? healthData.isReady
        : Platform.OS === 'android' &&
          healthData.healthConnectAvailable === true &&
          healthData.isReady;
    const source = activitySourceFromSystemSync(Platform.OS, usedNative);
    setIsSyncing(true);
    try {
      const result = await apiConvertSteps({
        steps: Math.floor(stats.steps),
        date: stats.date || getDateKey(),
        calories: stats.calories != null ? Math.round(Number(stats.calories)) : undefined,
        distance_m:
          stats.distance != null && Number(stats.distance) > 0
            ? Math.round(Number(stats.distance) * 1000)
            : undefined,
        duration_sec:
          stats.time != null && Number(stats.time) > 0
            ? Math.round(Number(stats.time) * 60)
            : undefined,
        source,
      });
      const bal = result?.new_balance ?? result?.balance;
      if (bal != null && bal !== '') setWalletBalance(String(bal));
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshWallet = useCallback(async () => {
    try {
      const wallet = await getWallet();
      setWalletBalance(wallet.balance || '0.00');
      return wallet;
    } catch {
      return null;
    }
  }, []);

  // ── Existing local logic (unchanged) ──

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

    setIsTracking(true);
    setTrackingStartTime(new Date());

    syncStepsFromSystem();
    syncIntervalRef.current = setInterval(syncStepsFromSystem, FOREGROUND_SYNC_INTERVAL_MS);

    return true;
  };

  const stopStepTracking = async () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
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

  const resetDailyStatsForNewDay = async (previousDateKey) => {
    if (!previousDateKey) return;
    if (rolloverInProgressRef.current) return;
    rolloverInProgressRef.current = true;
    try {
      const curCal = await AsyncStorage.getItem(CALENDAR_ROLLOVER_STORAGE_KEY);
      if (curCal != null && curCal !== previousDateKey) {
        lastDateRef.current = getDateKey();
        return;
      }

      if (activityPushTimerRef.current) {
        clearTimeout(activityPushTimerRef.current);
        activityPushTimerRef.current = null;
      }
      lastActivityPushRef.current = { date: '', steps: -1 };

      const previousStorageKey = `dailyStats_${previousDateKey}`;
      const previousStats = await AsyncStorage.getItem(previousStorageKey);

      if (previousStats) {
        const stats = JSON.parse(previousStats);
        if (stats.steps > 0 || stats.time > 0) {
          await finalizePreviousCalendarDayOnServer(previousDateKey, stats);
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

      try {
        await AsyncStorage.setItem(CALENDAR_ROLLOVER_STORAGE_KEY, dateKey);
      } catch (_) {}

      await loadWeeklyProgress();

      setTimeout(async () => {
        await startStepTracking();
      }, 1000);
    } catch (error) {
      console.error('Error resetting stats for new day:', error);
    } finally {
      rolloverInProgressRef.current = false;
    }
  };
  resetDailyStatsForNewDayRef.current = resetDailyStatsForNewDay;

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
    // background service (disabled)
    isBackgroundServiceRunning,
    startBackgroundService: async () => {},
    stopBackgroundService: async () => {},
    // backend-connected
    walletBalance,
    isSyncing,
    convertStepsToCoins,
    refreshWallet,
    fetchBackendData,
    bodyProfile,
    openBodyProfileEditor,
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
        <>
          {children}
          <BodyProfileModal
            visible={showBodyProfileModal}
            initialWeightKg={bodyProfile.weightKg}
            initialHeightCm={bodyProfile.heightCm}
            onSave={saveUserBodyProfile}
            onLater={handleBodyProfileLater}
          />
        </>
      )}
    </AppContext.Provider>
  );
};
