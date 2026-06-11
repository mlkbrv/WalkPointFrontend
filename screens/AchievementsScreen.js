import { StatusBar } from 'expo-status-bar';
import { Lock, Medal } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { getAchievements } from '../services/apiService';

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getAchievements()
        .then((d) => setRows(Array.isArray(d) ? d : []))
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader title={t('features.achievements')} onBack={() => navigation.goBack()} />
      {loading ? (
        <ActivityIndicator style={styles.loader} color={c.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.slug}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.tile, !item.unlocked && styles.tileLocked]}>
              <View style={[styles.medal, item.unlocked ? styles.medalOn : styles.medalOff]}>
                {item.unlocked ? (
                  <Medal size={28} color={c.accent} />
                ) : (
                  <Lock size={24} color={c.textMuted} />
                )}
              </View>
              <Text style={styles.tileTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.tileDesc} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={[styles.badge, item.unlocked && styles.badgeOn]}>
                {item.unlocked ? t('achievements.unlocked') : t('achievements.locked')}
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{t('achievements.empty')}</Text>}
        />
      )}
    </View>
  );
}

function createStyles(theme) {
  const c = theme.colors;
  const { radii, shadow, spacing } = theme;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    loader: { marginTop: 48 },
    list: { padding: spacing.md, paddingBottom: spacing.xl },
    gridRow: { gap: spacing.sm, marginBottom: spacing.sm },
    tile: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: radii.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.cardBorder,
      minHeight: 160,
      ...shadow.card,
    },
    tileLocked: { opacity: 0.72 },
    medal: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    medalOn: { backgroundColor: c.accentSoft },
    medalOff: { backgroundColor: c.screenBg },
    tileTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
    tileDesc: { fontSize: 12, color: c.textSecondary, marginTop: 4, lineHeight: 17 },
    badge: {
      marginTop: spacing.sm,
      fontSize: 11,
      fontWeight: '700',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    badgeOn: { color: c.success },
    empty: { textAlign: 'center', color: c.textSecondary, marginTop: 40 },
  });
}
