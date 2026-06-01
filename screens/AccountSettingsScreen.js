import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, RefreshCw, Settings as SettingsIcon, Smartphone } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/apiService';

export default function AccountSettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { refreshWallet, syncStepsFromSystem, openHealthConnectSettings, useHealthConnect } = useApp();
  const { user, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [stepGoal, setStepGoal] = useState(String(user?.step_goal ?? 10000));
  const [savingGoal, setSavingGoal] = useState(false);

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

  const openSystemSettings = () => {
    Linking.openSettings().catch(() => {});
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

  const showHealthSettings =
    useHealthConnect && (Platform.OS === 'android' || Platform.OS === 'ios');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={12}>
          <ChevronLeft size={24} color="#000000" strokeWidth={2} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('account.settings')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Pressable
          style={[styles.row, busy && styles.rowDisabled]}
          onPress={handleRefresh}
          disabled={busy}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        >
          <RefreshCw size={22} color="#8140F3" strokeWidth={2} />
          <Text style={styles.rowText}>{t('account.refreshData')}</Text>
          {busy ? <ActivityIndicator color="#8140F3" style={styles.rowEnd} /> : null}
        </Pressable>

        <Pressable
          style={styles.row}
          onPress={openSystemSettings}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        >
          <Smartphone size={22} color="#8140F3" strokeWidth={2} />
          <Text style={styles.rowText}>{t('account.systemSettings')}</Text>
        </Pressable>

        {showHealthSettings ? (
          <Pressable
            style={styles.row}
            onPress={() => openHealthConnectSettings?.()}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <SettingsIcon size={22} color="#8140F3" strokeWidth={2} />
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
          />
          <Pressable
            style={[styles.goalSave, savingGoal && styles.rowDisabled]}
            onPress={saveStepGoal}
            disabled={savingGoal}
          >
            {savingGoal ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.goalSaveText}>{t('common.save')}</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          style={styles.row}
          onPress={() => navigation.navigate('HowToConnectSteps')}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        >
          <Text style={styles.rowTextOnly}>{t('account.howToSteps')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rowDisabled: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  rowTextOnly: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#8140F3',
  },
  rowEnd: {
    marginLeft: 8,
  },
  goalBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  goalSave: {
    backgroundColor: '#8140F3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  goalSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
