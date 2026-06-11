import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function ListRow({ icon: Icon, label, value, onPress, danger }) {
  const { theme } = useTheme();
  const { colors, radii, spacing, typography } = theme;
  const tint = danger ? colors.danger : colors.textPrimary;

  const inner = (
    <>
      {Icon ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <Icon size={20} color={colors.primary} strokeWidth={2} />
        </View>
      ) : null}
      <Text style={[typography.body, { color: tint, flex: 1 }]}>{label}</Text>
      {value ? (
        <Text style={[typography.caption, { color: colors.textMuted, marginRight: 4 }]}>{value}</Text>
      ) : null}
      {onPress ? <ChevronRight size={20} color={colors.textMuted} /> : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, { paddingVertical: spacing.md, paddingHorizontal: spacing.md }]}>
        {inner}
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          backgroundColor: pressed ? colors.primarySoft : 'transparent',
        },
      ]}
      onPress={onPress}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
