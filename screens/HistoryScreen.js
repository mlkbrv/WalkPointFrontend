import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Clock, Flame, Footprints, MapPin } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { getDateKey } from '../utils/calculations';
import { buildRouteMapHtml } from '../utils/routeMapHtml';

function parseDateKey(dateInput) {
  const raw = typeof dateInput === 'string' ? dateInput.slice(0, 10) : '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(dateInput);
}

function formatDurationMinutes(timeMinutes) {
  const mins = Math.max(0, Math.floor(Number(timeMinutes) || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function normalizeHistoryDateKey(item) {
  if (!item?.date) return '';
  const raw = typeof item.date === 'string' ? item.date : '';
  if (raw && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }
  try {
    return getDateKey(new Date(item.date));
  } catch {
    return '';
  }
}

function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { trackingHistory, getHistoricalStats, syncActivityHistory } = useApp();
  const localeTag = i18n.language === 'ru' ? 'ru-RU' : 'en-US';
  const [archivedDaily, setArchivedDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  const loadArchivedDaily = useCallback(async () => {
    const rows = [];
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getDateKey(d);
      try {
        const s = await getHistoricalStats(d);
        if (!s || (s.steps ?? 0) < 1) continue;
        rows.push({
          id: `archive-${key}`,
          date: key,
          steps: s.steps ?? 0,
          time: s.time ?? 0,
          calories: s.calories ?? 0,
          distance: Number(s.distance) || 0,
        });
      } catch (_) {}
    }
    setArchivedDaily(rows);
  }, [getHistoricalStats]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        try {
          await syncActivityHistory?.();
        } catch (_) {}
        if (!cancelled) await loadArchivedDaily();
        if (!cancelled) setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [syncActivityHistory, loadArchivedDaily]),
  );

  const mergedHistory = useMemo(() => {
    const sessions = [...(trackingHistory || [])];
    const sessionKeys = new Set(sessions.map(normalizeHistoryDateKey).filter(Boolean));
    const extras = archivedDaily.filter((a) => !sessionKeys.has(a.date));
    const combined = [...sessions, ...extras];
    combined.sort((a, b) => {
      const tb = new Date(b.date).getTime();
      const ta = new Date(a.date).getTime();
      return tb - ta;
    });
    return combined;
  }, [trackingHistory, archivedDaily]);

  const formatDate = (dateString) => {
    const date = parseDateKey(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (getDateKey(date) === getDateKey(today)) {
      return t('history.today');
    }
    if (getDateKey(date) === getDateKey(yesterday)) {
      return t('history.yesterday');
    }
    return date.toLocaleDateString(localeTag, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const groupByDate = (history) => {
    const grouped = {};
    history.forEach((item) => {
      const dateKey = normalizeHistoryDateKey(item) || getDateKey(parseDateKey(item.date));
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    return grouped;
  };

  const groupedHistory = groupByDate(mergedHistory);

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Footprints size={24} color={c.primary} />
          </View>
          <Text style={styles.headerTitle}>{t('history.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 48 }} />
        ) : Object.keys(groupedHistory).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('history.empty')}</Text>
            <Text style={styles.emptySubtext}>{t('history.emptySub')}</Text>
          </View>
        ) : (
          Object.entries(groupedHistory).map(([dateKey, items]) => (
            <View key={dateKey} style={styles.dateSection}>
              <Text style={styles.dateHeader}>
                {formatDate(items[0].date)}
              </Text>
              {items.map((item) => {
                const hasRoute = Array.isArray(item.route) && item.route.length > 1;
                return (
                <Pressable
                  key={item.id}
                  style={styles.historyItem}
                  onPress={() => setDetail(item)}
                >
                  {hasRoute ? (
                    <View style={styles.routeBadgeWrap}>
                      <Text style={styles.routeBadge}>{t('history.routeSession')}</Text>
                    </View>
                  ) : null}
                  <View style={styles.historyStats}>
                    <View style={styles.historyStat}>
                      <Footprints size={28} color="#2196F3" strokeWidth={2} />
                      <Text style={styles.historyValue}>
                        {(item.steps ?? 0).toLocaleString()}
                      </Text>
                      <Text style={styles.historyLabel}>{t('history.steps')}</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Clock size={28} color="#FF9800" strokeWidth={2} />
                      <Text style={styles.historyValue}>
                        {formatDurationMinutes(item.time)}
                      </Text>
                      <Text style={styles.historyLabel}>{t('history.time')}</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <Flame size={28} color="#F44336" strokeWidth={2} />
                      <Text style={styles.historyValue}>{item.calories ?? 0}</Text>
                      <Text style={styles.historyLabel}>{t('history.kcal')}</Text>
                    </View>
                    <View style={styles.historyStat}>
                      <MapPin size={28} color="#4CAF50" strokeWidth={2} />
                      <Text style={styles.historyValue}>
                        {(Number(item.distance) || 0).toFixed(2)}
                      </Text>
                      <Text style={styles.historyLabel}>{t('history.km')}</Text>
                    </View>
                  </View>
                </Pressable>
              );
              })}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!detail} animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('history.detailTitle')}</Text>
            <Pressable onPress={() => setDetail(null)}>
              <Text style={styles.modalClose}>{t('common.back')}</Text>
            </Pressable>
          </View>
          {detail && Array.isArray(detail.route) && detail.route.length > 1 ? (
            <WebView
              style={styles.map}
              source={{ html: buildRouteMapHtml(detail.route, 55.75, 37.62, c.primary) }}
              scrollEnabled={false}
            />
          ) : null}
          {detail ? (
            <View style={styles.modalStats}>
              <Text style={styles.modalStat}>
                {t('history.steps')}: {(detail.steps ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.modalStat}>
                {t('history.time')}: {formatDurationMinutes(detail.time)}
              </Text>
              <Text style={styles.modalStat}>
                {t('history.km')}: {(Number(detail.distance) || 0).toFixed(2)}
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 20,
    },
    logoContainer: {
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 30,
      height: 30,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textSecondary,
      marginBottom: 10,
    },
    emptySubtext: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      paddingHorizontal: 40,
      fontWeight: '500',
    },
    dateSection: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    dateHeader: {
      fontSize: 16,
      fontWeight: '700',
      color: c.textPrimary,
      marginBottom: 16,
    },
    historyItem: {
      backgroundColor: c.card,
      borderRadius: 24,
      padding: 20,
      marginBottom: 12,
      shadowColor: c.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    historyStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    historyStat: {
      alignItems: 'center',
      flex: 1,
    },
    historyValue: {
      fontSize: 18,
      fontWeight: '700',
      color: c.textPrimary,
      marginTop: 8,
      marginBottom: 4,
    },
    historyLabel: {
      fontSize: 12,
      color: c.textSecondary,
      fontWeight: '500',
    },
    routeBadgeWrap: {
      alignSelf: 'flex-start',
      backgroundColor: c.primarySoft,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginBottom: 10,
    },
    routeBadge: {
      color: c.primaryDark,
      fontSize: 11,
      fontWeight: '700',
    },
    modal: { flex: 1, backgroundColor: c.card, paddingTop: 48 },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
    modalClose: { color: c.primary, fontWeight: '600' },
    map: { height: 280, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
    modalStats: { padding: 20, gap: 8 },
    modalStat: { fontSize: 16, color: c.textSecondary },
  });
}

export default React.memo(HistoryScreen);
