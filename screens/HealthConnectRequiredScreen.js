import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function HealthConnectRequiredScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { refreshHealthConnectStatus, healthConnectPlayUrl } = useApp();

  const handleInstall = () => {
    const url = healthConnectPlayUrl || 'https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata';
    Linking.openURL(url);
  };

  const handleRetry = () => {
    refreshHealthConnectStatus?.();
  };

  if (Platform.OS !== 'android') return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.card}>
        <Text style={styles.title}>{t('onboarding.healthConnectRequiredTitle')}</Text>
        <Text style={styles.message}>{t('onboarding.healthConnectRequiredMessage')}</Text>
        <TouchableOpacity style={styles.installButton} onPress={handleInstall} activeOpacity={0.8}>
          <Text style={styles.installButtonText}>{t('onboarding.install')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>{t('onboarding.checkAgain')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  installButton: {
    backgroundColor: '#8140F3',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  installButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  retryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 14,
    color: '#8140F3',
    fontWeight: '500',
  },
});
