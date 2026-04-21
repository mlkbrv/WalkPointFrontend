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
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

export default function AccountSettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { refreshWallet, syncStepsFromSystem, openHealthConnectSettings, useHealthConnect } = useApp();
  const { refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);

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
});
