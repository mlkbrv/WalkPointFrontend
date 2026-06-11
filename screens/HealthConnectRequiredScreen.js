import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function HealthConnectRequiredScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { refreshHealthConnectStatus, healthConnectPlayUrl } = useApp();

  const handleInstall = () => {
    const url = healthConnectPlayUrl || 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';
    Linking.openURL(url);
  };

  if (Platform.OS !== 'android') return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={styles.brand}>STRIDE</Text>
      <View style={styles.card}>
        <Text style={styles.title}>{t('onboarding.healthConnectRequiredTitle')}</Text>
        <Text style={styles.message}>{t('onboarding.healthConnectRequiredMessage')}</Text>
        <TouchableOpacity style={styles.installButton} onPress={handleInstall} activeOpacity={0.8}>
          <Text style={styles.installButtonText}>{t('onboarding.install')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryButton} onPress={() => refreshHealthConnectStatus?.()} activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>{t('onboarding.checkAgain')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { radii } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    brand: {
      position: 'absolute',
      top: 56,
      fontSize: 22,
      fontWeight: '900',
      letterSpacing: -0.5,
      color: c.primary,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: radii.xl,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 12,
      textAlign: 'center',
    },
    message: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textSecondary,
      marginBottom: 24,
      textAlign: 'center',
    },
    installButton: {
      backgroundColor: c.primary,
      borderRadius: radii.lg,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 12,
    },
    installButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: c.onPrimary,
    },
    retryButton: {
      paddingVertical: 12,
      alignItems: 'center',
    },
    retryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.primary,
    },
  });
}
