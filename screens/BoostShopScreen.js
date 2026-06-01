import { StatusBar } from 'expo-status-bar';
import { Zap } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import PrimaryButton from '../components/ui/PrimaryButton';
import ScreenHeader from '../components/ui/ScreenHeader';
import { colors, radii, shadow, spacing } from '../constants/theme';
import { buyBoost, getBoosts } from '../services/apiService';

export default function BoostShopScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getBoosts()
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title={t('features.boosts')} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  <Zap size={24} color={colors.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.desc}>{item.description}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>x{item.multiplier}</Text>
                </View>
                <Text style={styles.price}>
                  {item.price_coins} {t('boosts.coins')}
                </Text>
              </View>
              <PrimaryButton
                label={t('boosts.buy')}
                loading={buying === item.slug}
                onPress={async () => {
                  setBuying(item.slug);
                  try {
                    const r = await buyBoost(item.slug);
                    Alert.alert(t('common.success'), t('boosts.bought', { balance: r.new_balance }));
                  } catch (e) {
                    Alert.alert(t('common.error'), e.message);
                  } finally {
                    setBuying(null);
                  }
                }}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: 48 },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardTop: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  desc: { color: colors.textSecondary, marginTop: 4, fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  pill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  pillText: { fontWeight: '800', color: colors.primary, fontSize: 13 },
  price: { fontWeight: '700', color: colors.text, fontSize: 15 },
});
