import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function useScreenStyles() {
  const { theme } = useTheme();
  const { colors, radii, spacing, typography, shadow } = theme;

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.screenBg,
        },
        card: {
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          padding: spacing.md,
          ...shadow.card,
        },
        title: {
          ...typography.title,
          color: colors.textPrimary,
        },
        subtitle: {
          ...typography.subtitle,
          color: colors.textPrimary,
        },
        body: {
          ...typography.body,
          color: colors.textSecondary,
        },
        caption: {
          ...typography.caption,
          color: colors.textMuted,
        },
        link: {
          ...typography.caption,
          color: colors.primary,
        },
        input: {
          ...typography.body,
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          borderWidth: 1.5,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 14,
          color: colors.textPrimary,
        },
        headerTitle: {
          ...typography.subtitle,
          color: colors.textPrimary,
          textAlign: 'center',
          flex: 1,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.cardBorder,
        },
        loader: {
          marginTop: 48,
        },
      }),
    [colors, radii, spacing, typography, shadow],
  );
}
