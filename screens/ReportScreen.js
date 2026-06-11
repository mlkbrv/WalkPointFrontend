import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, ChevronRight, Clock, Coins, Flame, Footprints, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { saveLocalDailyStat } from '../services/activitySync';
import { convertSteps, getTodayStat, syncActivity } from '../services/apiService';
import {
  calculateDistanceFromSteps,
  calculateWalkingCaloriesFromSteps,
  getDateKey,
} from '../utils/calculations';
import { tierCoinsForSteps } from '../utils/tierCoins';
import { useTheme } from '../context/ThemeContext';

const METRIC_KEYS = ['Steps', 'Time', 'Calorie', 'Distance'];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatTickValue(val, metric) {
  if (!Number.isFinite(val) || val < 0) return '0';
  switch (metric) {
    case 'Steps':
      return val >= 1000 ? `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : String(Math.round(val));
    case 'Time':
      return String(Math.round(val));
    case 'Calorie':
      return String(Math.round(val));
    case 'Distance':
      return val >= 10 ? val.toFixed(0) : val.toFixed(1);
    default:
      return String(Math.round(val));
  }
}

function ReportScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { totalStats, bodyProfile, getHistoricalStats, syncActivityHistory, refreshWallet } = useApp();
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const pendingOpenDate = useRef(null);
  const stepGoal = user?.step_goal ?? 10000;
  const [selectedMetric, setSelectedMetric] = useState('Steps');
  const [sheetDay, setSheetDay] = useState(null);
  const [sheetStats, setSheetStats] = useState(null);
  const [converting, setConverting] = useState(false);

  const [weekWindowEnd, setWeekWindowEnd] = useState(() => startOfDay(new Date()));
  const [weekBars, setWeekBars] = useState([]);
  const [weekLoading, setWeekLoading] = useState(true);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [monthDaySteps, setMonthDaySteps] = useState({});
  const [monthLoading, setMonthLoading] = useState(true);

  const localeTag = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
  const calendarWeekdays = useMemo(() => t('report.calendarWeekdays', { returnObjects: true }), [t]);

  const loadWeekBars = useCallback(async () => {
    setWeekLoading(true);
    const days = [];
    const end = startOfDay(weekWindowEnd);
    for (let i = 6; i >= 0; i--) {
      const date = new Date(end);
      date.setDate(date.getDate() - i);
      let steps = 0;
      try {
        const stats = await getHistoricalStats(date);
        steps = stats?.steps ?? 0;
      } catch {
        steps = 0;
      }
      days.push({
        day: date.toLocaleDateString(localeTag, { weekday: 'short' }),
        dateNum: date.getDate(),
        dateKey: getDateKey(date),
        steps,
      });
    }
    setWeekBars(days);
    setWeekLoading(false);
  }, [weekWindowEnd, getHistoricalStats, localeTag]);

  const weekRangeLabel = useMemo(() => {
    const end = startOfDay(weekWindowEnd);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const sameYear = start.getFullYear() === end.getFullYear();
    const optsShort = { month: 'short', day: 'numeric' };
    const startStr = start.toLocaleDateString(localeTag, sameYear ? optsShort : { ...optsShort, year: 'numeric' });
    const endStr = end.toLocaleDateString(localeTag, { ...optsShort, year: 'numeric' });
    return `${startStr} – ${endStr}`;
  }, [weekWindowEnd, localeTag]);

  const todayStart = startOfDay(new Date());
  const canGoNextWeek = weekWindowEnd < todayStart;

  const goPrevWeek = () => {
    setWeekWindowEnd((prev) => {
      const n = startOfDay(prev);
      n.setDate(n.getDate() - 7);
      return n;
    });
  };

  const goNextWeek = () => {
    if (!canGoNextWeek) return;
    setWeekWindowEnd((prev) => {
      const n = startOfDay(prev);
      n.setDate(n.getDate() + 7);
      return n > todayStart ? todayStart : n;
    });
  };

  const getMetricValue = (day, metric) => {
    const steps = day.steps || 0;
    const w = bodyProfile?.weightKg ?? 75;
    const h = bodyProfile?.heightCm ?? null;
    switch (metric) {
      case 'Steps':
        return steps;
      case 'Time':
        return Math.round(steps / 100);
      case 'Calorie':
        return calculateWalkingCaloriesFromSteps(steps, w, h);
      case 'Distance':
        return calculateDistanceFromSteps(steps, h);
      default:
        return steps;
    }
  };

  const allValues = weekBars.map((day) => getMetricValue(day, selectedMetric));
  const maxValue = Math.max(...allValues, 1);
  const chartMax = Math.max(maxValue * 1.05, 1);

  const yAxisTicks = useMemo(() => {
    const m = chartMax;
    return [m, (m * 3) / 4, m / 2, m / 4].map((v) => Math.max(0, v));
  }, [chartMax]);

  const todayKey = getDateKey(new Date());

  const displayYear = calendarMonth.getFullYear();
  const displayMonthIndex = calendarMonth.getMonth();
  const firstDay = new Date(displayYear, displayMonthIndex, 1).getDay();
  const daysInMonth = new Date(displayYear, displayMonthIndex + 1, 0).getDate();

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const canGoNextMonth =
    calendarMonth.getFullYear() < currentMonthStart.getFullYear() ||
    (calendarMonth.getFullYear() === currentMonthStart.getFullYear() &&
      calendarMonth.getMonth() < currentMonthStart.getMonth());

  const loadMonthSteps = useCallback(async () => {
    setMonthLoading(true);
    const next = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(displayYear, displayMonthIndex, d);
      try {
        const stats = await getHistoricalStats(dt);
        next[d] = stats?.steps ?? 0;
      } catch {
        next[d] = 0;
      }
    }
    setMonthDaySteps(next);
    setMonthLoading(false);
  }, [displayYear, displayMonthIndex, daysInMonth, getHistoricalStats]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        await syncActivityHistory?.();
        if (cancelled) return;
        await loadWeekBars();
        await loadMonthSteps();
      })();
      return () => {
        cancelled = true;
      };
    }, [syncActivityHistory, loadWeekBars, loadMonthSteps]),
  );

  useEffect(() => {
    loadMonthSteps();
  }, [loadMonthSteps]);

  const monthTitle = useMemo(
    () =>
      calendarMonth.toLocaleDateString(localeTag, {
        month: 'long',
        year: 'numeric',
      }),
    [calendarMonth, localeTag],
  );

  const goPrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    if (!canGoNextMonth) return;
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getCalendarDayProgress = (dayNum) => {
    const steps = monthDaySteps[dayNum] ?? 0;
    return Math.min((steps / stepGoal) * 100, 100);
  };

  const openDayByDate = async (dt) => {
    if (startOfDay(dt) > startOfDay(new Date())) return;
    const key = getDateKey(dt);
    const local = await getHistoricalStats(dt);
    let stats = local || { steps: monthDaySteps[dayNum] ?? 0, date: key };
    try {
      const remote = await getTodayStat(key);
      if (remote) {
        stats = {
          ...stats,
          steps: remote.steps ?? stats.steps,
          isConverted: remote.is_converted,
          calories: remote.calories != null ? Number(remote.calories) : stats.calories,
          distance: remote.distance_km != null ? Number(remote.distance_km) : stats.distance,
          time: remote.duration_sec != null ? remote.duration_sec / 60 : stats.time,
        };
      }
    } catch {
      // offline
    }
    if ((stats.steps ?? 0) > 0) {
      await saveLocalDailyStat(stats);
    }
    setSheetStats(stats);
    setSheetDay({ dayNum: dt.getDate(), dateKey: key });
  };

  const openDaySheet = (dayNum) => {
    if (isCalendarDayFuture(dayNum)) return;
    openDayByDate(new Date(displayYear, displayMonthIndex, dayNum));
  };

  const openDayByDateKey = (dateKey) => {
    if (!dateKey) return;
    openDayByDate(new Date(`${dateKey}T12:00:00`));
  };

  useEffect(() => {
    const focusDate = route.params?.focusDate;
    if (!focusDate) return;
    pendingOpenDate.current = focusDate;
    const d = new Date(`${focusDate}T12:00:00`);
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    navigation.setParams({ focusDate: undefined });
  }, [route.params?.focusDate, navigation]);

  useEffect(() => {
    if (!pendingOpenDate.current || monthLoading) return;
    const key = pendingOpenDate.current;
    pendingOpenDate.current = null;
    openDayByDateKey(key);
  }, [monthLoading, monthDaySteps]);

  const handleClaimDay = async () => {
    if (!sheetStats || sheetStats.steps < 5000) {
      Alert.alert(t('report.claimMinSteps'));
      return;
    }
    setConverting(true);
    try {
      const payload = {
        date: sheetStats.date || sheetDay?.dateKey,
        steps: Math.floor(sheetStats.steps),
        calories: sheetStats.calories != null ? Math.round(sheetStats.calories) : undefined,
        distance_m:
          sheetStats.distance != null && sheetStats.distance > 0
            ? Math.round(Number(sheetStats.distance) * 1000)
            : undefined,
        duration_sec:
          sheetStats.time != null && sheetStats.time > 0
            ? Math.round(Number(sheetStats.time) * 60)
            : undefined,
      };
      await syncActivity(payload);
      const result = await convertSteps(payload);
      const dateKey = payload.date;
      await saveLocalDailyStat({
        date: dateKey,
        steps: payload.steps,
        time:
          sheetStats.time ??
          (payload.duration_sec != null ? Math.round(payload.duration_sec / 60) : 0),
        calories: sheetStats.calories ?? payload.calories ?? 0,
        distance: sheetStats.distance ?? 0,
        isConverted: true,
      });
      const dayNum = sheetDay?.dayNum;
      if (dayNum != null) {
        setMonthDaySteps((prev) => ({ ...prev, [dayNum]: payload.steps }));
      }
      Alert.alert(
        t('common.success'),
        t('report.claimed', { coins: result.coins_earned, balance: result.new_balance }),
      );
      await refreshWallet?.();
      setSheetDay(null);
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setConverting(false);
    }
  };

  const isCalendarDayFuture = (dayNum) => {
    const cell = startOfDay(new Date(displayYear, displayMonthIndex, dayNum));
    return cell > startOfDay(new Date());
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Footprints size={24} color={c.primary} />
          </View>
          <Text style={styles.headerTitle}>{t('tabs.report')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.totalStepsContainer}>
          <Footprints size={48} color={c.primary} strokeWidth={2} />
          <Text style={styles.totalStepsValue}>{totalStats.steps.toLocaleString()}</Text>
          <Text style={styles.totalStepsLabel}>{t('report.totalStepsCaption')}</Text>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Clock size={36} color="#FF9800" strokeWidth={2} />
            <Text style={styles.summaryValue}>
              {Math.floor(totalStats.time / 60)}h {totalStats.time % 60}m
            </Text>
            <Text style={styles.summaryLabel}>{t('home.time')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Flame size={36} color="#F44336" strokeWidth={2} />
            <Text style={styles.summaryValue}>{totalStats.calories.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>kcal</Text>
          </View>
          <View style={styles.summaryItem}>
            <MapPin size={36} color="#4CAF50" strokeWidth={2} />
            <Text style={styles.summaryValue}>{totalStats.distance.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>{t('home.km')}</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{t('report.statistics')}</Text>
            <View style={styles.periodNav}>
              <Pressable
                onPress={goPrevWeek}
                style={styles.periodNavBtn}
                accessibilityRole="button"
                accessibilityLabel={t('report.prevWeek')}
              >
                <ChevronLeft size={22} color={c.primary} />
              </Pressable>
              <Text style={styles.weekRangeText} numberOfLines={1}>
                {weekRangeLabel}
              </Text>
              <Pressable
                onPress={goNextWeek}
                style={[styles.periodNavBtn, !canGoNextWeek && styles.periodNavBtnDisabled]}
                disabled={!canGoNextWeek}
                accessibilityRole="button"
                accessibilityLabel={t('report.nextWeek')}
              >
                <ChevronRight size={22} color={canGoNextWeek ? c.primary : c.cardBorder} />
              </Pressable>
            </View>
          </View>

          {weekLoading ? (
            <ActivityIndicator color={c.primary} style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.chartWrapper}>
              <View style={styles.yAxis}>
                {yAxisTicks.map((tick, idx) => (
                  <Text key={idx} style={styles.yAxisLabel}>
                    {formatTickValue(tick, selectedMetric)}
                  </Text>
                ))}
              </View>

              <View style={styles.barChartContainer}>
                <View style={styles.barChart}>
                  {weekBars.map((day, index) => {
                    const value = getMetricValue(day, selectedMetric);
                    const height = Math.min((value / chartMax) * 150, 150);
                    const isTodayBar = day.dateKey === todayKey;
                    return (
                      <Pressable
                        key={day.dateKey}
                        style={styles.barItem}
                        onPress={() => openDayByDateKey(day.dateKey)}
                      >
                        <View style={styles.barWrapper}>
                          <Text style={styles.barValueSmall} numberOfLines={1}>
                            {value >= 1000 && selectedMetric === 'Steps'
                              ? `${(value / 1000).toFixed(1)}k`
                              : selectedMetric === 'Distance'
                                ? value.toFixed(1)
                                : Math.round(value)}
                          </Text>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: Math.max(height, 5),
                                backgroundColor: isTodayBar ? c.primary : c.primarySoft,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>{day.day}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          <View style={styles.metricSelector}>
            {METRIC_KEYS.map((metric) => (
              <Pressable
                key={metric}
                style={[
                  styles.metricButton,
                  selectedMetric === metric && styles.metricButtonActive,
                ]}
                onPress={() => setSelectedMetric(metric)}
              >
                <Text
                  style={[
                    styles.metricButtonText,
                    selectedMetric === metric && styles.metricButtonTextActive,
                  ]}
                >
                  {t(`report.metrics.${metric}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.calendarSection}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarTitle}>{t('report.yourProgress')}</Text>
            <View style={styles.periodNav}>
              <Pressable
                onPress={goPrevMonth}
                style={styles.periodNavBtn}
                accessibilityRole="button"
                accessibilityLabel={t('report.prevMonth')}
              >
                <ChevronLeft size={22} color={c.primary} />
              </Pressable>
              <Text style={styles.monthTitleText} numberOfLines={1}>
                {monthTitle}
              </Text>
              <Pressable
                onPress={goNextMonth}
                style={[styles.periodNavBtn, !canGoNextMonth && styles.periodNavBtnDisabled]}
                disabled={!canGoNextMonth}
                accessibilityRole="button"
                accessibilityLabel={t('report.nextMonth')}
              >
                <ChevronRight size={22} color={canGoNextMonth ? c.primary : c.cardBorder} />
              </Pressable>
            </View>
          </View>

          {monthLoading ? (
            <ActivityIndicator color={c.primary} style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.calendarGrid}>
              {(Array.isArray(calendarWeekdays) ? calendarWeekdays : []).map((day) => (
                <Text key={day} style={styles.calendarDayHeader}>
                  {day}
                </Text>
              ))}
              {Array.from({ length: firstDay }, (_, i) => (
                <View key={`empty-${i}`} style={styles.calendarDay} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const isFuture = isCalendarDayFuture(dayNum);
                const progress = !isFuture ? getCalendarDayProgress(dayNum) : 0;
                const radius = 15;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (progress / 100) * circumference;

                return (
                  <Pressable
                    key={dayNum}
                    style={styles.calendarDay}
                    onPress={() => openDaySheet(dayNum)}
                    disabled={isFuture}
                  >
                    <View style={styles.calendarDayCircleWrapper}>
                      <Svg width={32} height={32} style={styles.calendarDaySvg}>
                        <Circle cx={16} cy={16} r={radius} stroke="#E8E8E8" strokeWidth={2} fill="none" />
                        {!isFuture && progress > 0 && (
                          <Circle
                            cx={16}
                            cy={16}
                            r={radius}
                            stroke={c.primary}
                            strokeWidth={2}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform="rotate(-90 16 16)"
                          />
                        )}
                      </Svg>
                      <View style={styles.calendarDayInner}>
                        <Text
                          style={[
                            styles.calendarDayText,
                            isFuture && styles.calendarDayTextEmpty,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Pressable
            style={styles.allHistoryButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.allHistoryButtonText}>{t('report.allHistory')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={!!sheetDay} transparent animationType="slide" onRequestClose={() => setSheetDay(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetDay(null)}>
          <Pressable style={styles.sheetCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {sheetDay?.dateKey ? new Date(sheetDay.dateKey + 'T12:00:00').toLocaleDateString(localeTag) : ''}
            </Text>
            <View style={styles.sheetStats}>
              <View style={styles.sheetStatBox}>
                <Footprints size={20} color={c.primary} />
                <Text style={styles.sheetStatValue}>
                  {Math.floor(sheetStats?.steps ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.sheetStatLabel}>{t('home.steps')}</Text>
              </View>
              <View style={styles.sheetStatBox}>
                <Coins size={20} color="#F59E0B" />
                <Text style={styles.sheetStatValue}>{tierCoinsForSteps(sheetStats?.steps ?? 0)}</Text>
                <Text style={styles.sheetStatLabel}>{t('account.coins')}</Text>
              </View>
            </View>
            {sheetStats?.isConverted && (
              <Text style={styles.sheetConverted}>{t('report.alreadyConverted')}</Text>
            )}
            <Pressable
              style={[styles.sheetClaimBtn, (converting || sheetStats?.isConverted) && styles.sheetClaimBtnDisabled]}
              onPress={handleClaimDay}
              disabled={converting || sheetStats?.isConverted}
            >
              {converting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sheetClaimText}>{t('report.claimCoins')}</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 30,
    height: 30,
  },
  totalStepsContainer: {
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
  totalStepsValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#000000',
    marginTop: 12,
    marginBottom: 6,
  },
  totalStepsLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 28,
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
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: 10,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  chartSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
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
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  periodNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  periodNavBtn: {
    padding: 6,
  },
  periodNavBtnDisabled: {
    opacity: 0.4,
  },
  weekRangeText: {
    flex: 1,
    fontSize: 13,
    color: '#444444',
    fontWeight: '600',
    textAlign: 'center',
  },
  monthTitleText: {
    flex: 1,
    fontSize: 14,
    color: '#444444',
    fontWeight: '600',
    textAlign: 'center',
  },
  chartWrapper: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 20,
  },
  yAxis: {
    width: 36,
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  yAxisLabel: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  barChartContainer: {
    flex: 1,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 180,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 48,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 150,
    width: '100%',
  },
  barValueSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: c.primary,
    marginBottom: 4,
  },
  bar: {
    width: '70%',
    minHeight: 5,
    borderRadius: 8,
    marginBottom: 5,
  },
  barLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  metricSelector: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  metricButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  metricButtonActive: {
    backgroundColor: c.primary,
  },
  metricButtonText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  metricButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  calendarHeader: {
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDayHeader: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    paddingVertical: 8,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  calendarDayCircleWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarDaySvg: {
    position: 'absolute',
  },
  calendarDayInner: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 12,
    color: c.primary,
    fontWeight: '700',
  },
  calendarDayTextEmpty: {
    color: '#CCCCCC',
    fontWeight: '400',
  },
  allHistoryButton: {
    backgroundColor: c.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
    shadowColor: c.shadowPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  allHistoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.5)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    color: '#111827',
    textAlign: 'center',
  },
  sheetStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  sheetStatBox: {
    flex: 1,
    backgroundColor: c.screenBg,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EAEF',
  },
  sheetStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  sheetStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
  sheetConverted: {
    fontSize: 14,
    color: '#16A34A',
    marginBottom: 12,
    fontWeight: '600',
  },
  sheetClaimBtn: {
    backgroundColor: c.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  sheetClaimBtnDisabled: {
    opacity: 0.5,
  },
  sheetClaimText: {
    color: c.onPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  });
}

export default React.memo(ReportScreen);
