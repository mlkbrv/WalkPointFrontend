import Constants from 'expo-constants';
import { Platform } from 'react-native';

const envFlag = process.env.EXPO_PUBLIC_DESIGN_PREVIEW;

/**
 * Expo Go / web: skip Health Connect, HealthKit, custom step-counter module.
 * Login, wallet, and activity still use the real API (set EXPO_PUBLIC_DEV_API_HOST).
 */
export const DESIGN_PREVIEW =
  envFlag === 'true' ||
  envFlag === '1' ||
  (envFlag !== 'false' &&
    envFlag !== '0' &&
    (Constants.appOwnership === 'expo' || Platform.OS === 'web'));
