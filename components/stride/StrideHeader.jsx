import { Bell, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import StepsPill from './StepsPill';

export default function StrideHeader({
  title,
  onBack,
  onNotifications,
  onProfile,
  avatarUri,
  showBrand = false,
  showSteps = false,
  steps = 0,
  right,
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top + 8,
          backgroundColor: `${c.screenBg}CC`,
          borderBottomColor: c.headerBorder ?? c.cardBorder,
        },
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={12}>
            <ChevronLeft size={24} color={c.primary} strokeWidth={2.5} />
          </Pressable>
        ) : onProfile ? (
          <Pressable onPress={onProfile} style={styles.profileBtn}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: `${c.primary}33` }]} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: c.primarySoft, borderColor: `${c.primary}33` }]} />
            )}
            {showBrand && <Text style={[styles.brand, { color: c.primary }]}>STRIDE</Text>}
          </Pressable>
        ) : (
          <View style={styles.iconBtn} />
        )}

        {title ? (
          <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={styles.flex} />
        )}

        <View style={styles.right}>
          {showSteps && <StepsPill steps={steps} compact />}
          {right}
          {onNotifications && (
            <Pressable onPress={onNotifications} style={styles.iconBtn}>
              <Bell size={24} color={c.primary} strokeWidth={2} />
              <View style={styles.dot} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  flex: { flex: 1 },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
