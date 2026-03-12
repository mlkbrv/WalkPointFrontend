import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
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
  authorizeFitnessTracker,
  getTodaySteps as getFitnessTrackerSteps,
  checkFitnessAvailability,
  isTrackerAvailable,
} from '../services/fitnessTrackerService';

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

    try {
      const { getFitnessTrackerSteps: bgGetSteps } = require('../services/fitnessTrackerService');
      const result = await bgGetSteps();
      const newSteps = result.steps || currentStats.steps || 0;

      if (newSteps > (currentStats.steps || 0)) {
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
  
  const [fitnessTrackerReady, setFitnessTrackerReady] = useState(false);
  const [stepDataUnavailable, setStepDataUnavailable] = useState(false);
  const [stepDataUnavailableReason, setStepDataUnavailableReason] = useState(null);
  const fitnessInitializedRef = useRef(false);

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

  const initFitnessTracker = useCallback(async () => {
    if (fitnessInitializedRef.current) return fitnessTrackerReady;
    fitnessInitializedRef.current = true;
    console.log('Initializing FitnessTracker...');

    try {
      const availability = await checkFitnessAvailability();
      console.log('FitnessTracker availability:', availability);

      if (!availability.available) {
        console.log('FitnessTracker not available:', availability.reason);
        setStepDataUnavailable(true);
        setStepDataUnavailableReason(availability.reason);

        if (availability.reason === 'HUAWEI_NOT_SUPPORTED') {
          Alert.alert(
            'Step data unavailable',
            'Huawei Health is not supported. Step counting requires Google Fit (Android) or Apple Health (iOS).',
            [{ text: 'OK', style: 'cancel' }]
          );
        }
        return false;
      }

      const authResult = await authorizeFitnessTracker();
      console.log('FitnessTracker auth result:', authResult);

      if (!authResult.authorized) {
        console.log('FitnessTracker authorization failed:', authResult.reason);
        if (authResult.reason === 'PERMISSION_DENIED') {
          Alert.alert(
            'Permission required',
            'Please allow access to step data in Google Fit (Android) or Apple Health (iOS).',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() },
            ]
          );
        }
        setStepDataUnavailable(true);
        setStepDataUnavailableReason(authResult.reason);
        return false;
      }

      console.log('FitnessTracker ready!');
      setFitnessTrackerReady(true);
      setStepDataUnavailable(false);
      setStepDataUnavailableReason(null);
      return true;
    } catch (err) {
      console.error('Error initializing FitnessTracker:', err);
      setStepDataUnavailable(true);
      setStepDataUnavailableReason('INIT_ERROR');
      return false;
    }
  }, [fitnessTrackerReady]);

  const requestActivityPermission = useCallback(async () => {
    if (permissionRequestedRef.current) return activityPermissionGranted;
    permissionRequestedRef.current = true;

    try {
      await requestNotificationPermission();

      if (Platform.OS === 'android' && Platform.Version >= 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
          {
            title: 'Activity tracking permission',
            message: 'WalkPoint needs access to track your steps and earn rewards.',
            buttonNeutral: 'Ask later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Allow',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Activity recognition permission granted');
          setActivityPermissionGranted(true);
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          Alert.alert(
            'Permission denied',
            'Step counting requires activity tracking permission. Please enable it in app settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openSettings() },
            ]
          );
          setActivityPermissionGranted(false);
          return false;
        } else {
          console.log('Activity recognition permission denied');
          setActivityPermissionGranted(false);
          return false;
        }
      }
      setActivityPermissionGranted(true);
      return true;
    } catch (err) {
      console.error('Error requesting activity permission:', err);
      return false;
    }
  }, [activityPermissionGranted, requestNotificationPermission]);

  const backgroundStepTask = async (taskDataArguments) => {
    const { delay } = taskDataArguments;
    
    await new Promise(async (resolve) => {
      const syncStepsInBackground = async () => {
        try {
          const result = await getFitnessTrackerSteps();
          if (result.error) {
            console.log('Background step sync skipped:', result.error);
            return;
          }

          const systemStepsToday = result.steps || 0;
          if (systemStepsToday <= 0) return;

          const dateKey = getDateKey();
          const storageKey = `dailyStats_${dateKey}`;
          const savedStats = await AsyncStorage.getItem(storageKey);
          let currentStats = savedStats ? JSON.parse(savedStats) : {
            steps: 0, time: 0, calories: 0, distance: 0, date: dateKey,
          };

          if (systemStepsToday > currentStats.steps) {
            const newDistance = calculateDistanceFromSteps(systemStepsToday);
            const updatedStats = {
              ...currentStats,
              steps: systemStepsToday,
              distance: newDistance,
              lastUpdated: new Date().toISOString(),
            };
            await AsyncStorage.setItem(storageKey, JSON.stringify(updatedStats));
            
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

  const syncStepsFromSystem = useCallback(async () => {
    if (!fitnessTrackerReady) {
      console.log('FitnessTracker not ready, skipping sync');
      return;
    }

    try {
      const result = await getFitnessTrackerSteps();
      if (result.error) {
        console.log('syncStepsFromSystem error:', result.error);
        return;
      }

      const systemStepsToday = result.steps || 0;
      if (systemStepsToday <= 0) {
        console.log('No steps from system');
        return;
      }

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

      const prevSteps = currentStats.steps || 0;
      
      if (systemStepsToday <= prevSteps) {
        console.log('No new steps:', systemStepsToday, 'vs saved', prevSteps);
        return;
      }

      console.log('Updating steps from FitnessTracker:', prevSteps, '->', systemStepsToday);
      
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
  }, [fitnessTrackerReady]);

  useEffect(() => {
    const initialize = async () => {
      await requestActivityPermission();
      const ftReady = await initFitnessTracker();
      console.log('FitnessTracker initialization result:', ftReady);
      
      loadData();
      initializeBackgroundFetch();
      fetchBackendData();
    };
    initialize();
  }, [requestActivityPermission, initFitnessTracker]);

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

    if (stepDataUnavailable) {
      console.log('Step data unavailable:', stepDataUnavailableReason);
      return false;
    }

    const hasPermission = await requestActivityPermission();
    if (!hasPermission) {
      console.warn('Activity permission not granted');
      Alert.alert(
        'Permission required',
        'Step counting requires activity tracking permission.'
      );
      return false;
    }

    if (!fitnessTrackerReady) {
      const ftReady = await initFitnessTracker();
      if (!ftReady) {
        console.warn('FitnessTracker not ready');
        return false;
      }
    }

    setIsTracking(true);
    setTrackingStartTime(new Date());
    const startTime = new Date();

    if (Platform.OS === 'android') {
      startBackgroundService();
    }

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
    requestActivityPermission,
    activityPermissionGranted,
    fitnessTrackerReady,
    stepDataUnavailable,
    stepDataUnavailableReason,
    initFitnessTracker,
    syncStepsFromSystem,
    isBackgroundServiceRunning,
    startBackgroundService,
    stopBackgroundService,
    walletBalance,
    isSyncing,
    convertStepsToCoins,
    refreshWallet,
    fetchBackendData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
