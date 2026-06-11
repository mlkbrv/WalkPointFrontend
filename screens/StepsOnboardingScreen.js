import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Footprints } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

export default function StepsOnboardingScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { requestHealthConnectPermission, openHealthConnectSettings, openSamsungHealth } = useApp();

  const handleConnectSteps = async () => {
    await requestHealthConnectPermission?.();
  };

  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;

  const isIos = Platform.OS === 'ios';
  const title = isIos ? t('onboarding.titleIos') : t('onboarding.titleAndroid');
  const subtitle = isIos ? t('onboarding.subtitleIos') : t('onboarding.subtitleAndroid');
  const hint = isIos ? t('onboarding.hintIos') : t('onboarding.hintAndroid');

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={styles.brand}>STRIDE</Text>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Footprints size={72} color={c.primary} strokeWidth={2} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {!isIos && (
          <Pressable style={styles.secondaryButton} onPress={() => openHealthConnectSettings?.()}>
            <Text style={styles.secondaryButtonText}>{t('onboarding.openHc')}</Text>
          </Pressable>
        )}
        {!isIos && (
          <Pressable style={styles.secondaryButton} onPress={() => openSamsungHealth?.()}>
            <Text style={styles.secondaryButtonText}>{t('onboarding.openSamsungHealth')}</Text>
          </Pressable>
        )}
        <Pressable style={styles.connectButton} onPress={handleConnectSteps}>
          <Text style={styles.connectButtonText}>
            {isIos ? t('onboarding.allowAccess') : t('onboarding.connectSteps')}
          </Text>
        </Pressable>
        <Text style={styles.hint}>{hint}</Text>
        {!isIos && <Text style={styles.hintSecondary}>{t('onboarding.hintSamsung')}</Text>}
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
    content: {
      width: '100%',
      maxWidth: 360,
      alignItems: 'center',
    },
    iconWrapper: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: c.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: c.textPrimary,
      marginBottom: 16,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 24,
      color: c.textSecondary,
      marginBottom: 32,
      textAlign: 'center',
    },
    secondaryButton: {
      backgroundColor: c.primarySoft,
      borderRadius: radii.lg,
      paddingVertical: 14,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: c.primary,
    },
    connectButton: {
      backgroundColor: c.primary,
      borderRadius: radii.lg,
      paddingVertical: 18,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
    },
    connectButtonText: {
      fontSize: 18,
      fontWeight: '800',
      color: c.onPrimary,
    },
    hint: {
      fontSize: 13,
      color: c.textSecondary,
      textAlign: 'center',
      marginTop: 24,
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    hintSecondary: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 12,
      lineHeight: 18,
      paddingHorizontal: 8,
    },
  });
}
