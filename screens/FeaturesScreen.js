import { StatusBar } from 'expo-status-bar';
import {
  ChevronRight,
  Crown,
  Flame,
  Heart,
  LayoutGrid,
  Medal,
  Receipt,
  Store,
  Target,
  Users,
  UsersRound,
  Zap,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import IconBadge from '../components/ui/IconBadge';
import ScreenHeader from '../components/ui/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { colors, radii, shadow, spacing } from '../constants/theme';

export default function FeaturesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();

  const sections = [
    {
      title: t('features.sectionProgress'),
      items: [
        { key: 'streaks', route: 'Streaks', label: t('features.streaks'), Icon: Flame, tint: 'accent' },
        { key: 'challenges', route: 'Challenges', label: t('features.challenges'), Icon: Target, tint: 'primary' },
        { key: 'achievements', route: 'Achievements', label: t('features.achievements'), Icon: Medal, tint: 'success' },
      ],
    },
    {
      title: t('features.sectionSocial'),
      items: [
        { key: 'friends', route: 'Friends', label: t('features.friends'), Icon: Users, tint: 'primary' },
        { key: 'teams', route: 'Teams', label: t('features.teams'), Icon: UsersRound, tint: 'primary' },
      ],
    },
    {
      title: t('features.sectionShop'),
      items: [
        { key: 'favorites', route: 'Favorites', label: t('features.favorites'), Icon: Heart, tint: 'accent' },
        { key: 'boosts', route: 'BoostShop', label: t('features.boosts'), Icon: Zap, tint: 'primary' },
        { key: 'premium', route: 'Premium', label: t('features.premium'), Icon: Crown, tint: 'accent' },
      ],
    },
    {
      title: t('features.sectionAccount'),
      items: [
        { key: 'transactions', route: 'Transactions', label: t('features.transactions'), Icon: Receipt, tint: 'primary' },
        ...(user?.role === 'PARTNER'
          ? [{ key: 'partner', route: 'PartnerHub', label: t('features.partner'), Icon: Store, tint: 'success' }]
          : []),
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title={t('features.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <LayoutGrid size={28} color={colors.primary} strokeWidth={2.2} />
          </View>
          <Text style={styles.heroTitle}>{t('features.heroTitle')}</Text>
          <Text style={styles.heroSub}>{t('features.heroSub')}</Text>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, index) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [
                    styles.row,
                    index < section.items.length - 1 && styles.rowBorder,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => navigation.navigate(item.route)}
                >
                  <IconBadge Icon={item.Icon} tint={item.tint} />
                  <Text style={styles.rowText}>{item.label}</Text>
                  <ChevronRight size={20} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  heroSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, lineHeight: 20 },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowPressed: { backgroundColor: colors.bg },
  rowText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
});
