import { StatusBar } from 'expo-status-bar';
import { Check, Crown } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { buyPremium, getPremiumStatus } from '../services/apiService';

export default function PremiumScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getPremiumStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const perks = [t('premium.perk1'), t('premium.perk2')];

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader title={t('features.premium')} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={c.primary} />
      ) : (
        <View style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.crownWrap}>
              <Crown size={48} color={c.accent} />
            </View>
            <Text style={styles.h1}>{t('premium.title')}</Text>
            <Text style={styles.price}>
              {status?.price_coins} {t('premium.coinsFor30')}
            </Text>
          </View>
          <View style={styles.perksCard}>
            {perks.map((p) => (
              <View key={p} style={styles.perkRow}>
                <Check size={18} color={c.success} strokeWidth={3} />
                <Text style={styles.perkText}>{p}</Text>
              </View>
            ))}
          </View>
          {status?.active ? (
            <Text style={styles.active}>
              {t('premium.activeUntil', { date: String(status.premium_until).slice(0, 10) })}
            </Text>
          ) : (
            <PrimaryButton
              label={t('premium.buy')}
              loading={buying}
              onPress={async () => {
                setBuying(true);
                try {
                  await buyPremium();
                  Alert.alert(t('common.success'), t('premium.bought', { date: '' }));
                  load();
                } catch (e) {
                  Alert.alert(t('common.error'), e.message);
                } finally {
                  setBuying(false);
                }
              }}
            />
          )}
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
      backgroundColor: c.warningBg,
      borderRadius: radii.xl,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: c.warningBorder,
      marginBottom: spacing.md,
    },
    crownWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    h1: { fontSize: 22, fontWeight: '800', color: c.textPrimary },
    price: { fontSize: 18, fontWeight: '700', color: c.primary, marginTop: 8 },
    perksCard: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    perkText: { flex: 1, fontSize: 15, color: c.textSecondary, lineHeight: 21 },
    active: { textAlign: 'center', color: c.success, fontWeight: '700', fontSize: 16 },
  });
}
