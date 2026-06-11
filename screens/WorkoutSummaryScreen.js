import { StatusBar } from 'expo-status-bar';
import { Clock, Flame, MapPin, Trophy } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import PrimaryButton from '../components/ui/PrimaryButton';
import StrideHeader from '../components/stride/StrideHeader';
import { useTheme } from '../context/ThemeContext';

export default function WorkoutSummaryScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const data = route.params?.workout ?? {};

  return (
    <View style={[styles.root, { backgroundColor: c.screenBg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <StrideHeader title={t('track.summaryTitle')} onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <View style={[styles.hero, { backgroundColor: c.primarySoft }]}>
          <Trophy size={48} color={c.primary} />
          <Text style={[styles.heroTitle, { color: c.textPrimary }]}>{data.name || t('track.workoutComplete')}</Text>
        </View>
        <View style={styles.grid}>
          <Stat icon={Clock} label={t('track.duration')} value={data.duration || '00:00:00'} />
          <Stat icon={MapPin} label={t('track.distance')} value={`${data.distance ?? 0} km`} />
          <Stat icon={Flame} label={t('track.calories')} value={`${data.calories ?? 0} kcal`} />
          <Stat icon={Trophy} label={t('track.tokens')} value={`+${data.tokensEarned ?? 0}`} />
        </View>
        <PrimaryButton title={t('common.done')} onPress={() => navigation.navigate('MainTabs', { screen: 'Home', params: { screen: 'HomeMain' } })} />
      </View>
    </View>
  );
}

function Stat({ icon: Icon, label, value }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[statStyles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
      <Icon size={20} color={c.primary} />
      <Text style={[statStyles.value, { color: c.textPrimary }]}>{value}</Text>
      <Text style={[statStyles.label, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { width: '48%', borderRadius: 16, borderWidth: 1, padding: 16, alignItems: 'center', gap: 6, marginBottom: 12 },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});

function createStyles(theme) {
  const { spacing } = theme;
  return StyleSheet.create({
    root: { flex: 1 },
    content: { flex: 1, padding: spacing.md },
    hero: { borderRadius: 20, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
    heroTitle: { fontSize: 22, fontWeight: '900', marginTop: 12, textAlign: 'center' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl },
  });
}
