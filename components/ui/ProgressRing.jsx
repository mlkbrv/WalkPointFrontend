import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

export default function ProgressRing({
  value = 0,
  max = 10000,
  size = 240,
  strokeWidth = 12,
  children,
}) {
  const { theme } = useTheme();
  const { colors, typography } = theme;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / Math.max(1, max)));
  const offset = circumference * (1 - pct);
  const inner = size - strokeWidth * 2 - 8;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={colors.cardBorder}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={colors.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cx}`}
        />
      </Svg>
      <View
        style={[
          styles.inner,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: colors.card,
          },
          theme.shadow.card,
        ]}
      >
        {children ?? (
          <>
            <Text style={[typography.display, { color: colors.textPrimary, fontSize: 48 }]}>
              {Math.round(value).toLocaleString()}
            </Text>
            <Text style={[typography.caption, { color: colors.textMuted }]}>steps</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
