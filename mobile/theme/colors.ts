/**
 * Design tokens. Clinical blue to teal on cool pearl for patients, deep navy Night for the scan flow,
 * teal-green for dermatologists.
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
  /** Clinical blue: actions, progress, selection. */
  brand: string;
  /** Teal end of the brand gradient (primary buttons, scan button). */
  brandAlt: string;
  brandDeep: string;
  brandWash: string;
  brandSoft: string;
  /** Teal-green: dermatologist-only. */
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
  bg: '#F3F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EAF0F8',
  border: '#DDE6F1',
  hairline: '#E7EDF5',
  textPrimary: '#14233D',
  textSecondary: '#55657D',
  textMuted: '#8B98AC',
  onFill: '#FFFFFF',
  ink: '#14233D',
  onInk: '#FFFFFF',
  brand: '#2F67C9',
  brandAlt: '#4BB3C2',
  brandDeep: '#1F4F9F',
  brandWash: '#E4EEFA',
  brandSoft: '#C7DAF3',
  clinician: '#2A9A84',
  clinicianDeep: '#1D7766',
  clinicianWash: '#DDF3EE',
  peach: '#FF8F6B',
  peachDeep: '#C4532F',
  peachWash: '#FFEEE6',
  butter: '#4BB3C2',
  butterDeep: '#1D7480',
  butterWash: '#E0F3F5',
  good: '#17855A',
  goodIcon: '#17855A',
  goodWash: '#E1F4EA',
  watch: '#D45A2A',
  watchIcon: '#EE7A43',
  watchWash: '#FDECE3',
  act: '#C8363A',
  actIcon: '#C8363A',
  actWash: '#FDE5E4',
  scrim: 'rgba(20, 35, 61, 0.45)',
  camera: '#0C1628',
  shadow: 'rgba(20, 35, 61, 0.12)',
  dock: 'rgba(255, 255, 255, 0.97)',
};

export const darkColors: ThemeColors = {
  bg: '#0B1424',
  surface: '#132038',
  surfaceMuted: '#1A2A46',
  border: '#243756',
  hairline: '#1E2F4D',
  textPrimary: '#EAF1FB',
  textSecondary: '#A3B3CC',
  textMuted: '#72839E',
  onFill: '#FFFFFF',
  ink: '#EAF1FB',
  onInk: '#0B1424',
  brand: '#5B95F0',
  brandAlt: '#4FC3CF',
  brandDeep: '#A9C8F7',
  brandWash: '#172E55',
  brandSoft: '#24457C',
  clinician: '#4FC7B0',
  clinicianDeep: '#8FE0CF',
  clinicianWash: '#113A35',
  peach: '#FF9E80',
  peachDeep: '#FFB79F',
  peachWash: '#3A2320',
  butter: '#4FC3CF',
  butterDeep: '#9BE2EA',
  butterWash: '#10373C',
  good: '#6FDCA8',
  goodIcon: '#4FC98F',
  goodWash: '#143326',
  watch: '#FFA27A',
  watchIcon: '#FF8A5C',
  watchWash: '#3A2218',
  act: '#FF8E8A',
  actIcon: '#F06A66',
  actWash: '#3D1C20',
  scrim: 'rgba(0, 0, 0, 0.6)',
  camera: '#081120',
  shadow: 'rgba(0, 0, 0, 0)',
  dock: 'rgba(19, 32, 56, 0.97)',
};

/** Night: camera, analysis and results, so skin and the map are the brightest things on screen. */
export const nightColors: ThemeColors = {
  ...darkColors,
  bg: '#0E1A2E',
  surface: '#152540',
  surfaceMuted: '#1D3152',
  border: '#2A4168',
  hairline: '#1D3152',
  textPrimary: '#EAF2FF',
  textSecondary: '#A6B8D4',
  textMuted: '#7D90B0',
  brand: '#4F8BEA',
  brandAlt: '#4BB3C2',
  brandDeep: '#B7D0F7',
  brandWash: '#1D3152',
  camera: '#0E1A2E',
};

/** Concern scale. Glowing dots on Night only (face map, concern bars). */
export const concernScale = {
  Clear: '#5AB4E0',
  Mild: '#FFB088',
  Moderate: '#FF9563',
  High: '#FF4F6D',
} as const;

export type ConcernLevel = keyof typeof concernScale;

/** Fitzpatrick I to VI: the logo, the skin-tone picker and default avatars only. Never status. */
export const fitzpatrick = ['#F5DCCB', '#EBC2A2', '#D4A07A', '#A8714C', '#7A4B31', '#4A2E22'] as const;

/** Per-concern accent hues: icons and bars on the Home skin overview. Identity, not severity. */
export const concernHue = {
  acne: '#4A82E8',
  dryness: '#43B08F',
  redness: '#E0699A',
  darkSpots: '#7C5CE6',
  sensitivity: '#3DB2CC',
  pores: '#5C63DE',
} as const;

/** Dermatologist screens swap clinical blue for teal-green everywhere. */
export function withRole(c: ThemeColors, clinician: boolean): ThemeColors {
  if (!clinician) return c;
  return { ...c, brand: c.clinician, brandAlt: c.clinician, brandDeep: c.clinicianDeep, brandWash: c.clinicianWash, brandSoft: c.clinicianWash };
}

export function getColors(theme: ResolvedTheme): ThemeColors {
  return theme === 'dark' ? darkColors : lightColors;
}
