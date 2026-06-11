import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function Skeleton({ width = '100%', height = 16, style, borderRadius = 8 }) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.cardBorder,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.cardBorder,
          borderRadius: theme.radii.lg,
        },
      ]}
    >
      <Skeleton width={48} height={48} borderRadius={12} />
      <View style={styles.lines}>
        <Skeleton height={14} />
        <Skeleton height={12} width="70%" style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
  },
  lines: { flex: 1 },
});
