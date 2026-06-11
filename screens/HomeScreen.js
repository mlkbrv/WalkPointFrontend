import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { ArrowUpRight, ChevronRight, Clock, Flame, Route } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import StrideHeader from '../components/stride/StrideHeader';
import ProgressRing from '../components/ui/ProgressRing';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getBrands } from '../services/apiService';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { dailyStats, todayMetrics, weeklyProgress, syncStepsFromSystem, loadWeeklyProgress } = useApp();

  const [brands, setBrands] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const steps = dailyStats?.steps ?? todayMetrics?.steps ?? 0;
  const goal = user?.step_goal ?? 10000;
  const calories = todayMetrics?.activeCalories ?? dailyStats?.calories ?? 0;
  const distanceKm = todayMetrics?.distanceM
    ? todayMetrics.distanceM / 1000
    : dailyStats?.distance ?? 0;
  const activeMinutes = todayMetrics?.activeMinutes ?? dailyStats?.time ?? 0;

  const loadBrands = useCallback(async () => {
    try {
      const data = await getBrands(true);
      setBrands(Array.isArray(data) ? data : data.results || []);
    } catch {
      setBrands([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBrands();
      loadWeeklyProgress?.();
    }, [loadBrands, loadWeeklyProgress]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await syncStepsFromSystem?.();
    await loadBrands();
    await loadWeeklyProgress?.();
    setRefreshing(false);
  };

  const weekBars = weeklyProgress?.length ? weeklyProgress.slice(-7) : [];
  const maxWeek = Math.max(...weekBars.map((d) => d.steps || 0), 1);

  return (
    <View style={[styles.root, { backgroundColor: c.screenBg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <StrideHeader
        showBrand
        avatarUri={user?.avatar}
        onProfile={() => navigation.getParent()?.navigate('Profile', { screen: 'ProfileMain' })}
        onNotifications={() => navigation.navigate('Notifications')}
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
      >
        <View style={styles.ringSection}>
          <ProgressRing value={steps} max={goal} size={256} strokeWidth={12}>
            <Text style={[styles.stepsBig, { color: c.textPrimary }]}>{steps.toLocaleString()}</Text>
            <Text style={[styles.goalLabel, { color: c.textSecondary }]}>
              {t('home.goal', { count: goal.toLocaleString() })}
            </Text>
          </ProgressRing>
          <Pressable
            style={[styles.trackBtn, { backgroundColor: c.primary }]}
            onPress={() => navigation.getParent()?.navigate('Track')}
          >
            <Text style={[styles.trackBtnText, { color: c.onPrimary }]}>{t('home.startTracking')}</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Flame size={20} color="#EF4444" />
            <Text style={[styles.statValue, { color: c.textPrimary }]}>{Math.round(calories)}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>kcal</Text>
          </View>
          <View style={[styles.statCard, styles.statHighlight, { backgroundColor: c.card, borderColor: `${c.primary}66` }]}>
            <Route size={20} color={c.primary} />
            <Text style={[styles.statValue, { color: c.textPrimary }]}>{Number(distanceKm).toFixed(1)}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>km</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            <Clock size={20} color={c.success} />
            <Text style={[styles.statValue, { color: c.textPrimary }]}>{activeMinutes}</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>mins</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{t('home.trendingRewards')}</Text>
            <Pressable onPress={() => navigation.getParent()?.navigate('Market', { screen: 'CouponStore' })} style={styles.viewAll}>
              <Text style={[styles.viewAllText, { color: c.primary }]}>{t('common.viewAll')}</Text>
              <ArrowUpRight size={14} color={c.primary} />
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandsRow}>
            {brands.map((brand) => (
              <Pressable
                key={brand.id}
                style={[styles.brandCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
                onPress={() =>
                  navigation.navigate('BrandStore', {
                    brandId: brand.id,
                    brandName: brand.brand_name,
                  })
                }
              >
                {brand.logo_url ? (
                  <Image source={{ uri: brand.logo_url }} style={styles.brandLogo} contentFit="contain" />
                ) : (
                  <View style={[styles.brandLogo, { backgroundColor: c.primarySoft }]} />
                )}
                <Text style={[styles.brandName, { color: c.textSecondary }]} numberOfLines={1}>
                  {brand.brand_name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable
          style={[styles.momentumCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}
          onPress={() => navigation.navigate('ReportMain')}
        >
          <View style={styles.momentumHead}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{t('home.weeklyMomentum')}</Text>
            <ChevronRight size={18} color={c.primary} />
          </View>
          <View style={styles.bars}>
            {(weekBars.length ? weekBars : Array.from({ length: 7 }, (_, i) => ({ steps: 0, day: i }))).map((d, i) => (
              <View
                key={`${d.date || i}`}
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(12, ((d.steps || 0) / maxWeek) * 100)}%`,
                    backgroundColor: i === weekBars.length - 1 ? c.primary : c.cardBorder,
                  },
                ]}
              />
            ))}
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  const { radii, spacing } = theme;
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: spacing.md, paddingBottom: 120 },
    ringSection: { alignItems: 'center', paddingVertical: spacing.lg },
    stepsBig: { fontSize: 44, fontWeight: '900', fontVariant: ['tabular-nums'] },
    goalLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
    trackBtn: { marginTop: spacing.lg, paddingHorizontal: 32, paddingVertical: 14, borderRadius: radii.pill },
    trackBtnText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
    statsGrid: { flexDirection: 'row', gap: 10, marginBottom: spacing.lg },
    statCard: { flex: 1, borderRadius: radii.lg, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6 },
    statHighlight: { borderBottomWidth: 2 },
    statValue: { fontSize: 20, fontWeight: '800' },
    statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    section: { marginBottom: spacing.lg },
    sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewAllText: { fontSize: 11, fontWeight: '700' },
    brandsRow: { gap: 12, paddingRight: spacing.md },
    brandCard: { width: 112, borderRadius: radii.lg, borderWidth: 1, padding: 12, alignItems: 'center', gap: 8 },
    brandLogo: { width: 56, height: 56, borderRadius: 28 },
    brandName: { fontSize: 11, fontWeight: '700' },
    momentumCard: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.lg },
    momentumHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 80 },
    bar: { flex: 1, borderRadius: radii.pill, minHeight: 8 },
  });
}
