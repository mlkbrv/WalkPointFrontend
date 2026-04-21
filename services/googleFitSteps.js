import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'walkpoint_google_fit_ok';
const DENIED_UNTIL_KEY = 'walkpoint_google_fit_denied_until';

export async function clearGoogleFitDeniedCooldown() {
  try {
    await AsyncStorage.removeItem(DENIED_UNTIL_KEY);
  } catch (_) {}
}

export async function clearGoogleFitAuthCache() {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, DENIED_UNTIL_KEY]);
  } catch (_) {}
}
