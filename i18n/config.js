import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../locales/en.json';
import ru from '../locales/ru.json';

export const LANGUAGE_STORAGE_KEY = 'app_language';

function deviceLanguage() {
  const code = Localization.getLocales?.()?.[0]?.languageCode;
  if (code === 'ru') return 'ru';
  return 'en';
}

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export async function loadStoredLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'en' || saved === 'ru') {
      await i18n.changeLanguage(saved);
    }
  } catch (_) {}
}

export async function setAppLanguage(lang) {
  if (lang !== 'en' && lang !== 'ru') return;
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
