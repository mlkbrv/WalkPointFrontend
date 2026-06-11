import { StatusBar } from 'expo-status-bar';
import { Coins, Heart, ShoppingBag } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import StrideHeader from '../components/stride/StrideHeader';
import MarketShortcuts from '../components/market/MarketShortcuts';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/ui/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { getCouponsByCategory, getFavoriteCoupons, toggleFavoriteCoupon } from '../services/apiService';

const CATEGORIES = [
  { key: '', labelKey: 'market.categoryAll' },
  { key: 'food', labelKey: 'market.categoryFood' },
  { key: 'sport', labelKey: 'market.categorySport' },
  { key: 'beauty', labelKey: 'market.categoryBeauty' },
  { key: 'other', labelKey: 'market.categoryOther' },
];

const STEPS_DEFAULT = 5000;
const BRAND_PALETTE = ['#7C3AED', '#059669', '#D97706', '#2563EB', '#DB2777', '#0D9488'];

export default function MarketScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { availableSteps } = useApp();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  const loadFavorites = useCallback(async () => {
    try {
      const data = await getFavoriteCoupons();
      const list = Array.isArray(data) ? data : [];
      setFavoriteIds(new Set(list.map((x) => x.id)));
    } catch {
      setFavoriteIds(new Set());
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCouponsByCategory(category || undefined);
      setCoupons(Array.isArray(data) ? data : data.results || []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchCoupons();
    loadFavorites();
  }, [fetchCoupons, loadFavorites]);

  const onToggleFavorite = async (e, templateId) => {
    e?.stopPropagation?.();
    try {
      const r = await toggleFavoriteCoupon(templateId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (r.is_favorite) next.add(templateId);
        else next.delete(templateId);
        return next;
      });
    } catch (_) {}
  };

  const onCouponPress = (item) => {
    if (item.partner) {
      navigation.navigate('BrandStore', { brandId: item.partner, brandName: item.partner_name });
      return;
    }
    navigation.navigate('CouponDetail', { coupon: item, templateId: item.id });
  };

  const renderCoupon = ({ item }) => {
    const steps = item.steps_price ?? item.steps_to_redeem ?? item.steps_required;
    const priceCoins = item.price ? Math.round(parseFloat(item.price)) : null;
    const stepsLabel = steps
      ? t('market.stepsPrice', { steps: Number(steps).toLocaleString() })
      : priceCoins
        ? t('market.coinsShort', { coins: priceCoins })
        : t('common.notAvailable');
    const offer = item.title || item.template_title || t('market.offerFallback');
    const partner = item.partner_name || t('common.partner');
    const cat = CATEGORIES.find((x) => x.key === item.category);
    const categoryLabel = cat?.key ? t(cat.labelKey) : '';
    const brandBg = BRAND_PALETTE[(partner.length + (item.id || 0)) % BRAND_PALETTE.length];
    const isFav = favoriteIds.has(item.id);

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
        onPress={() => onCouponPress(item)}
      >
        <Pressable style={styles.favHit} onPress={(e) => onToggleFavorite(e, item.id)}>
          <Heart
            size={18}
            color={isFav ? c.danger : c.textMuted}
            fill={isFav ? c.dangerSoft : 'transparent'}
          />
        </Pressable>
        <View style={[styles.brandBlock, { backgroundColor: brandBg }]}>
          <Text style={styles.brandLetter}>{partner.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardContent}>
          {categoryLabel ? <Text style={styles.catTag}>{categoryLabel}</Text> : null}
          <Text style={styles.offer} numberOfLines={2}>
            {offer}
          </Text>
          <Text style={styles.partner} numberOfLines={1}>
            {partner}
          </Text>
          <View style={styles.priceRow}>
            <Coins size={14} color={c.accent} strokeWidth={2.5} />
            <Text style={styles.price}>{stepsLabel}</Text>
          </View>
          <View style={styles.getRow}>
            <ShoppingBag size={16} color={c.onPrimary} />
            <Text style={styles.getText}>{t('common.get')}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <StrideHeader
        showBrand
        avatarUri={user?.avatar}
        showSteps
        steps={availableSteps}
        onProfile={() => navigation.getParent()?.navigate('Profile', { screen: 'ProfileMain' })}
        onNotifications={() => navigation.navigate('Notifications')}
      />
      <MarketShortcuts navigation={navigation} t={t} variant="light" />

      <View style={styles.sheet}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.key;
            return (
              <Pressable
                key={cat.key || 'all'}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategory(cat.key)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t(cat.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={c.primary} size="large" />
        ) : coupons.length === 0 ? (
          <EmptyState icon={ShoppingBag} title={t('market.empty')} message={t('market.emptyHint')} />
        ) : (
          <FlatList
            data={coupons}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCoupon}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { spacing, radii, typography, shadow } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    sheet: {
      flex: 1,
      backgroundColor: c.screenBg,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      marginTop: 8,
    },
    chips: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radii.pill,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    chipActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipText: {
      ...typography.caption,
      color: c.textSecondary,
      fontWeight: '600',
    },
    chipTextActive: {
      color: c.onPrimary,
    },
    loader: { marginTop: 48 },
    list: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl + 24,
    },
    gridRow: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    card: {
      flex: 1,
      maxWidth: '48%',
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      overflow: 'hidden',
      ...shadow.card,
    },
    favHit: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 2,
      padding: 4,
    },
    brandBlock: {
      height: 88,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandLetter: {
      fontSize: 36,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    cardContent: {
      padding: spacing.sm,
    },
    catTag: {
      ...typography.caption,
      fontSize: 10,
      color: c.primary,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    offer: {
      ...typography.subtitle,
      fontSize: 15,
      color: c.textPrimary,
      marginBottom: 2,
      minHeight: 40,
    },
    partner: {
      ...typography.caption,
      color: c.textSecondary,
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 10,
    },
    price: {
      ...typography.subtitle,
      fontSize: 14,
      color: c.accent,
    },
    getRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: c.primary,
      paddingVertical: 10,
      borderRadius: radii.md,
    },
    getText: {
      ...typography.caption,
      color: c.onPrimary,
      fontWeight: '700',
    },
  });
}
