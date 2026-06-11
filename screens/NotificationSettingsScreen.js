import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import {
  getNotificationPrefs,
  requestNotificationPermission,
  saveNotificationPrefs,
} from '../services/notificationService';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
            trackColor={{ false: c.cardBorder, true: c.primarySoft }}
            thumbColor={prefs.eveningReminder ? c.primary : c.card}
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
            trackColor={{ false: c.cardBorder, true: c.primarySoft }}
            thumbColor={prefs.claimReminder ? c.primary : c.card}
          />
        </View>
      </View>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { radii, shadow, spacing } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    card: {
      margin: spacing.md,
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
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
    label: { fontSize: 16, fontWeight: '600', color: c.textPrimary },
    hint: { fontSize: 13, color: c.textSecondary, marginTop: 4, lineHeight: 18 },
    divider: { height: 1, backgroundColor: c.cardBorder, marginHorizontal: spacing.md },
  });
}
