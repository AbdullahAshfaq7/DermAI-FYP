import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getScanColors, SCAN_CAMERA_OVERLAY } from '@/constants/scanTheme';
import { useAppTheme } from '@/theme/useAppTheme';

import { CaptureButton } from './CaptureButton';

interface CameraControlsProps {
  onFlip: () => void;
  onCapture: () => void;
  onFlashToggle: () => void;
  flashEnabled: boolean;
  isCapturing: boolean;
  facing: 'front' | 'back';
  captureGradient?: readonly [string, string, ...string[]];
  accentColor?: string;
  iconColor?: string;
}

export function CameraControls({
  onFlip,
  onCapture,
  onFlashToggle,
  flashEnabled,
  isCapturing,
  facing,
  captureGradient,
  accentColor,
  iconColor,
}: CameraControlsProps) {
  const { colors } = useAppTheme();
  const scanColors = useMemo(() => getScanColors(colors), [colors]);
  const resolvedAccent = accentColor ?? scanColors.guideCorner;
  const resolvedIconColor = iconColor ?? SCAN_CAMERA_OVERLAY.textPrimary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 32,
        },
        sideButton: {
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed: {
          opacity: 0.75,
          transform: [{ scale: 0.96 }],
        },
      }),
    [],
  );

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onFlip}
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${facing === 'front' ? 'back' : 'front'} camera`}
        style={({ pressed }) => [styles.sideButton, pressed && styles.pressed]}>
        <Ionicons name="camera-reverse-outline" size={26} color={resolvedIconColor} />
      </Pressable>

      <CaptureButton
        onPress={onCapture}
        disabled={isCapturing}
        isCapturing={isCapturing}
        gradientColors={captureGradient}
      />

      <Pressable
        onPress={onFlashToggle}
        accessibilityRole="button"
        accessibilityLabel={flashEnabled ? 'Turn flash off' : 'Turn flash on'}
        style={({ pressed }) => [styles.sideButton, pressed && styles.pressed]}>
        <Ionicons
          name={flashEnabled ? 'flash' : 'flash-outline'}
          size={24}
          color={flashEnabled ? resolvedAccent : resolvedIconColor}
        />
      </Pressable>
    </View>
  );
}
