import React, { useMemo } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Footprints } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function StepsOnboardingScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { requestHealthConnectPermission, openHealthConnectSettings } = useApp();

  const handleConnectSteps = async () => {
    await requestHealthConnectPermission?.();
  };

  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;

  const isIos = Platform.OS === 'ios';

  const title = useMemo(() => (isIos ? t('onboarding.titleIos') : t('onboarding.titleAndroid')), [isIos, t]);
  const subtitle = useMemo(() => (isIos ? t('onboarding.subtitleIos') : t('onboarding.subtitleAndroid')), [isIos, t]);
  const hint = useMemo(() => (isIos ? t('onboarding.hintIos') : t('onboarding.hintAndroid')), [isIos, t]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Footprints size={72} color="#8140F3" strokeWidth={2} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        {!isIos && (
          <Pressable
            style={styles.openHealthButton}
            onPress={() => openHealthConnectSettings?.()}
            android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
          >
            <Text style={styles.openHealthButtonText}>{t('onboarding.openHc')}</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.connectButton}
          onPress={handleConnectSteps}
          android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <Text style={styles.connectButtonText}>
            {isIos ? t('onboarding.allowAccess') : t('onboarding.connectSteps')}
          </Text>
        </Pressable>
        <Text style={styles.hint}>{hint}</Text>
        {!isIos && (
          <Text style={styles.hintSecondary}>{t('onboarding.hintSamsung')}</Text>
        )}
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
  content: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 32,
    textAlign: 'center',
  },
  openHealthButton: {
    backgroundColor: '#E8E0F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  openHealthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5E35B1',
  },
  connectButton: {
    backgroundColor: '#8140F3',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  hintSecondary: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
});
