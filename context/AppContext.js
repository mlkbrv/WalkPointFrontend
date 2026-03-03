import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import { Pedometer } from 'expo-sensors';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Platform, PermissionsAndroid } from 'react-native';
import {
  calculateCaloriesMET,
  calculateDistanceFromSteps,
  getDateKey
} from '../utils/calculations';
import {
  convertSteps as apiConvertSteps,
  getWallet,
} from '../services/apiService';
import {
  isHealthConnectAvailable,
  initializeHealthConnect,
  requestHealthConnectPermissions,
  getTodaySteps as getHealthConnectSteps,
  checkHealthConnectStatus,
  openHealthConnectSettings,
} from '../services/healthConnectService';

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

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

const BACKGROUND_STEP_TASK = 'background-step-tracking';

// Background service configuration for Android foreground service
const backgroundServiceOptions = {
  taskName: 'WalkPoint',
  taskTitle: 'Подсчёт шагов',
  taskDesc: 'WalkPoint считает ваши шаги в фоновом режиме',
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

    const isAvailable = await Pedometer.isAvailableAsync();
    if (isAvailable) {
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

        const timeHours = currentStats.time / 60;
        const newCalories = calculateCaloriesMET(timeHours, 75, 3.5);
        const newDistance = calculateDistanceFromSteps(newSteps);

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
  const [dailyStats, setDailyStats] = useState({
    steps: 0,
    time: 0,
    calories: 0,
    distance: 0,
    date: getDateKey(),
  });
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
  const [userWeight] = useState(75);
  const subscriptionRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const dateCheckIntervalRef = useRef(null);
  const lastDateRef = useRef(getDateKey());
  const [activityPermissionGranted, setActivityPermissionGranted] = useState(false);
  const permissionRequestedRef = useRef(false);
  const [isBackgroundServiceRunning, setIsBackgroundServiceRunning] = useState(false);
  const backgroundServiceRef = useRef(false);
  
  // Health Connect state
  const [healthConnectReady, setHealthConnectReady] = useState(false);
  const [useHealthConnect, setUseHealthConnect] = useState(false);
  const healthConnectInitializedRef = useRef(false);

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

  // Initialize Health Connect (Android only, preferred method for step counting)
  const initHealthConnect = useCallback(async () => {
    if (healthConnectInitializedRef.current) return healthConnectReady;
    if (Platform.OS !== 'android') return false;
    
    healthConnectInitializedRef.current = true;
    console.log('Initializing Health Connect...');

    try {
      // Check if Health Connect is available
      const status = await checkHealthConnectStatus();
      console.log('Health Connect status:', status);
      
      if (!status.available) {
        console.log('Health Connect not available, will use fallback Pedometer');
        Alert.alert(
          'Health Connect недоступен',
          'Для стабильного подсчёта шагов рекомендуется установить Health Connect из Google Play.',
          [
            { text: 'Позже', style: 'cancel' },
            { text: 'Установить', onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata') },
          ]
        );
        return false;
      }

      // Initialize
      const initialized = await initializeHealthConnect();
      if (!initialized) {
        console.log('Failed to initialize Health Connect');
        return false;
      }

      // Request permissions
      const hasPermission = await requestHealthConnectPermissions();
      if (!hasPermission) {
        console.log('Health Connect permissions not granted');
        Alert.alert(
          'Разрешения не предоставлены',
          'Для подсчёта шагов необходимо разрешить доступ к данным о шагах в Health Connect.',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Настройки', onPress: () => openHealthConnectSettings() },
          ]
        );
        return false;
      }

      console.log('Health Connect ready!');
      setHealthConnectReady(true);
      setUseHealthConnect(true);
      return true;
    } catch (err) {
      console.error('Error initializing Health Connect:', err);
      return false;
    }
  }, [healthConnectReady]);

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
            title: 'Разрешение на отслеживание активности',
            message: 'WalkPoint нужен доступ к датчику шагов для подсчёта ваших шагов и начисления наград. Шаги будут считаться даже при выключенном экране.',
            buttonNeutral: 'Спросить позже',
            buttonNegative: 'Отмена',
            buttonPositive: 'Разрешить',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Activity recognition permission granted');
          setActivityPermissionGranted(true);
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Разрешение отклонено',
            'Для подсчёта шагов необходимо разрешение на отслеживание активности. Пожалуйста, включите его в настройках приложения.',
            [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Настройки', onPress: () => Linking.openSettings() },
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
          'Шагомер недоступен',
          'Для подсчёта шагов необходимо разрешить доступ к данным о движении в настройках устройства.',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Настройки', onPress: () => Linking.openSettings() },
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
            const newDistance = calculateDistanceFromSteps(systemStepsToday);
            const updatedStats = {
              ...currentStats,
              steps: systemStepsToday,
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
            await AsyncStorage.setItem('totalStats', JSON.stringify(totalStats));
            
            console.log(`Background sync: ${systemStepsToday} steps`);
          }
        } catch (err) {
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
        await BackgroundService.start(backgroundStepTask, backgroundServiceOptions);
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

      // Try Health Connect first (Android, most reliable)
      if (Platform.OS === 'android' && useHealthConnect && healthConnectReady) {
        console.log('Syncing steps from Health Connect...');
        systemStepsToday = await getHealthConnectSteps();
        console.log('Health Connect steps today:', systemStepsToday);
      } 
      // Fallback to iOS Pedometer
      else if (Platform.OS === 'ios') {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (isAvailable) {
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
      // Android without Health Connect - skip (rely on watchStepCount)
      else if (Platform.OS === 'android') {
        console.log('Android without Health Connect: using watchStepCount only');
        return;
      }

      if (systemStepsToday <= 0) {
        console.log('No steps from system');
        return;
      }

      const prevSteps = currentStats.steps || 0;
      
      // Only update if system has MORE steps (Health Connect tracks all day)
      if (systemStepsToday <= prevSteps) {
        console.log('No new steps:', systemStepsToday, 'vs saved', prevSteps);
        return;
      }

      console.log('Updating steps from system:', prevSteps, '->', systemStepsToday);
      
      const timeHours = (currentStats.time || 0) / 60;
      const newCalories = calculateCaloriesMET(timeHours, 75, 3.5);
      const newDistance = calculateDistanceFromSteps(systemStepsToday);

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
  }, [useHealthConnect, healthConnectReady]);

  // Request permission and initialize on mount
  useEffect(() => {
    const initialize = async () => {
      // First try Health Connect (Android) - best source for steps
      if (Platform.OS === 'android') {
        const hcReady = await initHealthConnect();
        console.log('Health Connect initialization result:', hcReady);
      }
      
      await requestActivityPermission();
      loadData();
      initializeBackgroundFetch();
      fetchBackendData();
    };
    initialize();
  }, [requestActivityPermission, initHealthConnect]);

  // Load today's stats, then sync from system so steps taken while app was closed are applied.
  useEffect(() => {
    const initSteps = async () => {
      const hasPermission = await requestActivityPermission();
      if (hasPermission) {
        await loadTodayStats();
        // Small delay to ensure Health Connect is ready
        setTimeout(() => syncStepsFromSystem(), 500);
      }
    };
    initSteps();
  }, [syncStepsFromSystem, requestActivityPermission]);

  // When app comes to foreground, sync steps from system immediately.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncStepsFromSystem();
    });
    return () => sub?.remove();
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
    if (dailyStats.steps < 1) return null;
    setIsSyncing(true);
    try {
      const result = await apiConvertSteps(dailyStats.steps);
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
        'Нет разрешения',
        'Для подсчёта шагов необходимо разрешение на отслеживание активности.'
      );
      return false;
    }

    const isAvailable = await Pedometer.isAvailableAsync();
    console.log('Pedometer available:', isAvailable);
    
    if (!isAvailable) {
      console.warn('Pedometer is not available');
      Alert.alert(
        'Шагомер недоступен',
        'К сожалению, ваше устройство не поддерживает подсчёт шагов. Убедитесь, что у приложения есть разрешение "Физическая активность".'
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

    // IMPORTANT: Use watchStepCount for LIVE step counting (works on Android!)
    // This counts steps from the moment tracking starts
    const sub = Pedometer.watchStepCount((result) => {
      console.log('Live step update:', result.steps);
      
      setDailyStats((prev) => {
        const newSteps = prev.steps + result.steps;
        const newDistance = calculateDistanceFromSteps(newSteps);
        const timeHours = (prev.time || 0) / 60;
        const newCalories = calculateCaloriesMET(timeHours, userWeight, 3.5);
        
        const newStats = {
          ...prev,
          steps: newSteps,
          distance: newDistance,
          calories: newCalories,
          lastUpdated: new Date().toISOString(),
        };
        
        // Save to storage
        const dateKey = getDateKey();
        const storageKey = `dailyStats_${dateKey}`;
        saveData(storageKey, newStats);
        
        return newStats;
      });
      
      setStepCount((prev) => prev + result.steps);
    });
    
    subscriptionRef.current = sub;
    setSubscription(sub);
    console.log('Step tracking subscription started');

    // Time elapsed (active walking) – update every minute
    timeIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((new Date() - startTime) / 1000 / 60);
      const timeHours = elapsed / 60;

      setDailyStats((prev) => {
        const newCalories = calculateCaloriesMET(timeHours, userWeight, 3.5);
        const newDistance = calculateDistanceFromSteps(prev.steps);

        const newStats = {
          ...prev,
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
    dailyStats,
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
    // Health Connect
    healthConnectReady,
    useHealthConnect,
    initHealthConnect,
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
