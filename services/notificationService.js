import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { tierCoinsForSteps, stepsToReachMin } from '../utils/tierCoins';

const PREFS_KEY = 'walkpoint_notification_prefs';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const getNotificationPrefs = async () => {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  return raw
    ? JSON.parse(raw)
    : { eveningReminder: true, claimReminder: true };
};

export const saveNotificationPrefs = async (prefs) => {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
};

export const requestNotificationPermission = async () => {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleDailyReminders = async (steps, isConverted) => {
  const prefs = await getNotificationPrefs();
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.eveningReminder && !prefs.claimReminder) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const evening = new Date();
  evening.setHours(20, 0, 0, 0);
  if (evening < new Date()) evening.setDate(evening.getDate() + 1);

  if (prefs.eveningReminder) {
    const left = stepsToReachMin(steps);
    if (left > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'WalkPoint',
          body: `${left} steps left to reach 5000 today`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: evening },
      });
    }
  }

  if (prefs.claimReminder && steps >= 5000 && !isConverted) {
    const coins = tierCoinsForSteps(steps);
    const claimTime = new Date();
    claimTime.setHours(21, 30, 0, 0);
    if (claimTime < new Date()) claimTime.setDate(claimTime.getDate() + 1);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'WalkPoint',
        body: `Claim about ${coins} coins for today`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: claimTime },
    });
  }
};
