import { StatusBar } from 'expo-status-bar';
import { Coins, Target } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AppCard from '../components/ui/AppCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { claimChallenge, getActiveChallenge } from '../services/apiService';

export default function ChallengesScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getActiveChallenge()
      .then(setChallenge)
      .catch(() => setChallenge(null))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onClaim = async () => {
    setClaiming(true);
    try {
      const r = await claimChallenge();
      Alert.alert(t('common.success'), t('challenges.claimed', { coins: r.reward_coins }));
      load();
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setClaiming(false);
    }
  };

  const pct = challenge ? Math.min(100, Math.round((challenge.steps_total / challenge.goal_steps) * 100)) : 0;

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader title={t('features.challenges')} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={c.primary} />
      ) : challenge ? (
        <View style={styles.body}>
          <AppCard>
            <View style={styles.titleRow}>
              <View style={styles.iconWrap}>
                <Target size={22} color={c.primary} />
              </View>
              <Text style={styles.cardTitle}>{challenge.title}</Text>
            </View>
            <View style={styles.statsRow}>
              <Text style={styles.progressNum}>{challenge.steps_total.toLocaleString()}</Text>
              <Text style={styles.progressOf}>/ {challenge.goal_steps.toLocaleString()}</Text>
              <Text style={styles.pct}>{pct}%</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${pct}%` }]} />
            </View>
            <View style={styles.rewardRow}>
              <Coins size={18} color={c.accent} />
              <Text style={styles.reward}>{t('challenges.reward', { coins: challenge.reward_coins })}</Text>
            </View>
            {challenge.completed && !challenge.claimed ? (
              <PrimaryButton label={t('challenges.claim')} onPress={onClaim} loading={claiming} />
            ) : null}
            {challenge.claimed ? <Text style={styles.done}>{t('challenges.done')}</Text> : null}
          </AppCard>
        </View>
      ) : (
        <Text style={styles.empty}>{t('challenges.empty')}</Text>
      )}
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { radii, spacing } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    loader: { marginTop: 48 },
    body: { padding: spacing.lg },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radii.sm,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: c.textPrimary },
    statsRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.sm },
    progressNum: { fontSize: 28, fontWeight: '800', color: c.textPrimary },
    progressOf: { fontSize: 15, color: c.textMuted, marginLeft: 4 },
    pct: { marginLeft: 'auto', fontSize: 15, fontWeight: '700', color: c.primary },
    barBg: {
      height: 12,
      backgroundColor: c.cardBorder,
      borderRadius: radii.pill,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    barFill: { height: '100%', backgroundColor: c.primary, borderRadius: radii.pill },
    rewardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
    reward: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
    done: { textAlign: 'center', color: c.success, fontWeight: '700', fontSize: 15 },
    empty: { textAlign: 'center', marginTop: 48, color: c.textSecondary, fontSize: 16 },
  });
}
