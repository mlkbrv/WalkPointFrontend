export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const motion = {
  pressScale: 0.97,
  durationFast: 150,
  durationNormal: 250,
};

export function buildShadow(colors) {
  return {
    card: {
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
    soft: {
      shadowColor: colors.shadowPrimary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
    glow: {
      shadowColor: colors.shadowAccent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28,
      shadowRadius: 12,
      elevation: 8,
    },
  };
}

export function buildTabBar(colors) {
  return {
    activeTint: colors.primary,
    inactiveTint: colors.textMuted,
    height: 70,
    paddingBottomMin: 8,
    bg: colors.tabBarBg,
    border: colors.tabBarBorder,
    labelStyle: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 2,
    },
    iconStyle: {
      marginTop: 2,
    },
  };
}
