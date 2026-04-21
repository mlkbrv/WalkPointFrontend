import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import {
  ChevronRight,
  Coins,
  Footprints,
  LogOut,
  MoreVertical,
  RefreshCw,
  User,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { setAppLanguage } from '../i18n/config';

export default function AccountScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const {
    totalStats,
    dailyStats,
    walletBalance,
    convertStepsToCoins,
    isSyncing,
    openBodyProfileEditor,
    refreshWallet,
    syncStepsFromSystem,
  } = useApp();
  const { user, logout, refreshProfile } = useAuth();
  const [converting, setConverting] = useState(false);

  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? '1.0.0';

  useFocusEffect(
    useCallback(() => {
      void refreshWallet?.();
      void refreshProfile?.();
    }, [refreshWallet, refreshProfile]),
  );

  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || t('account.userFallback')
    : t('account.userFallback');
  const displayEmail = user?.email || 'user@example.com';

  const handleConvert = async () => {
    if (!dailyStats || dailyStats.steps < 1) {
      Alert.alert(t('account.noStepsTitle'), t('account.noStepsMessage'));
      return;
    }
    setConverting(true);
    try {
      const result = await convertStepsToCoins();
      if (result) {
        Alert.alert(
          t('account.convertedTitle'),
          t('account.convertedMessage', {
            coins: result.coins_earned ?? result.reward_earned ?? '',
            balance: result.new_balance ?? result.balance ?? '',
          }),
        );
      } else {
        Alert.alert(t('account.conversionTitle'), t('account.conversionFailed'));
      }
    } catch (e) {
      Alert.alert(t('account.conversionTitle'), e.message || t('account.conversionFailed'));
    } finally {
      setConverting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('account.logoutTitle'), t('account.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.logOut'), style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleLanguage = () => {
    Alert.alert(t('account.language'), '', [
      {
        text: t('account.languageEnglish'),
        onPress: () => setAppLanguage('en'),
      },
      {
        text: t('account.languageRussian'),
        onPress: () => setAppLanguage('ru'),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleNotifications = () => {
    Alert.alert(t('account.notificationsTitle'), t('account.notificationsMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.openSettings'), onPress: () => Linking.openSettings().catch(() => {}) },
    ]);
  };

  const handleAbout = () => {
    Alert.alert(t('account.about'), t('account.aboutMessage', { version: appVersion }));
  };

  const handleHeaderMenu = () => {
    Alert.alert(t('account.moreMenuTitle'), undefined, [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('account.moreRefresh'),
        onPress: () => {
          void (async () => {
            try {
              await Promise.all([refreshWallet?.(), refreshProfile?.(), syncStepsFromSystem?.()]);
              Alert.alert(t('common.success'), t('account.refreshDone'));
            } catch (e) {
              Alert.alert(t('common.error'), e?.message || t('account.refreshFailed'));
            }
          })();
        },
      },
    ]);
  };

  const coinsValue = Number.parseFloat(String(walletBalance ?? '0'), 10);
  const coinsDisplay = Number.isFinite(coinsValue) ? coinsValue : 0;
  const totalTimeMinutes = totalStats?.time ?? 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Footprints size={24} color="#8140F3" />
          </View>
          <Text style={styles.headerTitle}>{t('tabs.account')}</Text>
          <Pressable style={styles.menuButton} onPress={handleHeaderMenu} hitSlop={12}>
            <MoreVertical size={20} color="#000000" />
          </Pressable>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <User size={48} color="#8140F3" strokeWidth={2} />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>

        {/* Wallet + Steps Summary */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Coins size={24} color="#8140F3" />
            <Text style={styles.statValue}>{Math.round(coinsDisplay).toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('account.coins')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(totalStats?.steps ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>{t('account.totalSteps')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.floor(totalTimeMinutes / 60)}h</Text>
            <Text style={styles.statLabel}>{t('account.totalTime')}</Text>
          </View>
        </View>

        {/* Convert Steps Button */}
        <Pressable
          style={[styles.convertButton, (converting || isSyncing) && styles.convertButtonDisabled]}
          onPress={handleConvert}
          disabled={converting || isSyncing}
        >
          {converting || isSyncing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.convertButtonText}>
                {t('account.convertSteps', { count: dailyStats?.steps ?? 0 })}
              </Text>
            </>
          )}
        </Pressable>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('HowToConnectSteps')}
          >
            <Text style={styles.menuItemText}>{t('account.howToSteps')}</Text>
            <ChevronRight size={20} color="#999999" strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => openBodyProfileEditor?.()}>
            <Text style={styles.menuItemText}>{t('account.bodyProfile')}</Text>
            <ChevronRight size={20} color="#999999" strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={handleLanguage}>
            <Text style={styles.menuItemText}>
              {t('account.language')} ({i18n.language === 'ru' ? 'RU' : 'EN'})
            </Text>
            <ChevronRight size={20} color="#999999" strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('AccountSettings')}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={styles.menuItemText}>{t('account.settings')}</Text>
            <ChevronRight size={20} color="#999999" strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={handleNotifications}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={styles.menuItemText}>{t('account.notifications')}</Text>
            <ChevronRight size={20} color="#999999" strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('AccountPrivacy')}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={styles.menuItemText}>{t('account.privacy')}</Text>
            <ChevronRight size={20} color="#999999" strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={handleAbout}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={styles.menuItemText}>{t('account.about')}</Text>
            <ChevronRight size={20} color="#999999" strokeWidth={2} />
          </Pressable>
          <Pressable style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <View style={styles.logoutRow}>
              <LogOut size={20} color="#F44336" />
              <Text style={styles.logoutText}>{t('account.logOut')}</Text>
            </View>
            <ChevronRight size={20} color="#F44336" strokeWidth={2} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#8140F3',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#8140F3',
    marginBottom: 4,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  convertButton: {
    flexDirection: 'row',
    backgroundColor: '#8140F3',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    shadowColor: '#8140F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  convertButtonDisabled: {
    opacity: 0.6,
  },
  convertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  menuSection: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  menuItemText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: '600',
  },
});
