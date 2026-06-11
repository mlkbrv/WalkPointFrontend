import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function StatPill({ icon: Icon, value, label, iconColor }) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <View style={styles.wrap}>
      {Icon ? <Icon size={24} color={iconColor || colors.primary} strokeWidth={2} /> : null}
      <Text style={[typography.subtitle, { color: colors.textPrimary, marginTop: 8 }]}>{value}</Text>
      <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    flex: 1,
  },
});
