import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function MarketHero({ title, subtitle, onBack, right }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  return (
    <LinearGradient
      colors={theme.gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: insets.top + 8 }]}
    >
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.side}>
            <ChevronLeft size={24} color={c.onPrimary} strokeWidth={2.2} />
          </Pressable>
        ) : (
          <View style={styles.side} />
        )}
        <Text style={[theme.typography.subtitle, styles.title, { color: c.onPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.side}>{right ?? null}</View>
      </View>
      {subtitle ? (
        <Text style={[theme.typography.caption, styles.subtitle]}>{subtitle}</Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 20,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    marginTop: 6,
  },
});
