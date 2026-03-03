import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Menu, ShoppingBag } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getCoupons } from '../services/apiService';

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
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    try {
      const data = await getCoupons();
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

  const onCouponPress = (item) => {
    const stepsRequired = item.steps_to_redeem ?? item.steps_required ?? STEPS_DEFAULT;
    navigation.navigate('CouponRedeem', {
      coupon: item,
      stepsRequired: Number(stepsRequired) || STEPS_DEFAULT,
    });
  };

  const renderCoupon = ({ item }) => {
    const steps = item.steps_to_redeem ?? item.steps_required ?? (parseFloat(item.price) ? undefined : STEPS_DEFAULT);
    const stepsLabel = steps ? `${Number(steps).toLocaleString()} Steps` : (item.price ? `${Math.round(parseFloat(item.price))}c` : '—');
    const offer = item.title || item.template_title || 'Offer';
    const partner = item.partner_name || 'Partner';
    const category = item.category || item.description || '';
    const brandColors = ['#00704A', '#E31837', '#FFC72C', '#8140F3', '#2196F3', '#9C27B0'];
    const colorIndex = (partner.length + (item.id || 0)) % brandColors.length;
    const brandBg = brandColors[colorIndex];

    return (
      <Pressable
        style={({ pressed }) => [styles.cardWrap, pressed && styles.cardPressed]}
        onPress={() => onCouponPress(item)}
      >
        <View style={styles.ticketCard}>
          <View style={[styles.brandSquare, { backgroundColor: brandBg }]}>
            <Text style={styles.brandLetter}>{(partner || 'P').charAt(0)}</Text>
          </View>
          <View style={styles.dashedDivider} />
          <View style={styles.cardBody}>
            <Text style={styles.offerLabel} numberOfLines={2}>{offer}</Text>
            <Text style={styles.partnerLabel} numberOfLines={1}>{partner}</Text>
            {category ? <Text style={styles.categoryLabel} numberOfLines={1}>{category}</Text> : null}
            <Text style={styles.stepsPrice}>{stepsLabel}</Text>
          </View>
          <View style={styles.getButton}>
            <ShoppingBag size={18} color="#FFF" />
            <Text style={styles.getButtonText}>Get</Text>
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
        <Text style={styles.headerTitle}>Coupones Store</Text>
        <Pressable style={styles.headerBtn}>
          <Menu size={24} color="#1a1a1a" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8140F3" />
        </View>
      ) : coupons.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No coupons available yet</Text>
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
