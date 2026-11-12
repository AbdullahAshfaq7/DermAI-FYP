import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { SCAN_CAMERA_BG } from '@/constants/scanTheme';
import { useAppTheme } from '@/theme/useAppTheme';

interface CameraPermissionStateProps {
  isLoading?: boolean;
  isDenied?: boolean;
  onRequestPermission: () => void | Promise<void>;
  onGoBack: () => void;
  buttonGradient?: readonly [string, string, ...string[]];
}

export function CameraPermissionState({
  isLoading = false,
  isDenied = false,
  onRequestPermission,
  onGoBack,
  buttonGradient,
}: CameraPermissionStateProps) {
  const { colors, isDark } = useAppTheme();
  const gradientColors = buttonGradient ?? [colors.primary, colors.secondary];

  const handlePrimaryPress = () => {
    if (isDenied) {
      void Linking.openSettings();
      return;
    }
    void onRequestPermission();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: SPACING.xl,
          backgroundColor: SCAN_CAMERA_BG,
        },
        iconCircle: {
          width: 88,
          height: 88,
          borderRadius: RADIUS.full,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.lg,
        },
        title: {
          fontSize: FONT.title + 2,
          fontWeight: '700',
          color: colors.textInverse,
          textAlign: 'center',
          marginBottom: SPACING.sm,
        },
        description: {
          fontSize: FONT.body,
          color: isDark ? colors.textSecondary : 'rgba(255, 255, 255, 0.75)',
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: SPACING.xl,
        },
        actions: {
          width: '100%',
          gap: SPACING.sm,
        },
        primaryButton: {
          borderRadius: RADIUS.lg,
          overflow: 'hidden',
        },
        primaryGradient: {
          paddingVertical: SPACING.md,
          alignItems: 'center',
        },
        primaryText: {
          fontSize: FONT.subtitle,
          fontWeight: '600',
          color: colors.textInverse,
        },
        secondaryButton: {
          paddingVertical: SPACING.md,
          alignItems: 'center',
        },
        secondaryText: {
          fontSize: FONT.body,
          fontWeight: '600',
          color: colors.secondary,
        },
        pressed: {
          opacity: 0.82,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="camera-outline" size={40} color={colors.primary} />
      </View>

      <Text style={styles.title}>
        {isLoading ? 'Checking camera access…' : 'Camera access is required'}
      </Text>

      <Text style={styles.description}>
        {isLoading
          ? 'Please wait while we prepare your skin scan.'
          : 'dermAI needs access to your camera to capture a clear photo for skin analysis.'}
      </Text>

      {!isLoading && (
        <View style={styles.actions}>
          <Pressable
            onPress={handlePrimaryPress}
            accessibilityRole="button"
            accessibilityLabel="Allow camera access"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryGradient}>
              <Text style={styles.primaryText}>
                {isDenied ? 'Open Settings' : 'Allow Camera Access'}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onGoBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Go Back</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
