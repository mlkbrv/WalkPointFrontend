import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function AppCard({ children, style, accent }) {
  const { theme } = useTheme();
  const { colors, radii, spacing } = theme;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primarySoft : colors.card,
          borderColor: accent ? colors.primary : colors.cardBorder,
          borderRadius: radii.lg,
          padding: spacing.md,
        },
        theme.shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
