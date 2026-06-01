import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ui/ScreenHeader';
import { colors, radii, shadow, spacing } from '../constants/theme';
import {
  getNotificationPrefs,
  requestNotificationPermission,
  saveNotificationPrefs,
} from '../services/notificationService';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState({ eveningReminder: true, claimReminder: true });

  useFocusEffect(
    useCallback(() => {
      getNotificationPrefs().then(setPrefs);
    }, []),
  );

  const toggle = async (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await saveNotificationPrefs(next);
    if (next.eveningReminder || next.claimReminder) {
      await requestNotificationPermission();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title={t('notifications.settingsTitle')} onBack={() => navigation.goBack()} />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>{t('notifications.evening')}</Text>
            <Text style={styles.hint}>{t('notifications.eveningHint')}</Text>
          </View>
          <Switch
            value={prefs.eveningReminder}
            onValueChange={() => toggle('eveningReminder')}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={prefs.eveningReminder ? colors.primary : '#f4f3f4'}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.label}>{t('notifications.claim')}</Text>
            <Text style={styles.hint}>{t('notifications.claimHint')}</Text>
          </View>
          <Switch
            value={prefs.claimReminder}
            onValueChange={() => toggle('claimReminder')}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={prefs.claimReminder ? colors.primary : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    margin: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  rowText: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  hint: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
});
