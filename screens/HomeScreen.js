import { StatusBar } from 'expo-status-bar';
import { AlertCircle, Clock, Coins, Flame, Footprints, MapPin, MoreVertical } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Device from 'expo-device';
import Svg, { Circle, Line } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getStories, viewStory } from '../services/apiService';
import { getDateKey } from '../utils/calculations';
import { tierCoinsForSteps, stepsToReachMin } from '../utils/tierCoins';
import { scheduleDailyReminders } from '../services/notificationService';
import { clearGoogleFitDeniedCooldown } from '../services/googleFitSteps';
import i18nInstance from '../i18n/config';

const { width } = Dimensions.get('window');

const GOOGLE_FIT_PACKAGE = 'com.google.android.apps.fitness';
const GOOGLE_FIT_PLAY_URL = `https://play.google.com/store/apps/details?id=${GOOGLE_FIT_PACKAGE}`;

function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const {
    dailyStats,
    weeklyProgress,
    updateWeeklyProgress,
    loadWeeklyProgress,
    walletBalance,
    refreshWallet,
    syncStepsFromSystem,
    useHealthConnect,
    healthConnectAvailable,
    healthConnectReady,
    requestHealthConnectPermission,
    openHealthConnectSettings,
    openSamsungHealth,
  } = useApp();
  const { user } = useAuth();

  const safeDailyStats = dailyStats ?? { steps: 0, time: 0, calories: 0, distance: 0 };
  const isSamsungDevice =
    Platform.OS === 'android' &&
    (Device.manufacturer?.toLowerCase() === 'samsung' ||
      Device.brand?.toLowerCase() === 'samsung');
  const showHealthConnectBanner =
    (Platform.OS === 'android' || Platform.OS === 'ios') &&
    useHealthConnect &&
    healthConnectAvailable === true &&
    !healthConnectReady;
  const showStepsNotShowing =
    Platform.OS === 'android' &&
    useHealthConnect &&
    healthConnectAvailable !== null &&
    safeDailyStats.steps === 0 &&
    (healthConnectReady || healthConnectAvailable === false);

  // Step counting is started once when MainTabs mount (see App.jsx).

  const goal = user?.step_goal ?? 10000;
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void scheduleDailyReminders(safeDailyStats.steps, safeDailyStats.isConverted);
  }, [safeDailyStats.steps, safeDailyStats.isConverted]);

  const fetchStories = useCallback(async () => {
    setStoriesError(false);
    setStoriesLoading(true);
    try {
      const data = await getStories();
      setStories(Array.isArray(data) ? data : data.results || []);
    } catch {
      setStories([]);
      setStoriesError(true);
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  const onHomeRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStories(),
        refreshWallet?.(),
        syncStepsFromSystem?.(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchStories, refreshWallet, syncStepsFromSystem]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useFocusEffect(
    useCallback(() => {
      void syncStepsFromSystem?.();
      void loadWeeklyProgress?.();
    }, [syncStepsFromSystem, loadWeeklyProgress]),
  );

  const openGoogleFit = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    await clearGoogleFitDeniedCooldown();
    const intentUrl = `intent://#Intent;package=${GOOGLE_FIT_PACKAGE};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;S.browser_fallback_url=${encodeURIComponent(GOOGLE_FIT_PLAY_URL)};end`;
    try {
      await Linking.openURL(intentUrl);
    } catch {
      await Linking.openURL(GOOGLE_FIT_PLAY_URL);
    }
  }, []);

  const handleStoryPress = async (story) => {
    if (story.is_viewed) {
      Alert.alert(t('home.storyViewedTitle'), t('home.storyViewedMessage'));
      return;
    }
    try {
      const result = await viewStory(story.id);
      Alert.alert(
        t('home.coinsEarnedTitle'),
        t('home.coinsEarnedMessage', {
          amount: result.reward_earned,
          balance: result.new_balance,
        }),
      );
      refreshWallet();
      fetchStories();
    } catch (e) {
      Alert.alert(t('common.info'), String(e?.message ?? e));
    }
  };

  const progressPercentage = Math.min((safeDailyStats.steps / goal) * 100, 100);
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const weekDays = useMemo(() => t('home.weekdays', { returnObjects: true }), [t]);
  const today = new Date();
  const currentDay = today.getDay();
  const adjustedDay = currentDay === 0 ? 6 : currentDay - 1;

  const getWeekDayDate = (index) => {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - adjustedDay + index);
    return dayDate;
  };

  const getWeekDayProgress = (index) => {
    const key = getDateKey(getWeekDayDate(index));
    const dayData = weeklyProgress.find((w) => w.dateKey === key || w.date === getWeekDayDate(index).getDate());
    return dayData ? Math.min((dayData.steps / goal) * 100, 100) : 0;
  };

  const openReportDay = (index) => {
    const key = getDateKey(getWeekDayDate(index));
    navigation.navigate('Report', { screen: 'ReportMain', params: { focusDate: key } });
  };

  const storyColors = ['#FFC107', '#00A859', '#FF0000', '#2196F3', '#9C27B0', '#FF5722'];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onHomeRefresh} tintColor="#8140F3" />
        }
      >
        {/* Health Connect: show banner so user can open permission dialog (app will then appear in Health Connect) */}
        {showHealthConnectBanner && (
          <Pressable
            style={styles.healthConnectBanner}
            onPress={() => requestHealthConnectPermission?.()}
          >
            <Text style={styles.healthConnectBannerText}>
              {Platform.OS === 'ios' ? t('home.connectHealthBanner') : t('home.connectHcBanner')}
            </Text>
            <Text style={styles.healthConnectBannerButton}>{t('home.connect')}</Text>
          </Pressable>
        )}
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Footprints size={24} color="#8140F3" />
          </View>
          <Text style={styles.headerTitle}>{t('tabs.home')}</Text>
          <Pressable
            style={styles.balanceBadge}
            onPress={() => navigation.navigate('Account', { screen: 'Transactions' })}
          >
            <Coins size={14} color="#8140F3" />
            <Text style={styles.balanceText}>{parseFloat(walletBalance).toFixed(0)}</Text>
          </Pressable>
        </View>

        {/* Stories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContainer}
        >
          {storiesLoading ? (
            <ActivityIndicator color="#8140F3" style={{ marginLeft: 20 }} />
          ) : storiesError ? (
            <Text style={styles.noStories}>{t('home.storiesUnavailable')}</Text>
          ) : stories.length > 0 ? (
            stories.map((story, idx) => {
              const color = storyColors[idx % storyColors.length];
              const initials = (story.partner_name || 'S').substring(0, 2).toUpperCase();
              return (
                <Pressable
                  key={story.id}
                  style={styles.storyItem}
                  onPress={() => handleStoryPress(story)}
                >
                  <View
                    style={[
                      styles.storyCircle,
                      {
                        borderColor: story.is_viewed ? '#CCC' : color,
                        backgroundColor: story.is_viewed ? '#E0E0E0' : color,
                      },
                    ]}
                  >
                    <View style={styles.storyLogoContainer}>
                      <Text style={styles.storyInitials}>{initials}</Text>
                    </View>
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {story.partner_name || t('common.partner')}
                  </Text>
                  {!story.is_viewed && (
                    <Text style={styles.storyReward}>+{story.reward_amount}</Text>
                  )}
                </Pressable>
              );
            })
          ) : (
            <Text style={styles.noStories}>{t('home.noStories')}</Text>
          )}
        </ScrollView>

        {/* Step Counter */}
        <View style={styles.stepCounterContainer}>
          <View style={styles.circleWrapper}>
            <Svg width={240} height={240} style={styles.progressSvg}>
              <Circle
                cx={120}
                cy={120}
                r={100}
                stroke="#E8E8E8"
                strokeWidth={12}
                fill="none"
              />
              {Array.from({ length: 20 }, (_, i) => {
                const angle = (i * 360) / 20;
                const x1 = 120 + 90 * Math.cos((angle * Math.PI) / 180);
                const y1 = 120 + 90 * Math.sin((angle * Math.PI) / 180);
                const x2 = 120 + 100 * Math.cos((angle * Math.PI) / 180);
                const y2 = 120 + 100 * Math.sin((angle * Math.PI) / 180);
                return (
                  <Line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#D0D0D0"
                    strokeWidth={1.5}
                  />
                );
              })}
              <Circle
                cx={120}
                cy={120}
                r={100}
                stroke="#8140F3"
                strokeWidth={12}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 120 120)`}
              />
            </Svg>
            <Pressable style={styles.innerCircle} onPress={() => openReportDay(adjustedDay)}>
              <Text style={styles.stepNumber}>{safeDailyStats.steps}</Text>
              <Text style={styles.stepLabel}>{t('home.steps')}</Text>
              <Text style={styles.goalText}>{t('home.goalLabel', { goal: goal.toLocaleString() })}</Text>
              <View style={styles.coinsPill}>
                <Coins size={14} color="#8140F3" strokeWidth={2.5} />
                <Text style={styles.coinsPreview}>
                  {t('home.coinsPreview', {
                    coins: tierCoinsForSteps(safeDailyStats.steps),
                    left: stepsToReachMin(safeDailyStats.steps),
                  })}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {showStepsNotShowing && (
          <View style={styles.stepsNotShowingCard}>
            <AlertCircle size={20} color="#F59E0B" strokeWidth={2} style={styles.stepsNotShowingIcon} />
            <Text style={styles.stepsNotShowingTitle}>{t('home.stepsNotShowingTitle')}</Text>
            <Text style={styles.stepsNotShowingText}>
              {healthConnectAvailable === false
                ? t('home.stepsNotShowingHcOff')
                : isSamsungDevice
                  ? t('home.stepsNotShowingSamsung')
                  : t('home.stepsNotShowingDefault')}
            </Text>
            <View style={styles.stepsNotShowingButtons}>
              {healthConnectAvailable === true && (
                <Pressable
                  style={styles.stepsNotShowingBtn}
                  onPress={() => openHealthConnectSettings?.()}
                >
                  <Text style={styles.stepsNotShowingBtnText}>{t('home.openHc')}</Text>
                </Pressable>
              )}
              {isSamsungDevice ? (
                <Pressable
                  style={[styles.stepsNotShowingBtn, styles.stepsNotShowingBtnSecondary]}
                  onPress={() => openSamsungHealth?.()}
                >
                  <Text style={styles.stepsNotShowingBtnTextSecondary}>{t('home.openSamsungHealth')}</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.stepsNotShowingBtn, styles.stepsNotShowingBtnSecondary]}
                  onPress={openGoogleFit}
                >
                  <Text style={styles.stepsNotShowingBtnTextSecondary}>{t('home.openGoogleFit')}</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Clock size={32} color="#FF9800" strokeWidth={2} />
            <Text style={styles.metricValue}>
              {Math.floor(safeDailyStats.time / 60)}h {safeDailyStats.time % 60}m
            </Text>
            <Text style={styles.metricLabel}>{t('home.time')}</Text>
          </View>
          <View style={styles.metricItem}>
            <Flame size={32} color="#F44336" strokeWidth={2} />
            <Text style={styles.metricValue}>{safeDailyStats.calories}</Text>
            <Text style={styles.metricLabel}>{t('home.kcal')}</Text>
          </View>
          <View style={styles.metricItem}>
            <MapPin size={32} color="#4CAF50" strokeWidth={2} />
            <Text style={styles.metricValue}>{safeDailyStats.distance.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>{t('home.km')}</Text>
          </View>
        </View>

        {/* Weekly Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>{t('home.yourProgress')}</Text>
            <Pressable style={styles.weekSelector} onPress={() => navigation.navigate('Report')}>
              <Text style={styles.weekSelectorText}>{t('home.thisWeek')}</Text>
              <Text style={styles.weekSelectorArrow}>▼</Text>
            </Pressable>
          </View>
          <View style={styles.weekContainer}>
            {weekDays.map((day, index) => {
              const isToday = index === adjustedDay;
              const dayDate = getWeekDayDate(index);
              const dayProgress = getWeekDayProgress(index);
              const dayRadius = 15;
              const dayCircumference = 2 * Math.PI * dayRadius;
              const dayStrokeDashoffset = dayCircumference - (dayProgress / 100) * dayCircumference;

              return (
                <Pressable key={index} style={styles.weekDay} onPress={() => openReportDay(index)}>
                  <View style={styles.weekDayCircleWrapper}>
                    <Svg width={32} height={32} style={styles.weekDaySvg}>
                      <Circle
                        cx={16}
                        cy={16}
                        r={dayRadius}
                        stroke="#E8E8E8"
                        strokeWidth={2}
                        fill="none"
                      />
                      {dayProgress > 0 && (
                        <Circle
                          cx={16}
                          cy={16}
                          r={dayRadius}
                          stroke="#8140F3"
                          strokeWidth={2}
                          fill="none"
                          strokeDasharray={dayCircumference}
                          strokeDashoffset={dayStrokeDashoffset}
                          strokeLinecap="round"
                          transform={`rotate(-90 16 16)`}
                        />
                      )}
                    </Svg>
                    <View style={styles.weekDayInner}>
                      <Text
                        style={[
                          styles.weekDayText,
                          isToday && styles.weekDayTextToday,
                        ]}
                      >
                        {dayDate.getDate()}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.weekDayLabel,
                      isToday && styles.weekDayLabelToday,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.quickRow}>
          <Pressable style={styles.quickChip} onPress={() => navigation.navigate('Account', { screen: 'Features' })}>
            <Text style={styles.quickChipText}>{t('home.quickMore')}</Text>
          </Pressable>
          <Pressable style={styles.quickChip} onPress={() => navigation.navigate('Scoreboard')}>
            <Text style={styles.quickChipText}>{t('tabs.scoreboard')}</Text>
          </Pressable>
          <Pressable
            style={styles.quickChip}
            onPress={() => navigation.navigate('Market', { screen: 'Favorites' })}
          >
            <Text style={styles.quickChipText}>{t('features.favorites')}</Text>
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
  healthConnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDE7F6',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1C4E9',
  },
  healthConnectBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#311B92',
    marginRight: 12,
  },
  healthConnectBannerButton: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8140F3',
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
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8140F3',
  },
  storiesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    width: 72,
  },
  storyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
  },
  storyLogoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storyInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  storyName: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  storyReward: {
    fontSize: 10,
    color: '#8140F3',
    fontWeight: '700',
  },
  noStories: {
    color: '#999',
    fontSize: 14,
    paddingLeft: 4,
  },
  stepCounterContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  circleWrapper: {
    width: 240,
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  progressSvg: {
    position: 'absolute',
  },
  innerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  stepNumber: {
    fontSize: 64,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '400',
  },
  coinsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    maxWidth: '95%',
  },
  coinsPreview: {
    fontSize: 12,
    color: '#6B2FD9',
    fontWeight: '700',
    textAlign: 'center',
  },
  stepsNotShowingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  stepsNotShowingIcon: {
    marginBottom: 8,
  },
  stepsNotShowingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 8,
  },
  stepsNotShowingText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
    marginBottom: 16,
  },
  stepsNotShowingButtons: {
    gap: 10,
  },
  stepsNotShowingBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  stepsNotShowingBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  stepsNotShowingBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepsNotShowingBtnTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8EAEF',
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B2FD9',
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 28,
    paddingBottom: 40,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekSelectorText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  weekSelectorArrow: {
    fontSize: 10,
    color: '#666666',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
  },
  weekDayCircleWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  weekDaySvg: {
    position: 'absolute',
  },
  weekDayInner: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8140F3',
  },
  weekDayTextToday: {
    color: '#8140F3',
  },
  weekDayLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  weekDayLabelToday: {
    color: '#8140F3',
    fontWeight: '700',
  },
});

export default React.memo(HomeScreen);
