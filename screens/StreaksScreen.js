import { StatusBar } from 'expo-status-bar';
import { Flame } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AppCard from '../components/ui/AppCard';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { getStreak } from '../services/apiService';

export default function StreaksScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader title={t('features.streaks')} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={c.primary} />
      ) : (
        <View style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.flameRing}>
              <Flame size={56} color={c.accent} strokeWidth={2} />
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

function createStyles(theme) {
  const c = theme.colors;
  const { radii, spacing } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    loader: { marginTop: 48 },
    body: { padding: spacing.lg },
    hero: {
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: radii.xl,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    flameRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    count: { fontSize: 64, fontWeight: '800', color: c.primary, letterSpacing: -2 },
    sub: { fontSize: 17, color: c.textSecondary, fontWeight: '600', marginTop: 4 },
    tipTitle: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
    tipBody: { fontSize: 14, color: c.textSecondary, lineHeight: 21, marginTop: 6 },
    meta: { fontSize: 13, color: c.textMuted, marginTop: spacing.md },
  });
}
