import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import HeroBanner from '../components/stride/HeroBanner';
import StepsPill from '../components/stride/StepsPill';
import StrideHeader from '../components/stride/StrideHeader';
import VoucherTicket from '../components/stride/VoucherTicket';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { buyCouponWithSteps, getBrand } from '../services/apiService';
import { getDateKey } from '../utils/calculations';

export default function BrandStoreScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { availableSteps, syncStepsFromSystem } = useApp();
  const brandId = route.params?.brandId;
  const brandName = route.params?.brandName ?? 'Brand';

  const [brand, setBrand] = useState(null);
  const [claimingId, setClaimingId] = useState(null);
  const [claimedIds, setClaimedIds] = useState([]);

  const load = useCallback(async () => {
    if (!brandId) return;
    try {
      const data = await getBrand(brandId);
      setBrand(data);
    } catch {
      setBrand(null);
    }
  }, [brandId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClaim = async (voucher) => {
    const cost = voucher.steps_price || 3000;
    if (availableSteps < cost) {
      Alert.alert(t('market.insufficientSteps'), t('market.insufficientStepsDetail', { need: cost, have: availableSteps }));
      return;
    }
    setClaimingId(voucher.id);
    try {
      await buyCouponWithSteps(voucher.id, getDateKey());
      setClaimedIds((prev) => [...prev, voucher.id]);
      await syncStepsFromSystem?.();
      Alert.alert(t('common.success'), t('market.claimSuccess', { title: voucher.title }));
    } catch (e) {
      Alert.alert(t('common.error'), e.message || t('market.purchaseFailed'));
    } finally {
      setClaimingId(null);
    }
  };

  const coupons = brand?.coupons ?? [];

  return (
    <View style={[styles.root, { backgroundColor: c.screenBg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <StrideHeader
        title={brand?.brand_name || brandName}
        onBack={() => navigation.goBack()}
        onNotifications={() => navigation.navigate('Notifications')}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <HeroBanner
          imageUri={brand?.hero_image}
          brandName={brand?.brand_name || brandName}
          brandLogo={brand?.logo_url}
        />
        <View style={styles.walletWrap}>
          <View style={[styles.walletBar, { backgroundColor: c.primary }]}>
            <Text style={[styles.walletLabel, { color: `${c.onPrimary}E6` }]}>{t('market.yourSteps')}</Text>
            <StepsPill steps={availableSteps} variant="primary" />
          </View>
        </View>
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t('market.availableVouchers')}</Text>
        <View style={styles.list}>
          {coupons.map((v) => (
            <VoucherTicket
              key={v.id}
              title={v.title}
              category={v.category}
              expiryText={v.expiry_date_text}
              brandLogo={v.partner_logo || v.image}
              stepsPrice={v.steps_price}
              canAfford={availableSteps >= (v.steps_price || 0)}
              isClaimed={claimedIds.includes(v.id)}
              isClaiming={claimingId === v.id}
              onClaim={() => handleClaim(v)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  const { spacing } = theme;
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingBottom: 40 },
    walletWrap: { marginTop: -20, paddingHorizontal: spacing.md, zIndex: 2 },
    walletBar: {
      borderRadius: 16,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    walletLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
    sectionLabel: {
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    list: { paddingHorizontal: spacing.md, gap: 12 },
  });
}
