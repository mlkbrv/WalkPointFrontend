import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../constants/theme';

export default function AppCard({ children, style, accent }) {
  return (
    <View style={[styles.card, accent && styles.accent, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  accent: {
    borderColor: colors.primarySoft,
    backgroundColor: '#FBF7FF',
  },
});
