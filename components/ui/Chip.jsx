import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function Chip({ label, icon: Icon, onPress }) {
  const { theme } = useTheme();
  const { colors, radii, typography } = theme;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: pressed ? colors.primarySoft : colors.card,
          borderColor: colors.cardBorder,
          borderRadius: radii.pill,
        },
      ]}
      onPress={onPress}
    >
      {Icon ? <Icon size={16} color={colors.primary} strokeWidth={2} /> : null}
      <Text style={[typography.caption, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
});
