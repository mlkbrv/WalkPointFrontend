import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function PrimaryButton({ label, onPress, disabled, loading, variant = 'primary' }) {
  const { theme } = useTheme();
  const { colors, radii, typography, gradients } = theme;

  const content = loading ? (
    <ActivityIndicator color={variant === 'secondary' ? colors.primary : colors.onPrimary} />
  ) : (
    <Text
      style={[
        typography.subtitle,
        {
          color: variant === 'secondary' ? colors.primary : colors.onPrimary,
          fontSize: 16,
        },
      ]}
    >
      {label}
    </Text>
  );

  if (variant === 'gradient') {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading} style={(disabled || loading) && styles.disabled}>
        <LinearGradient
          colors={gradients.cta}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, { borderRadius: radii.md }]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[
        styles.btn,
        { borderRadius: radii.md, backgroundColor: variant === 'secondary' ? colors.primarySoft : colors.primary },
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
