import { LinearGradient } from 'expo-linear-gradient';
import { Coins } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function CoinBadge({ amount, compact }) {
  const { theme } = useTheme();
  const { gradients, typography } = theme;

  return (
    <LinearGradient
      colors={gradients.coin}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.wrap, compact && styles.compact]}
    >
      <Coins size={compact ? 14 : 18} color="#FFFFFF" strokeWidth={2.5} />
      <Text style={[typography.caption, styles.text, compact && styles.textCompact]}>
        {amount}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  compact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textCompact: {
    fontSize: 12,
  },
});
