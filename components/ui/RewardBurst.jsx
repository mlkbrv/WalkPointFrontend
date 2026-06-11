import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const DOTS = [
  { x: -28, y: -18, delay: 0 },
  { x: 24, y: -22, delay: 40 },
  { x: -18, y: 20, delay: 80 },
  { x: 30, y: 14, delay: 120 },
  { x: 0, y: -30, delay: 60 },
];

function BurstDot({ x, y, delay, visible, color }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.3);
      translateX.setValue(0);
      translateY.setValue(0);
      return;
    }
    const anim = Animated.parallel([
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(scale, { toValue: 1.2, useNativeDriver: true, speed: 12, bounciness: 8 }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateX, { toValue: x, duration: 380, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, { toValue: y, duration: 380, useNativeDriver: true }),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [visible, delay, x, y, opacity, scale, translateX, translateY]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, opacity, transform: [{ translateX }, { translateY }, { scale }] },
      ]}
    />
  );
}

export default function RewardBurst({ visible }) {
  const { theme } = useTheme();
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      ringScale.setValue(0.6);
      ringOpacity.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.sequence([
        Animated.timing(ringOpacity, { toValue: 0.55, duration: 100, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.spring(ringScale, { toValue: 1.8, useNativeDriver: true, speed: 12, bounciness: 6 }),
    ]).start();
  }, [visible, ringOpacity, ringScale]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.ring,
          { borderColor: theme.colors.accent, opacity: ringOpacity, transform: [{ scale: ringScale }] },
        ]}
      />
      {DOTS.map((d, i) => (
        <BurstDot key={i} {...d} visible={visible} color={theme.colors.accent} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  ring: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
