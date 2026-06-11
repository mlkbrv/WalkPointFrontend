import { StatusBar } from 'expo-status-bar';
import { ShoppingBag, Ticket } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MarketHero from '../components/market/MarketHero';
import MarketShortcuts from '../components/market/MarketShortcuts';
import EmptyState from '../components/ui/EmptyState';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useTheme } from '../context/ThemeContext';
import { getMyCoupons } from '../services/apiService';

const BRAND_COLORS = {
  Starbucks: '#00704A',
  Nike: '#111827',
  McDonalds: '#DA291C',
};

function brandColor(name, fallback) {
  if (!name) return fallback;
  const key = Object.keys(BRAND_COLORS).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  return key ? BRAND_COLORS[key] : fallback;
}

export default function MyCouponsScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyCoupons();
      setCoupons(Array.isArray(data) ? data : data.results || []);
    } catch {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchCoupons);
    fetchCoupons();
    return unsub;
  }, [navigation, fetchCoupons]);

  const formatDate = (d) => {
    if (!d) return '—';
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';
    return new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const onCouponPress = (item) => {
    if (item.status === 'ACTIVE') {
      navigation.navigate('SecureVerification', { couponId: item.id });
      return;
    }
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
    const bg = brandColor(item.partner_name, c.primary);
    const offer = item.template_title || item.title || t('market.offerFallback');
    const partner = item.partner_name || t('common.partner');
    const valid = item.valid_until || item.expires_at || item.created_at;
    const status = item.status === 'REDEEMED' ? t('myCoupons.redeemed') : t('myCoupons.active');

    return (
      <Pressable
        style={({ pressed }) => [styles.ticket, pressed && { opacity: 0.94 }]}
        onPress={() => onCouponPress(item)}
      >
        <View style={[styles.ticketStripe, { backgroundColor: bg }]}>
          <Text style={styles.ticketLetter}>{partner.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.ticketBody}>
          <View style={styles.ticketTopRow}>
            <Text style={styles.ticketOffer} numberOfLines={2}>
              {offer}
            </Text>
            <View style={[styles.statusPill, item.status === 'REDEEMED' && styles.statusPillMuted]}>
              <Text style={[styles.statusText, item.status === 'REDEEMED' && styles.statusTextMuted]}>
                {status}
              </Text>
            </View>
          </View>
          <Text style={styles.ticketPartner}>{partner}</Text>
          <Text style={styles.ticketValid}>{t('myCoupons.validUntil', { date: formatDate(valid) })}</Text>
        </View>
        <View style={[styles.notch, styles.notchTop]} />
        <View style={[styles.notch, styles.notchBottom]} />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <MarketHero
        title={t('myCoupons.title')}
        subtitle={
          loading
            ? t('myCoupons.loading')
            : t('myCoupons.countSubtitle', { count: coupons.length })
        }
        right={
          <Pressable onPress={() => navigation.navigate('CouponStore')} hitSlop={8}>
            <ShoppingBag size={22} color={c.onPrimary} />
          </Pressable>
        }
      />
      <MarketShortcuts navigation={navigation} t={t} variant="light" />

      <View style={styles.sheet}>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={c.primary} size="large" />
        ) : coupons.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={t('myCoupons.emptyTitle')}
            message={t('myCoupons.emptySubtitle')}
          />
        ) : (
          <FlatList
            data={coupons}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCoupon}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.footer}>
          <PrimaryButton
            variant="gradient"
            label={t('myCoupons.buyNew')}
            onPress={() => navigation.navigate('CouponStore')}
          />
        </View>
      </View>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { spacing, radii, typography, shadow } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.primary },
    sheet: {
      flex: 1,
      backgroundColor: c.screenBg,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      marginTop: 8,
      overflow: 'hidden',
    },
    loader: { marginTop: 48 },
    list: {
      padding: spacing.md,
      paddingBottom: 100,
      gap: spacing.sm,
    },
    ticket: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.cardBorder,
      overflow: 'hidden',
      minHeight: 108,
      ...shadow.card,
    },
    ticketStripe: {
      width: 72,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ticketLetter: {
      fontSize: 28,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    ticketBody: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingRight: spacing.md,
      paddingLeft: spacing.sm,
      justifyContent: 'center',
    },
    ticketTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 4,
    },
    ticketOffer: {
      ...typography.subtitle,
      color: c.textPrimary,
      flex: 1,
      fontSize: 17,
    },
    statusPill: {
      backgroundColor: c.successSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radii.pill,
    },
    statusPillMuted: {
      backgroundColor: c.cardBorder,
    },
    statusText: {
      ...typography.caption,
      fontSize: 10,
      color: c.success,
      fontWeight: '700',
    },
    statusTextMuted: {
      color: c.textMuted,
    },
    ticketPartner: {
      ...typography.caption,
      color: c.textSecondary,
      marginBottom: 4,
    },
    ticketValid: {
      ...typography.caption,
      color: c.textMuted,
      fontSize: 12,
    },
    notch: {
      position: 'absolute',
      left: 64,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: c.screenBg,
    },
    notchTop: { top: -7 },
    notchBottom: { bottom: -7 },
    footer: {
      position: 'absolute',
      left: spacing.md,
      right: spacing.md,
      bottom: spacing.md,
    },
  });
}
