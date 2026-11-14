import type { TextStyle } from 'react-native';

export const fonts = {
  sora500: 'Sora_500Medium',
  sora600: 'Sora_600SemiBold',
  sans400: 'DMSans_400Regular',
  sans500: 'DMSans_500Medium',
  sans600: 'DMSans_600SemiBold',
} as const;

/** design.md section 4. Tracking converted from % of size to points. */
export const type = {
  score: { fontFamily: fonts.sora600, fontSize: 48, lineHeight: 52, letterSpacing: -1.9 },
  display: { fontFamily: fonts.sora600, fontSize: 28, lineHeight: 32, letterSpacing: -0.7 },
  title: { fontFamily: fonts.sora600, fontSize: 22, lineHeight: 26, letterSpacing: -0.44 },
  heading: { fontFamily: fonts.sora600, fontSize: 17, lineHeight: 22, letterSpacing: -0.17 },
  number: { fontFamily: fonts.sora600, fontSize: 22, lineHeight: 26, letterSpacing: -0.4 },
  body: { fontFamily: fonts.sans400, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

/** 4 pt base. Screen side padding 20, card gap 12, card inset 16, section gap 24. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  screen: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sheet: 24,
  card: 16,
  control: 12,
  full: 999,
} as const;

export const hitTarget = 44;
