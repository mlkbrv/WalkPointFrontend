import { Footprints } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function StepsPill({ steps = 0, compact = false, variant = 'soft' }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const isPrimary = variant === 'primary';

  return (
    <View
      style={[
        styles.pill,
        compact && styles.compact,
        {
          backgroundColor: isPrimary ? c.primary : c.primarySoft,
          borderColor: isPrimary ? 'transparent' : `${c.primary}1A`,
        },
      ]}
    >
      <Footprints size={compact ? 14 : 18} color={isPrimary ? c.onPrimary : c.primaryDark} />
      <Text
        style={[
          styles.text,
          compact && styles.textCompact,
          { color: isPrimary ? c.onPrimary : c.primaryDark },
        ]}
      >
        {Number(steps).toLocaleString()}
      </Text>
      {!compact && <Text style={[styles.label, { color: isPrimary ? `${c.onPrimary}B3` : c.primary }]}>Steps</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  compact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: {
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  textCompact: {
    fontSize: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
