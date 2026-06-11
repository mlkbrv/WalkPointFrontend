import { Platform } from 'react-native';
import { DESIGN_PREVIEW } from '../constants/designPreview';
import * as healthConnect from './healthConnect';
import * as appleHealth from './appleHealth';
import * as mock from './healthService.mock';

const service = DESIGN_PREVIEW
  ? mock
  : Platform.OS === 'android'
    ? healthConnect
    : appleHealth;

const emptyMetrics = () => ({
  steps: 0,
  distanceM: 0,
  activeCalories: 0,
  activeMinutes: 0,
});

export const isAvailable = () => service.isAvailable();
export const checkStatus = () => service.checkStatus();
export const initialize = () => service.initialize();
export const requestPermissions = () => service.requestPermissions();
export const getGrantedPermissions = () => service.getGrantedPermissions();
export const getTodaySteps = () => service.getTodaySteps();
export const getStepsInRange = (startDate, endDate) => service.getStepsInRange(startDate, endDate);
export const getTodayDistance = () => (service.getTodayDistance ? service.getTodayDistance() : Promise.resolve(0));
export const getTodayActiveCalories = () =>
  service.getTodayActiveCalories ? service.getTodayActiveCalories() : Promise.resolve(0);
export const getDailyMetrics = () =>
  service.getDailyMetrics ? service.getDailyMetrics() : Promise.resolve(emptyMetrics());
export const getStepsHistory = (days) =>
  service.getStepsHistory ? service.getStepsHistory(days) : Promise.resolve([]);
export const openSettings = () => service.openSettings();
export const openSamsungHealth = () => (Platform.OS === 'android' ? healthConnect.openSamsungHealth() : Promise.resolve());

export const getBodyProfile = async () => {
  if (Platform.OS === 'android') return healthConnect.getBodyProfile();
  if (Platform.OS === 'ios') return appleHealth.getBodyProfile();
  return { weightKg: null, heightCm: null };
};
