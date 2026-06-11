import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SectionHeader({ title, actionLabel, onAction }) {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  return (
    <View style={[styles.row, { marginBottom: spacing.md }]}>
      <Text style={[typography.subtitle, { color: colors.textPrimary, flex: 1 }]}>{title}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[typography.caption, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
