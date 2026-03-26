import { Platform } from 'react-native';
import * as healthConnect from './healthConnect';
import * as appleHealth from './appleHealth';

const service = Platform.OS === 'android' ? healthConnect : appleHealth;

export const isAvailable = () => service.isAvailable();
export const checkStatus = () => service.checkStatus();
export const initialize = () => service.initialize();
export const requestPermissions = () => service.requestPermissions();
export const getGrantedPermissions = () => service.getGrantedPermissions();
export const getTodaySteps = () => service.getTodaySteps();
export const getStepsInRange = (startDate, endDate) => service.getStepsInRange(startDate, endDate);
export const openSettings = () => service.openSettings();
export const openSamsungHealth = () => (Platform.OS === 'android' ? healthConnect.openSamsungHealth() : Promise.resolve());
