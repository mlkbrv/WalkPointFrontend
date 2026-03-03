import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Alert, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useApp } from '../context/AppContext';
import { buyCoupon } from '../services/apiService';

const { width } = Dimensions.get('window');
const SPACE = { xs: 8, sm: 16, md: 24, lg: 32 };
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
};

const BRAND_COLORS = ['#E31837', '#00704A', '#FFC72C', '#8140F3', '#2196F3'];
const getBrandColor = (name) => BRAND_COLORS[(name || '').length % BRAND_COLORS.length];

export default function CouponRedeemScreen({ route, navigation }) {
  const { walletBalance, refreshWallet } = useApp();
  const coupon = route.params?.coupon || {};
  const stepsRequired = route.params?.stepsRequired ?? 5000;
  const title = coupon.title || coupon.template_title || 'Offer';
  const partner = coupon.partner_name || 'Partner';
  const price = parseFloat(coupon.price || 0);
  const validUntil = coupon.valid_until || coupon.expires_at;
  const brandBg = getBrandColor(partner);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleRedeem = () => {
    const balance = parseFloat(walletBalance);
    if (price > 0 && balance < price) {
      Alert.alert(
        'Insufficient Balance',
        `You need ${price} coins. Your balance: ${balance.toFixed(0)}. Walk more to earn coins!`,
      );
      return;
    }
    if (price > 0) {
      Alert.alert(
        'Redeem Coupon',
        `Spend ${price} coins to get this coupon?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Redeem',
            onPress: async () => {
              try {
                await buyCoupon(coupon.id);
                refreshWallet();
                Alert.alert('Success', 'Coupon added to My Coupons!');
                navigation.navigate('MyCoupons');
              } catch (e) {
                Alert.alert('Error', e.message);
              }
            },
          },
        ],
      );
    } else {
      Alert.alert('Info', `${stepsRequired} steps required. Keep walking to unlock!`);
    }
  };

  const ringSize = width * 0.45;
  const strokeWidth = 12;
  const r = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.couponRow}>
          <View style={[styles.brandLogo, { backgroundColor: brandBg }]}>
            <Text style={styles.brandText}>{partner.charAt(0)}</Text>
          </View>
          <View style={styles.couponRight}>
            <View style={styles.dashedVert} />
            <View style={styles.offerCol}>
              <Text style={styles.offerTitle}>{title}</Text>
              <Text style={styles.offerPartner}>{partner}</Text>
              {validUntil ? (
                <Text style={styles.validUntil}>Valid until {formatDate(validUntil)}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={[styles.ringWrap, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize} style={[StyleSheet.absoluteFill, { width: ringSize, height: ringSize }]}>
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={r}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={r}
              stroke="#8140F3"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
            />
          </Svg>
          <View style={styles.stepsCenter}>
            <Text style={styles.stepsNumber}>{stepsRequired.toLocaleString()}</Text>
            <Text style={styles.stepsLabel}>Steps</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.redeemButton} onPress={handleRedeem}>
          <Text style={styles.redeemButtonText}>Confirm Purchase</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    paddingHorizontal: SPACE.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: SPACE.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...CARD_SHADOW,
  },
  couponRow: {
    flexDirection: 'row',
    padding: SPACE.sm,
    alignItems: 'center',
  },
  brandLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACE.sm,
  },
  brandText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  couponRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashedVert: {
    width: 1,
    height: 44,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    marginRight: SPACE.sm,
  },
  offerCol: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  offerPartner: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  validUntil: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 4,
  },
  progressSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACE.lg,
    marginBottom: SPACE.lg,
  },
  ringWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111',
  },
  stepsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACE.sm,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACE.sm,
    paddingVertical: SPACE.md,
    paddingBottom: SPACE.lg + 8,
    backgroundColor: '#F8F9FB',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#E9D5FF',
    paddingVertical: SPACE.sm,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b21a8',
  },
  redeemButton: {
    flex: 1,
    backgroundColor: '#8140F3',
    paddingVertical: SPACE.sm,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  redeemButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
