import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function ScreenHeader({ title, onBack, right, variant = 'default', transparent }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography } = theme;
  const isLarge = variant === 'large';

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + spacing.sm,
          backgroundColor: transparent ? 'transparent' : colors.card,
          borderBottomColor: transparent ? 'transparent' : colors.cardBorder,
          borderBottomWidth: transparent ? 0 : 1,
        },
      ]}
    >
      <Pressable onPress={onBack} style={styles.side} hitSlop={12}>
        <ChevronLeft size={24} color={colors.textPrimary} strokeWidth={2.2} />
      </Pressable>
      <Text
        style={[
          isLarge ? typography.titleLarge : typography.subtitle,
          { color: colors.textPrimary, flex: 1, textAlign: 'center' },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={styles.side}>{right ?? null}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 14,
  },
  side: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
