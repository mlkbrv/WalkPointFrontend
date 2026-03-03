import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Menu } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getMyCoupons } from '../services/apiService';

const BRAND_COLORS = {
  default: '#8140F3',
  McDonalds: '#FFC72C',
  KFC: '#E31837',
  Starbucks: '#00704A',
  Vapiano: '#E31837',
  AJIO: '#333',
};

const SPACE = { xs: 8, sm: 16, md: 24, lg: 32 };
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
};

const getBrandColor = (partnerName) => {
  if (!partnerName) return BRAND_COLORS.default;
  const key = Object.keys(BRAND_COLORS).find(
    (k) => k !== 'default' && partnerName.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? BRAND_COLORS[key] : BRAND_COLORS.default;
};

export default function MyCouponsScreen({ navigation }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    try {
      const data = await getMyCoupons();
      setCoupons(Array.isArray(data) ? data : data.results || []);
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchCoupons);
    return unsubscribe;
  }, [navigation, fetchCoupons]);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const onCouponPress = (item) => {
    navigation.navigate('CouponDetail', {
      coupon: {
        ...item,
        template_title: item.template_title || item.title,
        unique_code: item.unique_code,
        partner_name: item.partner_name,
        valid_until: item.valid_until || item.expires_at,
        created_at: item.created_at,
        description: item.description,
      },
    });
  };

  const renderCoupon = ({ item }) => {
    const brandColor = getBrandColor(item.partner_name);
    const offerText = item.template_title || item.title || 'Offer';
    const validUntil = item.valid_until || item.expires_at || item.created_at;

    return (
      <Pressable
        style={({ pressed }) => [styles.cardOuter, pressed && styles.cardPressed]}
        onPress={() => onCouponPress(item)}
      >
        <View style={styles.ticketCard}>
          <View style={styles.couponInner}>
            <View style={[styles.couponLeft, { backgroundColor: brandColor }]}>
              <Text style={styles.couponLogoText}>{(item.partner_name || 'P').charAt(0)}</Text>
            </View>
            <View style={styles.dashedEdge} />
            <View style={styles.couponRight}>
              <Text style={styles.couponOffer}>{offerText}</Text>
              <Text style={styles.couponPartner}>{item.partner_name || 'Partner'}</Text>
              <Text style={styles.couponValid}>Valid until {formatDate(validUntil)}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.punch, styles.punchLeftTop]} />
        <View style={[styles.punch, styles.punchLeftBottom]} />
        <View style={[styles.punch, styles.punchRightTop]} />
        <View style={[styles.punch, styles.punchRightBottom]} />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => navigation.getParent()?.goBack?.() ?? navigation.goBack()}
        >
          <ArrowLeft size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>My Coupons</Text>
        <Pressable style={styles.headerBtn}>
          <Menu size={24} color="#FFF" />
        </Pressable>
      </View>

      <View style={styles.contentArea}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#8140F3" />
          </View>
        ) : coupons.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyEmoji}>🎟️</Text>
            <Text style={styles.emptyTitle}>No Coupons Yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Buy new coupon" below to get coupons from the store.
            </Text>
          </View>
        ) : (
          <FlatList
            data={coupons}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCoupon}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Pressable
          style={({ pressed }) => [styles.buyNewBtn, pressed && styles.buyNewBtnPressed]}
          onPress={() => navigation.navigate('CouponStore')}
        >
          <Text style={styles.buyNewBtnText}>Buy new coupon</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8140F3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE.sm,
    paddingTop: 50,
    paddingBottom: SPACE.sm,
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
    color: '#FFF',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: SPACE.md,
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACE.lg,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACE.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: SPACE.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: SPACE.sm,
    paddingTop: SPACE.xs,
    paddingBottom: 100,
    gap: SPACE.sm,
  },
  cardOuter: {
    position: 'relative',
    marginHorizontal: SPACE.xs,
  },
  cardPressed: {
    opacity: 0.92,
  },
  ticketCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginHorizontal: 8,
    ...CARD_SHADOW,
  },
  punch: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FB',
  },
  punchLeftTop: { left: 0, top: 24 },
  punchLeftBottom: { left: 0, bottom: 24 },
  punchRightTop: { right: 0, top: 24 },
  punchRightBottom: { right: 0, bottom: 24 },
  couponInner: {
    flexDirection: 'row',
    minHeight: 104,
  },
  couponLeft: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponLogoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
  },
  dashedEdge: {
    width: 12,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    marginLeft: 4,
  },
  couponRight: {
    flex: 1,
    paddingVertical: SPACE.sm,
    paddingRight: SPACE.sm,
    paddingLeft: SPACE.xs,
    justifyContent: 'center',
  },
  couponOffer: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  couponPartner: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  couponValid: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
  },
  buyNewBtn: {
    position: 'absolute',
    bottom: SPACE.md,
    left: SPACE.sm,
    right: SPACE.sm,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#C4B5FD',
    paddingVertical: SPACE.sm,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  buyNewBtnPressed: {
    opacity: 0.92,
  },
  buyNewBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5E35B1',
  },
});
