import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function GradientCard({ children, colors: gradientColors, style, contentStyle }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.wrap, theme.shadow.soft, style]}>
      <LinearGradient
        colors={gradientColors || theme.gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: theme.radii.lg }, contentStyle]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
});
