import { darkColors, darkGradients } from './dark';
import { lightColors, lightGradients } from './light';
import { buildShadow, buildTabBar, motion, radii, spacing } from './shared';
import { buildTypography, fontFamily } from './typography';

export { radii, spacing, motion, fontFamily, buildTypography };

export function buildTheme(isDark) {
  const colors = isDark ? darkColors : lightColors;
  const gradients = isDark ? darkGradients : lightGradients;
  return {
    isDark,
    colors,
    gradients,
    typography: buildTypography(fontFamily),
    radii,
    spacing,
    motion,
    shadow: buildShadow(colors),
    tabBar: buildTabBar(colors),
  };
}

export const lightTheme = buildTheme(false);
export const darkTheme = buildTheme(true);

export const colors = lightColors;
export const gradients = lightGradients;
export const typography = buildTypography(fontFamily);
export const shadow = buildShadow(lightColors);
export const tabBar = buildTabBar(lightColors);
