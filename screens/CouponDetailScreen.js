import { StatusBar } from 'expo-status-bar';
import { Download, ExternalLink, Heart, Info, Send } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import MarketHero from '../components/market/MarketHero';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { toggleFavoriteCoupon } from '../services/apiService';

let QRCode = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch (_) {}

const { width } = Dimensions.get('window');
export default function CouponDetailScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const coupon = route.params?.coupon || {};
  const templateId = coupon.template_id ?? coupon.template;
  const [favorited, setFavorited] = useState(Boolean(coupon.is_favorite));
  const title = coupon.template_title || coupon.title || t('market.offerFallback');
  const partner = coupon.partner_name || t('common.partner');
  const code = coupon.unique_code || coupon.code || '—';
  const validUntil = coupon.valid_until || coupon.expires_at || coupon.created_at;
  const description =
    coupon.description || t('couponDetail.descFallback', { partner });

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const locale = i18n.language === 'ru' ? 'ru-RU' : 'en-GB';
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const handleSave = async () => {
    if (!templateId) {
      Alert.alert(t('couponDetail.savedTitle'), t('couponDetail.savedMessage'));
      return;
    }
    try {
      const r = await toggleFavoriteCoupon(templateId);
      setFavorited(r.is_favorite);
      Alert.alert(t('common.success'), r.is_favorite ? t('couponDetail.favorited') : t('couponDetail.unfavorited'));
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('couponDetail.shareMessage', {
          title,
          partner,
          code,
          date: formatDate(validUntil),
        }),
        title: t('couponDetail.shareTitle', { partner }),
      });
    } catch {
      // user cancelled
    }
  };

  const qrSize = Math.min(width * 0.4, 200);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <MarketHero
        title={t('couponDetail.title')}
        subtitle={partner}
        onBack={() => navigation.goBack()}
        right={
          templateId ? (
            <Pressable onPress={handleSave} hitSlop={8}>
              <Heart
                size={22}
                color={favorited ? c.danger : c.onPrimary}
                fill={favorited ? c.danger : 'transparent'}
              />
            </Pressable>
          ) : null
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <View style={styles.cardTop}>
            <View style={styles.brandRow}>
              <View style={[styles.brandLogo, { backgroundColor: c.primary }]}>
                <Text style={styles.brandText}>{partner.charAt(0)}</Text>
              </View>
              <View style={styles.offerCol}>
                <Text style={styles.offerTitle}>{title}</Text>
                <Text style={styles.offerPartner}>{partner}</Text>
                <Text style={styles.offerDesc}>{description}</Text>
              </View>
            </View>
            <View style={styles.terms}>
              <Text style={styles.term}>{t('couponDetail.term1', { partner })}</Text>
              <Text style={styles.term}>{t('couponDetail.term2')}</Text>
              <Text style={styles.term}>{t('couponDetail.term3')}</Text>
            </View>
          </View>
          <View style={styles.dashedLine} />
          <View style={styles.cardBottom}>
            <View style={styles.qrCard}>
              {QRCode ? (
                <QRCode value={code} size={qrSize} backgroundColor="#FFF" color="#000" />
              ) : (
                <View style={[styles.qrPlaceholder, { width: qrSize, height: qrSize }]}>
                  <Text style={styles.qrPlaceholderText}>QR</Text>
                  <Text style={styles.codeDisplay}>{code}</Text>
                </View>
              )}
            </View>
            <View style={styles.validRow}>
              <Pressable><ExternalLink size={18} color="#9ca3af" /></Pressable>
              <Text style={styles.validText}>
                {t('couponDetail.validUntil', { date: formatDate(validUntil) })}
              </Text>
              <Pressable><Info size={18} color="#9ca3af" /></Pressable>
            </View>
          </View>
        </View>

        <Text style={styles.usageTitle}>{t('couponDetail.usageTitle')}</Text>
        <Text style={styles.usagePara}>{t('couponDetail.usageText')}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.saveBtn} onPress={handleSave}>
            <Download size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          </Pressable>
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <Send size={20} color="#FFF" />
            <Text style={styles.shareBtnText}>{t('common.share')}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { spacing, radii, typography } = theme;
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: c.screenBg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    marginTop: 8,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl + 24,
  },
  mainCard: {
    backgroundColor: c.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    ...theme.shadow.card,
  },
  cardTop: {
    marginBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  brandLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  offerCol: {
    flex: 1,
  },
  offerTitle: {
    ...typography.subtitle,
    fontSize: 20,
    color: c.textPrimary,
    marginBottom: 4,
  },
  offerPartner: {
    ...typography.caption,
    color: c.textSecondary,
    marginBottom: 6,
  },
  offerDesc: {
    ...typography.body,
    fontSize: 13,
    color: c.textMuted,
  },
  terms: {
    marginTop: spacing.xs,
  },
  term: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
    lineHeight: 18,
  },
  dashedLine: {
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: spacing.sm,
  },
  cardBottom: {
    alignItems: 'center',
  },
  qrCard: {
    padding: spacing.md,
    backgroundColor: c.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: c.cardBorder,
    marginBottom: spacing.sm,
    ...theme.shadow.card,
  },
  qrPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  qrPlaceholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#9ca3af',
    marginBottom: 4,
  },
  codeDisplay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 1,
  },
  validRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  validText: {
    ...typography.caption,
    color: c.textMuted,
  },
  usageTitle: {
    ...typography.caption,
    color: c.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  usagePara: {
    ...typography.body,
    fontSize: 13,
    color: c.textMuted,
    paddingHorizontal: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primaryLight,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: c.onPrimary,
  },
  });
}
