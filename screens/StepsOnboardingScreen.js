import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Footprints } from 'lucide-react-native';
import { useApp } from '../context/AppContext';

export default function StepsOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { requestHealthConnectPermission, openHealthConnectSettings } = useApp();

  const handleConnectSteps = async () => {
    await requestHealthConnectPermission?.();
  };

  if (Platform.OS !== 'android') return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Footprints size={72} color="#8140F3" strokeWidth={2} />
        </View>
        <Text style={styles.title}>Подключите шаги</Text>
        <Text style={styles.subtitle}>
          WalkPoint получает данные о шагах из Health Connect.{'\n\n'}
          Сначала откройте Health Connect (кнопка ниже), затем нажмите «Подключить шаги» — в окне выберите WalkPoint и разрешите доступ к шагам.
        </Text>
        <Pressable
          style={styles.openHealthButton}
          onPress={() => openHealthConnectSettings?.()}
          android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
        >
          <Text style={styles.openHealthButtonText}>Открыть Health Connect</Text>
        </Pressable>
        <Pressable
          style={styles.connectButton}
          onPress={handleConnectSteps}
          android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <Text style={styles.connectButtonText}>Подключить шаги</Text>
        </Pressable>
        <Text style={styles.hint}>
          Если WalkPoint не появляется в списке: полностью закройте приложение Health Connect (смахните из недавних) и откройте его снова, затем снова нажмите «Подключить шаги».
        </Text>
        <Text style={styles.hintSecondary}>
          Samsung Health: подключите его к Health Connect в настройках Samsung Health.
        </Text>
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
