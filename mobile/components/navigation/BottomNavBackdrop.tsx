import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { CENTER_SCAN_OVERLAP, CENTER_SCAN_SIZE, GLASS_NAV_BAR_HEIGHT } from '@/constants/navigation';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';

const SCRIM_STYLES = {
  light: {
    fade: ['rgba(244, 247, 251, 0)', 'rgba(244, 247, 251, 0.94)'] as const,
    blurIntensity: 40,
    androidBase: 'rgba(244, 247, 251, 0.9)',
  },
  dark: {
    fade: ['rgba(8, 19, 31, 0)', 'rgba(8, 19, 31, 0.96)'] as const,
    blurIntensity: 44,
    androidBase: 'rgba(8, 19, 31, 0.92)',
  },
} as const;

interface BottomNavBackdropProps {
  bottomOffset: number;
  isDark: boolean;
}

/** Blur/fade only in the safe-area strip below the navbar pill — never above it. */
export function BottomNavBackdrop({ bottomOffset, isDark }: BottomNavBackdropProps) {
  const scrim = isDark ? SCRIM_STYLES.dark : SCRIM_STYLES.light;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: bottomOffset,
          overflow: 'hidden',
        },
        blurLayer: {
          ...ABSOLUTE_FILL_STYLE,
        },
        gradientLayer: {
          ...ABSOLUTE_FILL_STYLE,
        },
        androidFallback: {
          ...ABSOLUTE_FILL_STYLE,
          backgroundColor: scrim.androidBase,
        },
      }),
    [bottomOffset, scrim.androidBase],
  );

  if (bottomOffset <= 0) {
    return null;
  }

  return (
    <View style={styles.backdrop} pointerEvents="none">
      {Platform.OS === 'ios' ? (
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={scrim.blurIntensity}
          style={styles.blurLayer}
        />
      ) : (
        <View style={styles.androidFallback} />
      )}

      <LinearGradient
        colors={[...scrim.fade]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientLayer}
        pointerEvents="none"
      />
    </View>
  );
}

export function getBottomNavWrapperHeight(bottomOffset: number): number {
  const scanRise = CENTER_SCAN_SIZE / 2 - CENTER_SCAN_OVERLAP;
  return bottomOffset + GLASS_NAV_BAR_HEIGHT + scanRise + 8;
}
