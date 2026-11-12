import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode, useMemo } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

import { GLASS_BORDER_RADIUS } from '@/constants/navigation';
import { ABSOLUTE_FILL_STYLE } from '@/constants/layout';

const GLASS_STYLES = {
  light: {
    overlay: 'rgba(255, 255, 255, 0.42)',
    border: 'rgba(255, 255, 255, 0.72)',
    innerBorder: 'rgba(117, 140, 163, 0.12)',
    topHighlight: 'rgba(255, 255, 255, 0.58)',
    shadow: 'rgba(19, 42, 65, 0.14)',
    gradient: ['rgba(255,255,255,0.44)', 'rgba(255,255,255,0.18)'] as const,
    blurIntensity: 88,
    androidOverlay: 'rgba(255, 255, 255, 0.52)',
  },
  dark: {
    overlay: 'rgba(12, 25, 38, 0.52)',
    border: 'rgba(255, 255, 255, 0.12)',
    innerBorder: 'rgba(255, 255, 255, 0.05)',
    topHighlight: 'rgba(255, 255, 255, 0.10)',
    shadow: 'rgba(0, 0, 0, 0.34)',
    gradient: ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0.03)'] as const,
    blurIntensity: 92,
    androidOverlay: 'rgba(12, 25, 38, 0.68)',
  },
} as const;

interface GlassNavigationSurfaceProps {
  isDark: boolean;
  children: ReactNode;
  style?: ViewStyle;
}

export function GlassNavigationSurface({ isDark, children, style }: GlassNavigationSurfaceProps) {
  const glass = isDark ? GLASS_STYLES.dark : GLASS_STYLES.light;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        blurContainer: {
          flex: 1,
          borderRadius: GLASS_BORDER_RADIUS,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: glass.border,
          backgroundColor: Platform.OS === 'android' ? glass.androidOverlay : 'transparent',
          ...Platform.select({
            ios: {
              shadowColor: glass.shadow,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: isDark ? 0.9 : 0.82,
              shadowRadius: isDark ? 14 : 18,
            },
            android: {
              elevation: 12,
            },
            default: {},
          }),
        },
        gradientOverlay: {
          ...ABSOLUTE_FILL_STYLE,
        },
        tintOverlay: {
          ...ABSOLUTE_FILL_STYLE,
          backgroundColor: glass.overlay,
        },
        topHighlight: {
          position: 'absolute',
          top: 0,
          left: 20,
          right: 20,
          height: StyleSheet.hairlineWidth,
          backgroundColor: glass.topHighlight,
          zIndex: 2,
        },
        innerBorder: {
          ...ABSOLUTE_FILL_STYLE,
          borderRadius: GLASS_BORDER_RADIUS - 1,
          borderWidth: 1,
          borderColor: glass.innerBorder,
          zIndex: 2,
        },
        contentLayer: {
          flex: 1,
          backgroundColor: 'transparent',
        },
      }),
    [glass, isDark],
  );

  return (
    <BlurView
      tint={isDark ? 'dark' : 'light'}
      intensity={glass.blurIntensity}
      style={[styles.blurContainer, style]}>
      <LinearGradient
        colors={[...glass.gradient]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />
      <View style={styles.tintOverlay} pointerEvents="none" />
      <View style={styles.topHighlight} pointerEvents="none" />
      <View style={styles.innerBorder} pointerEvents="none" />
      <View style={styles.contentLayer}>{children}</View>
    </BlurView>
  );
}
