import { StatusBar } from 'expo-status-bar';
import { Award, BellOff, Copy, TrendingUp, Trophy } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import StrideHeader from '../components/stride/StrideHeader';
import EmptyState from '../components/ui/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { getNotifications, markAllNotificationsRead } from '../services/apiService';

const ICONS = {
  social: Trophy,
  milestone: Award,
  offer: TrendingUp,
  stats: TrendingUp,
};

export default function NotificationsScreen({ navigation }) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [items, setItems] = useState([]);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications();
      setItems(Array.isArray(data) ? data : data.results || []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onMarkAll = async () => {
    try {
      await markAllNotificationsRead();
      await load();
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    }
  };

  const today = items.filter((n) => n.is_today);
  const earlier = items.filter((n) => !n.is_today);

  const renderGroup = (title, list) =>
    list.length ? (
      <View style={styles.group}>
        <Text style={[styles.groupTitle, { color: c.textMuted }]}>{title}</Text>
        {list.map((n) => {
          const Icon = ICONS[n.type] || TrendingUp;
          return (
            <View key={n.id} style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
              <View style={[styles.iconWrap, { backgroundColor: c.primarySoft }]}>
                <Icon size={18} color={c.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardTitle, { color: c.textPrimary }]}>{n.title}</Text>
                <Text style={[styles.cardBodyText, { color: c.textSecondary }]}>{n.body}</Text>
                <Text style={[styles.time, { color: c.textMuted }]}>{n.time_text}</Text>
                {n.payload?.coupon_code ? (
                  <View style={styles.copyRow}>
                    <Text style={[styles.code, { color: c.primary }]}>{n.payload.coupon_code}</Text>
                    <Copy size={14} color={c.primary} />
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    ) : null;

  return (
    <View style={[styles.root, { backgroundColor: c.screenBg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <StrideHeader
        title={t('notifications.title')}
        onBack={() => navigation.goBack()}
        right={
          items.length ? (
            <Pressable onPress={onMarkAll}>
              <Text style={[styles.markAll, { color: c.primary }]}>{t('notifications.markAll')}</Text>
            </Pressable>
          ) : null
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {!items.length ? (
          <EmptyState icon={BellOff} title={t('notifications.empty')} />
        ) : (
          <>
            {renderGroup(t('notifications.today'), today)}
            {renderGroup(t('notifications.earlier'), earlier)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  const { radii, spacing } = theme;
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { padding: spacing.md, paddingBottom: 40 },
    markAll: { fontSize: 12, fontWeight: '700' },
    group: { marginBottom: spacing.lg },
    groupTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
    card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: radii.lg, borderWidth: 1, marginBottom: 10 },
    iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    cardBody: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '800' },
    cardBodyText: { fontSize: 13, marginTop: 4, lineHeight: 18 },
    time: { fontSize: 11, marginTop: 6 },
    copyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    code: { fontWeight: '800', letterSpacing: 1 },
  });
}
