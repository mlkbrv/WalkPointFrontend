import { StatusBar } from 'expo-status-bar';
import { Heart } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { getFavoriteCoupons } from '../services/apiService';

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
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
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader title={t('features.favorites')} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={c.primary} />
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
                <Heart size={18} color={c.danger} fill={c.dangerSoft} />
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
              <Heart size={40} color={c.textMuted} />
              <Text style={styles.empty}>{t('favorites.empty')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { radii, shadow, spacing } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    loader: { marginTop: 48 },
    list: { padding: spacing.md, paddingBottom: spacing.xl },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.cardBorder,
      gap: spacing.md,
      ...shadow.card,
    },
    heart: {
      width: 40,
      height: 40,
      borderRadius: radii.sm,
      backgroundColor: c.dangerSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1 },
    titleText: { fontSize: 16, fontWeight: '700', color: c.textPrimary },
    sub: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
    price: { fontSize: 15, fontWeight: '800', color: c.primary },
    emptyWrap: { alignItems: 'center', marginTop: 48, gap: spacing.sm },
    empty: { color: c.textSecondary, fontSize: 15 },
  });
}
