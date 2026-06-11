import React, { useRef } from 'react';
import { Animated, Pressable } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function AnimatedPressable({ children, style, onPress, disabled, ...rest }) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const target = theme.motion.pressScale;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={{ flex: style?.flex }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
