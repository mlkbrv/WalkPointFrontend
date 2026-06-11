import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function SegmentedControl({ options, value, onChange }) {
  const { theme } = useTheme();
  const { colors, radii, typography } = theme;

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: colors.primarySoft,
          borderRadius: radii.md,
        },
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[
              styles.segment,
              active && {
                backgroundColor: colors.card,
                borderRadius: radii.sm,
                ...theme.shadow.card,
              },
            ]}
            onPress={() => onChange(opt.value)}
          >
            <Text
              style={[
                typography.caption,
                { color: active ? colors.primary : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
});
