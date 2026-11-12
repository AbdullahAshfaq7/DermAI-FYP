import { Platform, ViewStyle } from 'react-native';

import type { ThemeColors } from '@/theme/types';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 999,
} as const;

export const typography = {
  brand: 22,
  title: 18,
  subtitle: 15,
  body: 14,
  caption: 12,
  tiny: 11,
} as const;

export const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
} as const;

export const componentHeights = {
  row: 54,
  button: 48,
  input: 44,
  tabBar: 78,
  scanButton: 70,
} as const;

export type ShadowLevel = 'none' | 'soft' | 'card';

export function createShadowStyle(
  colors: ThemeColors,
  isDark: boolean,
  level: ShadowLevel = 'soft',
): ViewStyle {
  if (level === 'none' || isDark) {
    return {};
  }

  const opacity = level === 'card' ? 0.12 : 0.08;
  const radiusValue = level === 'card' ? 12 : 8;
  const offsetY = level === 'card' ? 4 : 2;

  return Platform.select({
    ios: {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radiusValue,
    },
    android: {
      elevation: level === 'card' ? 3 : 2,
    },
    default: {},
  }) as ViewStyle;
}

export function createCardStyle(colors: ThemeColors, isDark: boolean): ViewStyle {
  return {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...(isDark
      ? { borderWidth: 1, borderColor: colors.border }
      : createShadowStyle(colors, isDark, 'card')),
  };
}
