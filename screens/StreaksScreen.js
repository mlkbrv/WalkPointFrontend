import { StatusBar } from 'expo-status-bar';
import { Flame } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AppCard from '../components/ui/AppCard';
import ScreenHeader from '../components/ui/ScreenHeader';
import { colors, radii, spacing } from '../constants/theme';
import { getStreak } from '../services/apiService';

export default function StreaksScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getStreak()
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title={t('features.streaks')} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <View style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.flameRing}>
              <Flame size={56} color={colors.accent} strokeWidth={2} />
            </View>
            <Text style={styles.count}>{data?.current_streak ?? 0}</Text>
            <Text style={styles.sub}>{t('streaks.daysInRow')}</Text>
          </View>
          <AppCard accent>
            <Text style={styles.tipTitle}>{t('streaks.tipTitle')}</Text>
            <Text style={styles.tipBody}>{t('streaks.tipBody')}</Text>
            {data?.last_qualified_date ? (
              <Text style={styles.meta}>{t('streaks.lastDay', { date: data.last_qualified_date })}</Text>
            ) : null}
          </AppCard>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: 48 },
  body: { padding: spacing.lg },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flameRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  count: { fontSize: 64, fontWeight: '800', color: colors.primary, letterSpacing: -2 },
  sub: { fontSize: 17, color: colors.textSecondary, fontWeight: '600', marginTop: 4 },
  tipTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  tipBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginTop: 6 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md },
});
