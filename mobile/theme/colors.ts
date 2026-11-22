/**
 * Lumen design tokens (storyboard v3, 20 Nov 2026).
 * Lamp violet on pearl for patients, Night for the scan flow, Emerald for dermatologists.
 * Token names are shared by every screen; the role and night variants swap values, not names.
 */

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
  /** Text and icons on Lamp, Emerald or Aubergine fills. */
  onFill: string;
  /** Dark button fill (Aubergine), light in dark mode. */
  ink: string;
  onInk: string;
  /** Lamp violet: actions, progress, selection. */
  brand: string;
  brandDeep: string;
  brandWash: string;
  brandSoft: string;
  /** Emerald: dermatologist-only. */
  clinician: string;
  clinicianDeep: string;
  clinicianWash: string;
  peach: string;
  peachDeep: string;
  peachWash: string;
  butter: string;
  butterDeep: string;
  butterWash: string;
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
  /** Soft drop shadow colour for cards (light) or none (dark). */
  shadow: string;
  /** Background of the floating dock. */
  dock: string;
}

export const lightColors: ThemeColors = {
  bg: '#F7F4FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F0EBF7',
  border: '#E7E0F1',
  hairline: '#EEE8F5',
  textPrimary: '#21143A',
  textSecondary: '#615578',
  textMuted: '#9A90AE',
  onFill: '#FFFFFF',
  ink: '#21143A',
  onInk: '#FFFFFF',
  brand: '#5B3DF5',
  brandDeep: '#4327D6',
  brandWash: '#EEEAFF',
  brandSoft: '#D8CFFF',
  clinician: '#0B8A63',
  clinicianDeep: '#06694B',
  clinicianWash: '#E0F4EC',
  peach: '#FF8F6B',
  peachDeep: '#C4532F',
  peachWash: '#FFEEE6',
  butter: '#FFD66E',
  butterDeep: '#7A5600',
  butterWash: '#FFF5D6',
  good: '#17855A',
  goodIcon: '#17855A',
  goodWash: '#E1F4EA',
  watch: '#9A6500',
  watchIcon: '#C98B10',
  watchWash: '#FFF1D1',
  act: '#C8363A',
  actIcon: '#C8363A',
  actWash: '#FDE5E4',
  scrim: 'rgba(33, 20, 58, 0.45)',
  camera: '#150E26',
  shadow: 'rgba(33, 20, 58, 0.14)',
  dock: 'rgba(255, 255, 255, 0.97)',
};

export const darkColors: ThemeColors = {
  bg: '#120C1F',
  surface: '#1C1530',
  surfaceMuted: '#261E3D',
  border: '#2F2648',
  hairline: '#2A2242',
  textPrimary: '#F0EBFA',
  textSecondary: '#AEA3C6',
  textMuted: '#7C7196',
  onFill: '#FFFFFF',
  ink: '#F0EBFA',
  onInk: '#150E26',
  brand: '#8C7BFF',
  brandDeep: '#B9AEFF',
  brandWash: '#2A2252',
  brandSoft: '#3D3375',
  clinician: '#4FD1A5',
  clinicianDeep: '#8BE6C6',
  clinicianWash: '#123A2E',
  peach: '#FF9E80',
  peachDeep: '#FFB79F',
  peachWash: '#3A2320',
  butter: '#FFD66E',
  butterDeep: '#FFE29A',
  butterWash: '#352B14',
  good: '#6FDCA8',
  goodIcon: '#4FC98F',
  goodWash: '#143326',
  watch: '#F2C46B',
  watchIcon: '#E5AE3F',
  watchWash: '#352A12',
  act: '#FF8E8A',
  actIcon: '#F06A66',
  actWash: '#3D1C20',
  scrim: 'rgba(0, 0, 0, 0.6)',
  camera: '#0D0818',
  shadow: 'rgba(0, 0, 0, 0)',
  dock: 'rgba(33, 26, 54, 0.97)',
};

/** Night: camera, analysis and results, so skin and the map are the brightest things on screen. */
export const nightColors: ThemeColors = {
  ...darkColors,
  bg: '#150E26',
  surface: '#211839',
  surfaceMuted: '#2D2350',
  border: '#3A2F63',
  hairline: '#2D2350',
  textPrimary: '#EEE9FF',
  textSecondary: '#B3A9D6',
  textMuted: '#8C82B0',
  brand: '#7B63FF',
  brandDeep: '#C9BEFF',
  brandWash: '#2D2350',
  camera: '#150E26',
};

/** Concern scale. Glowing dots on Night only (face map, concern bars). */
export const concernScale = {
  Clear: '#8C7BFF',
  Mild: '#FFD66E',
  Moderate: '#FF9563',
  High: '#FF4F6D',
} as const;

export type ConcernLevel = keyof typeof concernScale;

/** Fitzpatrick I to VI: the logo, the skin-tone picker and default avatars only. Never status. */
export const fitzpatrick = ['#F5DCCB', '#EBC2A2', '#D4A07A', '#A8714C', '#7A4B31', '#4A2E22'] as const;

/** Dermatologist screens swap Lamp violet for Emerald everywhere. */
export function withRole(c: ThemeColors, clinician: boolean): ThemeColors {
  if (!clinician) return c;
  return { ...c, brand: c.clinician, brandDeep: c.clinicianDeep, brandWash: c.clinicianWash, brandSoft: c.clinicianWash };
}

export function getColors(theme: ResolvedTheme): ThemeColors {
  return theme === 'dark' ? darkColors : lightColors;
}
