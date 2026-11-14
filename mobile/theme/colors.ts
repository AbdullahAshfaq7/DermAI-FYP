/** Design tokens from Claude outputs/design.md, section 3. */

export type ResolvedTheme = 'light' | 'dark';
export type ThemePreference = ResolvedTheme | 'system';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  hairline: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  /** Text and icons on Ink, brand or clinician fills. */
  onFill: string;
  /** Primary button fill (Ink in light, light ink in dark). */
  ink: string;
  onInk: string;
  brand: string;
  brandDeep: string;
  brandWash: string;
  clinician: string;
  clinicianDeep: string;
  clinicianWash: string;
  good: string;
  goodIcon: string;
  goodWash: string;
  watch: string;
  watchIcon: string;
  watchWash: string;
  act: string;
  actIcon: string;
  actWash: string;
  scrim: string;
  camera: string;
}

export const lightColors: ThemeColors = {
  bg: '#F4F7F6',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF0EE',
  border: '#DCE4E2',
  hairline: '#E6ECEA',
  textPrimary: '#0E2A33',
  textSecondary: '#4A5F66',
  textMuted: '#84969B',
  onFill: '#FFFFFF',
  ink: '#0E2A33',
  onInk: '#FFFFFF',
  brand: '#1F7A72',
  brandDeep: '#155C56',
  brandWash: '#E1F0EC',
  clinician: '#4A3D78',
  clinicianDeep: '#3A2F60',
  clinicianWash: '#EEEAF7',
  good: '#23704A',
  goodIcon: '#2F8F5B',
  goodWash: '#E3F2EA',
  watch: '#8C6110',
  watchIcon: '#B9811A',
  watchWash: '#FBF0D9',
  act: '#A3362E',
  actIcon: '#C2463D',
  actWash: '#F8E2DF',
  scrim: 'rgba(14, 42, 51, 0.45)',
  camera: '#16282E',
};

export const darkColors: ThemeColors = {
  bg: '#0B1F25',
  surface: '#122A31',
  surfaceMuted: '#18343C',
  border: '#24434B',
  hairline: '#1E3A42',
  textPrimary: '#E8F0EE',
  textSecondary: '#A9BCBA',
  textMuted: '#6F8789',
  onFill: '#FFFFFF',
  ink: '#E8F0EE',
  onInk: '#0B1F25',
  brand: '#4FB3A6',
  brandDeep: '#7FD3C5',
  brandWash: '#173E3B',
  clinician: '#B4A7E8',
  clinicianDeep: '#CFC5F2',
  clinicianWash: '#2A2547',
  good: '#7FD3A3',
  goodIcon: '#5CBF88',
  goodWash: '#183A2A',
  watch: '#E9C277',
  watchIcon: '#D9A846',
  watchWash: '#3A2F17',
  act: '#F09A90',
  actIcon: '#E2766B',
  actWash: '#43231F',
  scrim: 'rgba(0, 0, 0, 0.6)',
  camera: '#0C1A1E',
};

/** Concern scale: face map and concern bars only. */
export const concernScale = {
  Clear: '#CFE7E1',
  Mild: '#F2D9A2',
  Moderate: '#EFAA8F',
  High: '#D9655A',
} as const;

export type ConcernLevel = keyof typeof concernScale;

/** Fitzpatrick I to VI: brand mark, skin-tone picker and default avatars only. */
export const fitzpatrick = ['#F5DCCB', '#EBC2A2', '#D4A07A', '#A8714C', '#7A4B31', '#4A2E22'] as const;

export function getColors(theme: ResolvedTheme): ThemeColors {
  return theme === 'dark' ? darkColors : lightColors;
}
