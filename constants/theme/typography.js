export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

export function buildTypography(ff) {
  return {
    display: {
      fontSize: 32,
      fontFamily: ff.bold,
      letterSpacing: -0.8,
      lineHeight: 38,
    },
    titleLarge: {
      fontSize: 26,
      fontFamily: ff.bold,
      letterSpacing: -0.5,
      lineHeight: 32,
    },
    title: {
      fontSize: 22,
      fontFamily: ff.semiBold,
      letterSpacing: -0.4,
      lineHeight: 28,
    },
    subtitle: {
      fontSize: 16,
      fontFamily: ff.semiBold,
      lineHeight: 22,
    },
    body: {
      fontSize: 15,
      fontFamily: ff.regular,
      lineHeight: 22,
    },
    caption: {
      fontSize: 13,
      fontFamily: ff.medium,
      lineHeight: 18,
    },
    label: {
      fontSize: 12,
      fontFamily: ff.semiBold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
  };
}
