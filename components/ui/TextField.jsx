import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TextField({
  label,
  error,
  style,
  inputStyle,
  ...props
}) {
  const { theme } = useTheme();
  const { colors, radii, spacing, typography } = theme;
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, style]}>
      {label ? (
        <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
          {label}
        </Text>
      ) : null}
      <TextInput
        {...props}
        placeholderTextColor={colors.textMuted}
        style={[
          typography.body,
          styles.input,
          {
            backgroundColor: colors.inputBg,
            borderColor: error ? colors.danger : focused ? colors.primary : colors.inputBorder,
            borderRadius: radii.md,
            color: colors.textPrimary,
          },
          inputStyle,
        ]}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
      {error ? (
        <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  input: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
