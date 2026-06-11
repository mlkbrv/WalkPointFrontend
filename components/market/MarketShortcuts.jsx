import { Crown, Heart, Zap } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function MarketShortcuts({ navigation, t, variant = 'light' }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const onLight = variant === 'light';

  const items = [
    { key: 'boost', icon: Zap, label: t('market.boosts'), tint: c.primary, onPress: () => navigation.navigate('BoostShop') },
    { key: 'premium', icon: Crown, label: t('market.premium'), tint: c.accent, onPress: () => navigation.navigate('Premium') },
    { key: 'fav', icon: Heart, label: t('features.favorites'), tint: c.danger, onPress: () => navigation.navigate('Favorites') },
  ];

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          style={[
            styles.card,
            {
              backgroundColor: onLight ? 'rgba(255,255,255,0.22)' : c.card,
              borderColor: onLight ? 'rgba(255,255,255,0.35)' : c.cardBorder,
            },
          ]}
          onPress={item.onPress}
        >
          <View style={[styles.iconWrap, { backgroundColor: onLight ? 'rgba(255,255,255,0.25)' : c.primarySoft }]}>
            <item.icon size={18} color={onLight ? '#FFFFFF' : item.tint} strokeWidth={2.2} />
          </View>
          <Text
            style={[
              theme.typography.caption,
              { color: onLight ? '#FFFFFF' : c.textPrimary, fontSize: 11, fontWeight: '600' },
            ]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
