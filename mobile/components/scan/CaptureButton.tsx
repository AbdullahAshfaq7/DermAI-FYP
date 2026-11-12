import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { getScanColors, SCAN_CAMERA_OVERLAY } from '@/constants/scanTheme';
import { useAppTheme } from '@/theme/useAppTheme';

interface CaptureButtonProps {
  onPress: () => void;
  disabled?: boolean;
  isCapturing?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
}

export function CaptureButton({
  onPress,
  disabled = false,
  isCapturing = false,
  gradientColors,
}: CaptureButtonProps) {
  const { colors } = useAppTheme();
  const scanColors = useMemo(() => getScanColors(colors), [colors]);
  const gradient = gradientColors ?? [scanColors.captureInnerStart, scanColors.captureInnerEnd];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        outerRing: {
          width: 80,
          height: 80,
          borderRadius: 40,
          borderWidth: 4,
          borderColor: SCAN_CAMERA_OVERLAY.captureRing,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
        },
        innerCircle: {
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
        },
        innerDot: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
        },
        pressed: {
          opacity: 0.85,
          transform: [{ scale: 0.94 }],
        },
        disabled: {
          opacity: 0.5,
        },
      }),
    [],
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isCapturing}
      accessibilityRole="button"
      accessibilityLabel="Capture photo"
      accessibilityState={{ disabled: disabled || isCapturing }}
      style={({ pressed }) => [
        styles.outerRing,
        (pressed || isCapturing) && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.innerCircle}>
        {isCapturing ? (
          <ActivityIndicator color={SCAN_CAMERA_OVERLAY.textPrimary} size="small" />
        ) : (
          <View style={styles.innerDot} />
        )}
      </LinearGradient>
    </Pressable>
  );
}
