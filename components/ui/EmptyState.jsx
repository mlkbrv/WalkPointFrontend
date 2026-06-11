import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function EmptyState({ icon: Icon, title, message }) {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  return (
    <View style={[styles.wrap, { padding: spacing.xl }]}>
      {Icon ? (
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Icon size={32} color={colors.primary} />
        </View>
      ) : null}
      <Text style={[typography.subtitle, { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }]}>
        {title}
      </Text>
      {message ? (
        <Text
          style={[
            typography.body,
            { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
          ]}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
