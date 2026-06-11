import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function IconBadge({ Icon, tint = 'primary' }) {
  const { theme } = useTheme();
  const { colors, radii } = theme;
  const map = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    accent: { bg: colors.accentSoft, fg: colors.accent },
    success: { bg: colors.successSoft, fg: colors.success },
  };
  const { bg, fg } = map[tint] || map.primary;

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderRadius: radii.md }]}>
      <Icon color={fg} size={22} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
