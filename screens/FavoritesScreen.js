import { StatusBar } from 'expo-status-bar';
import { Heart } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ui/ScreenHeader';
import { colors, radii, shadow, spacing } from '../constants/theme';
import { getFavoriteCoupons } from '../services/apiService';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getFavoriteCoupons()
        .then((d) => setRows(Array.isArray(d) ? d : []))
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title={t('features.favorites')} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('CouponDetail', { coupon: item })}
            >
              <View style={styles.heart}>
                <Heart size={18} color="#EF4444" fill="#FEE2E2" />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.titleText}>{item.title}</Text>
                <Text style={styles.sub}>{item.partner_name}</Text>
              </View>
              <Text style={styles.price}>{Math.round(parseFloat(item.price))}c</Text>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Heart size={40} color={colors.textMuted} />
              <Text style={styles.empty}>{t('favorites.empty')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { marginTop: 48 },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.card,
  },
  heart: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  titleText: { fontSize: 16, fontWeight: '700', color: colors.text },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '800', color: colors.primary },
  emptyWrap: { alignItems: 'center', marginTop: 48, gap: spacing.sm },
  empty: { color: colors.textSecondary, fontSize: 15 },
});
