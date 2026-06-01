import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii } from '../../constants/theme';

export default function PrimaryButton({ label, onPress, disabled, loading, variant = 'primary' }) {
  return (
    <Pressable
      style={[
        styles.btn,
        variant === 'secondary' && styles.secondary,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#FFF'} />
      ) : (
        <Text style={[styles.text, variant === 'secondary' && styles.textSecondary]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textSecondary: {
    color: colors.primary,
  },
});
