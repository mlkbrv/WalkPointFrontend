import { StatusBar } from 'expo-status-bar';
import { ShieldAlert, ShieldCheck, Timer } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import StrideHeader from '../components/stride/StrideHeader';
import { useTheme } from '../context/ThemeContext';
import { verifyCoupon } from '../services/apiService';

export default function SecureVerificationScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const couponId = route.params?.couponId;
  const [data, setData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(179);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await verifyCoupon(couponId);
        setData(res);
        setTimeLeft(res.countdown_sec ?? 179);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [couponId]);

  useEffect(() => {
    if (!data) return undefined;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [data]);

  const formatCountdown = (secs) => {
    if (secs === 0) return 'EXPIRED';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <View style={[styles.root, { backgroundColor: c.screenBg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <StrideHeader title={t('coupon.secureVerify')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={c.primary} size="large" />
        ) : data ? (
          <>
            <View style={[styles.shield, { backgroundColor: c.primarySoft }]}>
              <ShieldCheck size={56} color={c.primary} />
            </View>
            <Text style={[styles.title, { color: c.textPrimary }]}>{data.title}</Text>
            <Text style={[styles.partner, { color: c.textSecondary }]}>{data.partner_name}</Text>
            <View style={[styles.codeBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <Text style={[styles.code, { color: c.primary }]}>{data.coupon_code}</Text>
            </View>
            <View style={styles.timerRow}>
              <Timer size={18} color={timeLeft > 0 ? c.primary : c.danger} />
              <Text style={[styles.timer, { color: timeLeft > 0 ? c.primary : c.danger }]}>
                {formatCountdown(timeLeft)}
              </Text>
            </View>
            <Text style={[styles.token, { color: c.textMuted }]}>{t('coupon.verifyToken', { token: data.verification_token })}</Text>
          </>
        ) : (
          <View style={styles.errorWrap}>
            <ShieldAlert size={48} color={c.danger} />
            <Text style={{ color: c.textSecondary, marginTop: 12 }}>{t('coupon.verifyFailed')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(theme) {
  const { radii, spacing } = theme;
  return StyleSheet.create({
    root: { flex: 1 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    shield: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    title: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
    partner: { fontSize: 14, marginTop: 4 },
    codeBox: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, borderWidth: 1, width: '100%', alignItems: 'center' },
    code: { fontSize: 28, fontWeight: '900', letterSpacing: 4 },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.lg },
    timer: { fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
    token: { marginTop: spacing.md, fontSize: 12, textAlign: 'center' },
    errorWrap: { alignItems: 'center' },
  });
}
