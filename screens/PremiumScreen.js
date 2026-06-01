import { StatusBar } from 'expo-status-bar';
import { Check, Crown } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ui/ScreenHeader';
import { colors, radii, spacing } from '../constants/theme';
import { buyPremium, getPremiumStatus } from '../services/apiService';

export default function PremiumScreen() {
  const { t } = useTranslation();
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
      <StatusBar style="dark" />
      <ScreenHeader title={t('features.premium')} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <View style={styles.body}>
          <View style={styles.hero}>
            <View style={styles.crownWrap}>
              <Crown size={48} color={colors.accent} />
            </View>
            <Text style={styles.h1}>{t('premium.title')}</Text>
            <Text style={styles.price}>
              {status?.price_coins} {t('premium.coinsFor30')}
            </Text>
          </View>
          <View style={styles.perksCard}>
            {perks.map((p) => (
              <View key={p} style={styles.perkRow}>
                <Check size={18} color={colors.success} strokeWidth={3} />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: 48 },
  body: { padding: spacing.lg },
  hero: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: spacing.md,
  },
  crownWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  h1: { fontSize: 22, fontWeight: '800', color: colors.text },
  price: { fontSize: 18, fontWeight: '700', color: colors.primary, marginTop: 8 },
  perksCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkText: { flex: 1, fontSize: 15, color: colors.textSecondary, lineHeight: 21 },
  active: { textAlign: 'center', color: colors.success, fontWeight: '700', fontSize: 16 },
});
