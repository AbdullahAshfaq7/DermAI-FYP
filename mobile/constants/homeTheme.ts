import { Platform, StyleSheet } from 'react-native';

import { componentHeights } from '@/theme/tokens';

export {
  spacing as SPACING,
  radius as RADIUS,
  typography as FONT,
  createShadowStyle,
  createCardStyle,
} from '@/theme/tokens';

export { getThemeGradients, getThemeColors } from '@/theme/colors';

/** @deprecated Use useAppTheme().colors instead */
export const COLORS = {
  background: '#F4F7FB',
  white: '#FFFFFF',
  navy: '#102A43',
  navyDark: '#0C1927',
  primary: '#1769C2',
  primaryDeep: '#11549B',
  blue: '#3878C8',
  cyan: '#12AFC1',
  turquoise: '#12AFC1',
  violet: '#7C6CF6',
  violetSoft: '#8B5CF6',
  textPrimary: '#102A43',
  textSecondary: '#52677D',
  textMuted: '#8293A5',
  border: '#DCE5EE',
  borderLight: '#E8EEF4',
  cardBlue: '#E8F2FC',
  cardBlueLight: '#EAF3FD',
  heroGradientStart: '#EEF6FD',
  heroGradientEnd: '#D9EBFA',
  shadow: '#19334C',
  inactive: '#8293A5',
  inactiveLight: '#8A9BAE',
  success: '#168A65',
  warning: '#B7791F',
  error: '#C74E5B',
  info: '#3878C8',
} as const;

export const GRADIENTS = {
  primary: ['#11549B', '#12AFC1'] as const,
  primaryButton: ['#1769C2', '#12AFC1'] as const,
  centerFab: ['#1769C2', '#12AFC1'] as const,
  hero: ['#EEF6FD', '#D9EBFA'] as const,
};

export const SHADOWS = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  fab: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  soft: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
});

export { componentHeights };
