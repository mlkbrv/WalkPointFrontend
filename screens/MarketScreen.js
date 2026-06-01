import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Heart, Menu, ShoppingBag } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { getCouponsByCategory, getFavoriteCoupons, toggleFavoriteCoupon } from '../services/apiService';

const CATEGORIES = [
  { key: '', labelKey: 'market.categoryAll' },
  { key: 'food', labelKey: 'market.categoryFood' },
  { key: 'sport', labelKey: 'market.categorySport' },
  { key: 'beauty', labelKey: 'market.categoryBeauty' },
  { key: 'other', labelKey: 'market.categoryOther' },
];

const STEPS_DEFAULT = 5000;
const SPACE = { xs: 8, sm: 16, md: 24, lg: 32 };
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
};

export default function MarketScreen({ navigation }) {
  const { t } = useTranslation();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  const loadFavorites = useCallback(async () => {
    try {
      const data = await getFavoriteCoupons();
      const list = Array.isArray(data) ? data : [];
      setFavoriteIds(new Set(list.map((c) => c.id)));
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
    const stepsRequired = item.steps_to_redeem ?? item.steps_required ?? STEPS_DEFAULT;
    navigation.navigate('CouponRedeem', {
      coupon: item,
      stepsRequired: Number(stepsRequired) || STEPS_DEFAULT,
    });
  };

  const renderCoupon = ({ item }) => {
    const steps = item.steps_to_redeem ?? item.steps_required ?? (parseFloat(item.price) ? undefined : STEPS_DEFAULT);
    const stepsLabel = steps
      ? t('market.stepsPrice', { steps: Number(steps).toLocaleString() })
      : item.price
        ? t('market.coinsShort', { coins: Math.round(parseFloat(item.price)) })
        : t('common.notAvailable');
    const offer = item.title || item.template_title || t('market.offerFallback');
    const partner = item.partner_name || t('common.partner');
    const cat = CATEGORIES.find((c) => c.key === item.category);
    const categoryLabel = cat?.key ? t(cat.labelKey) : '';
    const brandColors = ['#00704A', '#E31837', '#FFC72C', '#8140F3', '#2196F3', '#9C27B0'];
    const colorIndex = (partner.length + (item.id || 0)) % brandColors.length;
    const brandBg = brandColors[colorIndex];

    const isFav = favoriteIds.has(item.id);

    return (
      <Pressable
        style={({ pressed }) => [styles.cardWrap, pressed && styles.cardPressed]}
        onPress={() => onCouponPress(item)}
      >
        <Pressable style={styles.favBtn} onPress={(e) => onToggleFavorite(e, item.id)}>
          <Heart size={18} color={isFav ? '#EF4444' : '#9CA3AF'} fill={isFav ? '#FEE2E2' : 'transparent'} />
        </Pressable>
        <View style={styles.ticketCard}>
          <View style={[styles.brandSquare, { backgroundColor: brandBg }]}>
            <Text style={styles.brandLetter}>{(partner || 'P').charAt(0)}</Text>
          </View>
          <View style={styles.dashedDivider} />
          <View style={styles.cardBody}>
            <Text style={styles.offerLabel} numberOfLines={2}>{offer}</Text>
            <Text style={styles.partnerLabel} numberOfLines={1}>{partner}</Text>
            {categoryLabel ? (
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {categoryLabel}
              </Text>
            ) : null}
            <Text style={styles.stepsPrice}>{stepsLabel}</Text>
          </View>
          <View style={styles.getButton}>
            <ShoppingBag size={18} color="#FFF" />
            <Text style={styles.getButtonText}>{t('common.get')}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>{t('market.title')}</Text>
        <Pressable style={styles.headerBtn} onPress={() => navigation.navigate('Favorites')}>
          <Menu size={24} color="#1a1a1a" />
        </Pressable>
      </View>

      <View style={styles.chipsRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c.key || 'all'}
            style={[styles.chip, category === c.key && styles.chipActive]}
            onPress={() => setCategory(c.key)}
          >
            <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>
              {t(c.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8140F3" />
        </View>
      ) : coupons.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('market.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCoupon}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EAEF',
  },
  chipActive: {
    backgroundColor: '#8140F3',
    borderColor: '#8140F3',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.sm,
    paddingTop: 50,
    paddingBottom: SPACE.sm,
    backgroundColor: '#F8F9FB',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: SPACE.sm,
    paddingBottom: SPACE.lg + 56,
    paddingTop: SPACE.xs,
  },
  row: {
    gap: SPACE.sm,
    marginBottom: SPACE.sm,
    justifyContent: 'space-between',
  },
  cardWrap: {
    flex: 1,
    maxWidth: '48%',
    position: 'relative',
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    padding: 6,
  },
  cardPressed: {
    opacity: 0.92,
  },
  ticketCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 0,
    ...CARD_SHADOW,
  },
  brandSquare: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandLetter: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  dashedDivider: {
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginHorizontal: SPACE.sm,
  },
  cardBody: {
    padding: SPACE.sm,
  },
  offerLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  partnerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 2,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  stepsPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#8140F3',
  },
  getButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8140F3',
    marginHorizontal: SPACE.sm,
    marginBottom: SPACE.sm,
    paddingVertical: SPACE.xs,
    borderRadius: 12,
    gap: 6,
  },
  getButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
});
