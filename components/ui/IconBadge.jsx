import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../../constants/theme';

const TINTS = {
  primary: { bg: colors.primarySoft, fg: colors.primary },
  accent: { bg: colors.accentSoft, fg: colors.accent },
  success: { bg: colors.successSoft, fg: colors.success },
};

export default function IconBadge({ Icon, tint = 'primary' }) {
  const { bg, fg } = TINTS[tint] || TINTS.primary;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Icon color={fg} size={22} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
