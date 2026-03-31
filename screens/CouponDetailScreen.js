import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Download, ExternalLink, Info, Send } from 'lucide-react-native';
import React from 'react';
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

let QRCode = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch (_) {}

const { width } = Dimensions.get('window');
const SPACE = { xs: 8, sm: 16, md: 24, lg: 32 };
const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
};

export default function CouponDetailScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const coupon = route.params?.coupon || {};
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

  const handleSave = () => {
    Alert.alert(t('couponDetail.savedTitle'), t('couponDetail.savedMessage'));
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
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{t('couponDetail.title')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <View style={styles.cardTop}>
            <View style={styles.brandRow}>
              <View style={[styles.brandLogo, { backgroundColor: '#E31837' }]}>
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
    backgroundColor: '#8140F3',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACE.sm,
    paddingBottom: SPACE.lg + 24,
  },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
    padding: SPACE.sm,
    ...CARD_SHADOW,
  },
  cardTop: {
    marginBottom: SPACE.sm,
  },
  brandRow: {
    flexDirection: 'row',
    marginBottom: SPACE.sm,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
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
    marginBottom: 6,
  },
  offerDesc: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    lineHeight: 20,
  },
  terms: {
    marginTop: SPACE.xs,
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
    marginVertical: SPACE.sm,
  },
  cardBottom: {
    alignItems: 'center',
  },
  qrCard: {
    padding: SPACE.md,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: SPACE.sm,
    ...CARD_SHADOW,
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
    gap: SPACE.xs,
  },
  validText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
  },
  usageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: SPACE.md,
    marginBottom: SPACE.xs,
  },
  usagePara: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9ca3af',
    lineHeight: 20,
    paddingHorizontal: SPACE.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACE.sm,
    marginTop: SPACE.md,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#B39DDB',
    paddingVertical: SPACE.sm,
    borderRadius: 16,
    gap: SPACE.xs,
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
    backgroundColor: '#8140F3',
    paddingVertical: SPACE.sm,
    borderRadius: 16,
    gap: SPACE.xs,
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
