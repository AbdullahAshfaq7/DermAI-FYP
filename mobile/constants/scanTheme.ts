import { Dimensions } from 'react-native';

import { SPACING } from '@/constants/homeTheme';
import type { ThemeColors } from '@/theme/types';

/** Navy camera viewport — kept dark for face visibility regardless of app theme */
export const SCAN_CAMERA_BG = '#0F2744';
export const SCAN_CAMERA_BG_DEEP = '#0A1628';

/** Fixed overlay colors for the camera / analyzing viewport */
export const SCAN_CAMERA_OVERLAY = {
  overlay: 'rgba(15, 39, 68, 0.72)',
  overlayLight: 'rgba(15, 39, 68, 0.45)',
  reviewOverlay: 'rgba(15, 39, 68, 0.18)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.75)',
  textMuted: 'rgba(255, 255, 255, 0.55)',
  captureRing: '#FFFFFF',
  progressTrack: 'rgba(255, 255, 255, 0.15)',
  stageContainer: 'rgba(255, 255, 255, 0.06)',
  stageDot: 'rgba(255, 255, 255, 0.2)',
  disclaimerDarkBg: 'rgba(255, 255, 255, 0.08)',
  disclaimerDarkText: 'rgba(255, 255, 255, 0.65)',
} as const;

/** Map semantic theme colors to scan-specific accents (buttons, guides, progress) */
export function getScanColors(colors: ThemeColors) {
  return {
    ...SCAN_CAMERA_OVERLAY,
    cameraBg: SCAN_CAMERA_BG,
    guideBorder: `${colors.secondary}D9`,
    guideCorner: colors.secondary,
    guideLine: `${colors.secondary}33`,
    landmark: `${colors.secondary}8C`,
    scanLine: colors.secondary,
    progressFill: colors.secondary,
    captureInnerStart: colors.primary,
    captureInnerEnd: colors.secondary,
    cardBg: colors.surface,
    screenBg: colors.background,
    primarySoft: colors.primarySoft,
  };
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FACE_GUIDE = {
  width: Math.min(SCREEN_WIDTH * 0.72, 300),
  height: Math.min(SCREEN_HEIGHT * 0.38, 380),
  borderRadius: 72,
  cornerSize: 28,
} as const;

export const SCAN_SPACING = {
  headerHeight: 56,
  controlsBottom: SPACING.lg,
  contentHorizontal: SPACING.md,
} as const;
