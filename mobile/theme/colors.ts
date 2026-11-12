import type { ResolvedTheme, ThemeColors } from '@/theme/types';

export const lightColors: ThemeColors = {
  background: '#F4F7FB',
  backgroundSecondary: '#EDF3F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  primary: '#1769C2',
  primaryPressed: '#11549B',
  primarySoft: '#E8F2FC',
  secondary: '#12AFC1',
  textPrimary: '#102A43',
  textSecondary: '#52677D',
  textMuted: '#8293A5',
  textInverse: '#FFFFFF',
  border: '#DCE5EE',
  divider: '#E8EEF4',
  icon: '#31516F',
  iconMuted: '#8A9BAE',
  success: '#168A65',
  successSoft: '#E6F6F0',
  warning: '#B7791F',
  warningSoft: '#FFF6DD',
  danger: '#C74E5B',
  dangerSoft: '#FDECEF',
  info: '#3878C8',
  infoSoft: '#EAF3FD',
  overlay: 'rgba(12, 31, 50, 0.42)',
  tabBar: '#FFFFFF',
  shadow: 'rgba(25, 51, 76, 0.12)',
};

export const darkColors: ThemeColors = {
  background: '#08131F',
  backgroundSecondary: '#0C1927',
  surface: '#102235',
  surfaceElevated: '#142A40',
  surfaceMuted: '#172D42',
  primary: '#58A6F3',
  primaryPressed: '#3E8DDB',
  primarySoft: '#173B5D',
  secondary: '#32C6D4',
  textPrimary: '#F0F6FC',
  textSecondary: '#B4C3D2',
  textMuted: '#8194A8',
  textInverse: '#07121D',
  border: '#294158',
  divider: '#21384D',
  icon: '#C1D0DE',
  iconMuted: '#7890A6',
  success: '#48C99A',
  successSoft: '#123D35',
  warning: '#E8B74E',
  warningSoft: '#443619',
  danger: '#F0808C',
  dangerSoft: '#48252D',
  info: '#71B2F5',
  infoSoft: '#183B5A',
  overlay: 'rgba(0, 0, 0, 0.64)',
  tabBar: '#0F2133',
  shadow: 'rgba(0, 0, 0, 0.32)',
};

export function getThemeColors(resolvedTheme: ResolvedTheme): ThemeColors {
  return resolvedTheme === 'dark' ? darkColors : lightColors;
}

export const THEME_GRADIENTS = {
  light: {
    hero: ['#EEF6FD', '#D9EBFA'] as const,
    primaryButton: ['#1769C2', '#12AFC1'] as const,
    scan: ['#1769C2', '#12AFC1'] as const,
  },
  dark: {
    hero: ['#142A40', '#0F2133'] as const,
    primaryButton: ['#3E8DDB', '#32C6D4'] as const,
    scan: ['#3E8DDB', '#32C6D4'] as const,
  },
} as const;

export function getThemeGradients(resolvedTheme: ResolvedTheme) {
  return THEME_GRADIENTS[resolvedTheme];
}
