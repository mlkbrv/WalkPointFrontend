import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import {
  ChevronRight,
  Footprints,
  LogOut,
  MoreVertical,
  User,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
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
import { getEconomyRules } from '../services/apiService';
import AnimatedPressable from '../components/ui/AnimatedPressable';
import GradientCard from '../components/ui/GradientCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import RewardBurst from '../components/ui/RewardBurst';
import { useTheme } from '../context/ThemeContext';

export default function AccountScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  const [showReward, setShowReward] = useState(false);
  const [economy, setEconomy] = useState(null);

  const appVersion =
    Constants.expoConfig?.version ?? Constants.manifest?.version ?? '1.0.0';

  useFocusEffect(
    useCallback(() => {
      void refreshWallet?.();
      void refreshProfile?.();
      void getEconomyRules()
        .then(setEconomy)
        .catch(() => setEconomy(null));
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
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowReward(true);
        setTimeout(() => setShowReward(false), 900);
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
    navigation.navigate('NotificationSettings');
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
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Footprints size={24} color={c.primary} />
          </View>
          <Text style={styles.headerTitle}>{t('tabs.profile')}</Text>
          <Pressable style={styles.menuButton} onPress={handleHeaderMenu} hitSlop={12}>
            <MoreVertical size={20} color={c.textPrimary} />
          </Pressable>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <User size={48} color={c.primary} strokeWidth={2} />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
          {user?.referral_code ? (
            <Text style={styles.referralCode}>
              {t('account.referralCode', { code: user.referral_code })}
            </Text>
          ) : null}
        </View>

        <GradientCard style={styles.walletHero} contentStyle={styles.walletHeroInner}>
          <Text style={styles.walletLabel}>{t('account.coins')}</Text>
          <Text style={styles.walletBalance}>{Math.round(coinsDisplay).toLocaleString()}</Text>
          <View style={styles.walletMeta}>
            <Text style={styles.walletMetaText}>
              {(totalStats?.steps ?? 0).toLocaleString()} {t('account.totalSteps')}
            </Text>
            <Text style={styles.walletMetaText}>
              {Math.floor(totalTimeMinutes / 60)}h {t('account.totalTime')}
            </Text>
          </View>
        </GradientCard>

        {economy ? (
          <Text style={styles.economyHint}>
            {t('account.economyHint', {
              min: economy.min_steps_to_convert,
              base: economy.daily_base_coins ?? economy.coins_at_min_steps,
              window: economy.convert_window_days ?? 7,
            })}
          </Text>
        ) : null}

        <View style={styles.convertWrap}>
          <RewardBurst visible={showReward} />
          <PrimaryButton
            variant="gradient"
            label={t('account.convertSteps', { count: dailyStats?.steps ?? 0 })}
            loading={converting || isSyncing}
            onPress={handleConvert}
          />
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('HowToConnectSteps')}
          >
            <Text style={styles.menuItemText}>{t('account.howToSteps')}</Text>
            <ChevronRight size={20} color={c.textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => openBodyProfileEditor?.()}>
            <Text style={styles.menuItemText}>{t('account.bodyProfile')}</Text>
            <ChevronRight size={20} color={c.textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.menuItemText}>{t('account.transactions')}</Text>
            <ChevronRight size={20} color={c.textMuted} strokeWidth={2} />
          </Pressable>
          {user?.role === 'PARTNER' ? (
            <Pressable
              style={styles.menuItem}
              onPress={() => navigation.navigate('PartnerHub')}
            >
              <Text style={styles.menuItemText}>{t('account.partnerHub')}</Text>
              <ChevronRight size={20} color={c.textMuted} strokeWidth={2} />
            </Pressable>
          ) : null}
          <Pressable style={styles.menuItem} onPress={handleLanguage}>
            <Text style={styles.menuItemText}>
              {t('account.language')} ({i18n.language === 'ru' ? 'RU' : 'EN'})
            </Text>
            <ChevronRight size={20} color={c.textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('AccountSettings')}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={styles.menuItemText}>{t('account.settings')}</Text>
            <ChevronRight size={20} color={c.textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={handleNotifications}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={styles.menuItemText}>{t('account.notifications')}</Text>
            <ChevronRight size={20} color={c.textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => navigation.navigate('AccountPrivacy')}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={styles.menuItemText}>{t('account.privacy')}</Text>
            <ChevronRight size={20} color={c.textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={handleAbout}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={styles.menuItemText}>{t('account.about')}</Text>
            <ChevronRight size={20} color={c.textMuted} strokeWidth={2} />
          </Pressable>
          <Pressable style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <View style={styles.logoutRow}>
              <LogOut size={20} color={c.danger} />
              <Text style={styles.logoutText}>{t('account.logOut')}</Text>
            </View>
            <ChevronRight size={20} color={c.danger} strokeWidth={2} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.screenBg,
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
    color: c.textPrimary,
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
    backgroundColor: c.card,
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
    backgroundColor: c.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: c.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: c.textPrimary,
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 14,
    color: c.textSecondary,
    fontWeight: '500',
  },
  referralCode: {
    fontSize: 13,
    color: c.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  walletHero: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  walletHeroInner: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  walletLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 6,
  },
  walletBalance: {
    fontSize: 40,
    fontWeight: '800',
    color: c.onPrimary,
    letterSpacing: -1,
  },
  walletMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  walletMetaText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  economyHint: {
    marginHorizontal: 24,
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
    color: c.textSecondary,
    textAlign: 'center',
  },
  convertWrap: {
    marginHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
  },
  convertPressable: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  convertButton: {
    flexDirection: 'row',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: c.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  convertButtonDisabled: {
    opacity: 0.6,
  },
  convertButtonText: {
    color: c.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  menuSection: {
    paddingHorizontal: 20,
    backgroundColor: c.card,
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
    borderBottomColor: c.cardBorder,
  },
  menuItemText: {
    fontSize: 16,
    color: c.textPrimary,
    fontWeight: '600',
  },
  menuItemFeatured: {
    backgroundColor: c.primarySoft,
    borderBottomColor: c.primarySoft,
  },
  menuItemFeaturedText: {
    fontSize: 16,
    color: c.primaryDark,
    fontWeight: '700',
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
    color: c.danger,
    fontWeight: '600',
  },
  });
}
