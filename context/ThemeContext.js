import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { buildTheme } from '../constants/theme';

const STORAGE_KEY = '@walkpoint_theme_scheme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [scheme, setSchemeState] = useState('system');
  const [ready, setReady] = useState(false);

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === 'light' || v === 'dark' || v === 'system') setSchemeState(v);
      })
      .finally(() => setReady(true));
  }, []);

  const setScheme = useCallback(async (next) => {
    setSchemeState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const isDark = scheme === 'dark' || (scheme === 'system' && systemScheme === 'dark');
  const theme = useMemo(() => buildTheme(isDark), [isDark]);

  const value = useMemo(
    () => ({ theme, isDark, scheme, setScheme, fontsLoaded: fontsLoaded && ready }),
    [theme, isDark, scheme, setScheme, fontsLoaded, ready],
  );

  if (!fontsLoaded || !ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.screenBg }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: buildTheme(false),
      isDark: false,
      scheme: 'system',
      setScheme: async () => {},
      fontsLoaded: true,
    };
  }
  return ctx;
}
