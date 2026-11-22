import type { TextStyle } from 'react-native';

export const fonts = {
  display600: 'BricolageGrotesque_600SemiBold',
  display700: 'BricolageGrotesque_700Bold',
  display800: 'BricolageGrotesque_800ExtraBold',
  sans400: 'InstrumentSans_400Regular',
  sans500: 'InstrumentSans_500Medium',
  sans600: 'InstrumentSans_600SemiBold',
} as const;

/** Lumen type: Bricolage Grotesque for titles and numbers, Instrument Sans for everything people read and tap. */
export const type = {
  score: { fontFamily: fonts.display800, fontSize: 52, lineHeight: 54, letterSpacing: -2.6 },
  display: { fontFamily: fonts.display800, fontSize: 30, lineHeight: 32, letterSpacing: -1.2 },
  title: { fontFamily: fonts.display700, fontSize: 23, lineHeight: 26, letterSpacing: -0.7 },
  heading: { fontFamily: fonts.display700, fontSize: 17, lineHeight: 21, letterSpacing: -0.2 },
  number: { fontFamily: fonts.display800, fontSize: 24, lineHeight: 26, letterSpacing: -0.9 },
  body: { fontFamily: fonts.sans400, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.sans600, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.sans400, fontSize: 13, lineHeight: 18 },
  smallStrong: { fontFamily: fonts.sans600, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.sans500, fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

/** 4 pt base. Screen side padding 20, card gap 12, card inset 16, section gap 24. Dock clearance 96. */
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

/** Lumen: big soft cards, pill buttons and chips. */
export const radius = {
  sheet: 28,
  card: 22,
  control: 16,
  full: 999,
} as const;

export const hitTarget = 44;

/** Space to leave under scrolling tab screens so content clears the floating dock. */
export const dockClearance = 104;
