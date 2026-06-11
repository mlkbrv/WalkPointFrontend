import { StatusBar } from 'expo-status-bar';
import { RefreshCw, Settings as SettingsIcon, Smartphone } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import ScreenHeader from '../components/ui/ScreenHeader';
import SegmentedControl from '../components/ui/SegmentedControl';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateProfile } from '../services/apiService';

export default function AccountSettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme, isDark, scheme, setScheme } = useTheme();
  const { refreshWallet, syncStepsFromSystem, openHealthConnectSettings, useHealthConnect } = useApp();
  const { user, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [stepGoal, setStepGoal] = useState(String(user?.step_goal ?? 10000));
  const [savingGoal, setSavingGoal] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const c = theme.colors;

  const handleRefresh = async () => {
    setBusy(true);
    try {
      await Promise.all([refreshWallet?.(), refreshProfile?.(), syncStepsFromSystem?.()]);
      Alert.alert(t('common.success'), t('account.refreshDone'));
    } catch (e) {
      Alert.alert(t('common.error'), e?.message || t('account.refreshFailed'));
    } finally {
      setBusy(false);
    }
  };

  const saveStepGoal = async () => {
    const n = parseInt(stepGoal, 10);
    if (!Number.isFinite(n) || n < 1000 || n > 100000) {
      Alert.alert(t('common.error'), t('account.stepGoalInvalid'));
      return;
    }
    setSavingGoal(true);
    try {
      await updateProfile({ step_goal: n });
      await refreshProfile?.();
      Alert.alert(t('common.success'), t('account.stepGoalSaved'));
    } catch (e) {
      Alert.alert(t('common.error'), e?.message || t('common.error'));
    } finally {
      setSavingGoal(false);
    }
  };

  const showHealthSettings = useHealthConnect && (Platform.OS === 'android' || Platform.OS === 'ios');

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader title={t('account.settings')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>{t('account.appearance')}</Text>
        <SegmentedControl
          options={[
            { value: 'light', label: t('account.themeLight') },
            { value: 'dark', label: t('account.themeDark') },
            { value: 'system', label: t('account.themeSystem') },
          ]}
          value={scheme}
          onChange={setScheme}
        />

        <Pressable style={styles.row} onPress={handleRefresh} disabled={busy}>
          <RefreshCw size={22} color={c.primary} strokeWidth={2} />
          <Text style={styles.rowText}>{t('account.refreshData')}</Text>
          {busy ? <ActivityIndicator color={c.primary} style={styles.rowEnd} /> : null}
        </Pressable>

        <Pressable style={styles.row} onPress={() => Linking.openSettings().catch(() => {})}>
          <Smartphone size={22} color={c.primary} strokeWidth={2} />
          <Text style={styles.rowText}>{t('account.systemSettings')}</Text>
        </Pressable>

        {showHealthSettings ? (
          <Pressable style={styles.row} onPress={() => openHealthConnectSettings?.()}>
            <SettingsIcon size={22} color={c.primary} strokeWidth={2} />
            <Text style={styles.rowText}>{t('account.stepsAndHealth')}</Text>
          </Pressable>
        ) : null}

        <View style={styles.goalBlock}>
          <Text style={styles.goalLabel}>{t('account.stepGoal')}</Text>
          <TextInput
            style={styles.goalInput}
            keyboardType="number-pad"
            value={stepGoal}
            onChangeText={setStepGoal}
            placeholderTextColor={c.textMuted}
          />
          <Pressable style={[styles.goalSave, savingGoal && styles.disabled]} onPress={saveStepGoal} disabled={savingGoal}>
            {savingGoal ? (
              <ActivityIndicator color={c.onPrimary} />
            ) : (
              <Text style={styles.goalSaveText}>{t('common.save')}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { typography, spacing, radii } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    scroll: { paddingBottom: spacing.xl },
    sectionLabel: {
      ...typography.label,
      color: c.textMuted,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: c.card,
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    rowText: { ...typography.body, color: c.textPrimary, flex: 1 },
    rowEnd: { marginLeft: 'auto' },
    goalBlock: {
      margin: spacing.md,
      padding: spacing.md,
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    goalLabel: { ...typography.caption, color: c.textSecondary, marginBottom: spacing.sm },
    goalInput: {
      ...typography.body,
      borderWidth: 1.5,
      borderColor: c.inputBorder,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: c.textPrimary,
      backgroundColor: c.inputBg,
      marginBottom: spacing.md,
    },
    goalSave: {
      backgroundColor: c.primary,
      borderRadius: radii.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    goalSaveText: { ...typography.subtitle, color: c.onPrimary },
    disabled: { opacity: 0.5 },
  });
}
