import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FaceGuideOverlay } from '@/components/scan/FaceGuideOverlay';
import { PhotoQualityChecklist } from '@/components/scan/PhotoQualityChecklist';
import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { APP_ROUTES } from '@/constants/navigation';
import { SCAN_CAMERA_BG } from '@/constants/scanTheme';
import { useScan } from '@/context/ScanContext';
import { getThemeGradients } from '@/theme/colors';
import { useAppTheme } from '@/theme/useAppTheme';

const PREVIEW_HEIGHT = 420;

function createReviewStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: FONT.title,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 44,
    },
    content: {
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.xl,
      gap: SPACING.lg,
    },
    previewContainer: {
      height: PREVIEW_HEIGHT,
      borderRadius: RADIUS.xl,
      overflow: 'hidden',
      backgroundColor: SCAN_CAMERA_BG,
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    instruction: {
      fontSize: FONT.body,
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: 'center',
    },
    actions: {
      gap: SPACING.sm,
      marginTop: SPACING.sm,
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
      borderRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryText: {
      fontSize: FONT.subtitle,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    errorState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: SPACING.lg,
      gap: SPACING.sm,
    },
    errorTitle: {
      fontSize: FONT.subtitle,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    errorText: {
      fontSize: FONT.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    errorButton: {
      marginTop: SPACING.sm,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
      backgroundColor: colors.primarySoft,
    },
    errorButtonText: {
      fontSize: FONT.body,
      fontWeight: '600',
      color: colors.primary,
    },
    pressed: {
      opacity: 0.82,
    },
  });
}

export default function ScanReviewScreen() {
  const router = useRouter();
  const { session, clearPhoto, startAnalysis } = useScan();
  const [imageError, setImageError] = useState(false);
  const { colors, resolvedTheme } = useAppTheme();
  const gradients = getThemeGradients(resolvedTheme);
  const styles = useMemo(() => createReviewStyles(colors), [colors]);

  useEffect(() => {
    if (!session.photoUri) {
      router.replace(APP_ROUTES.scan);
    }
  }, [router, session.photoUri]);

  const handleBack = useCallback(() => {
    clearPhoto();
    router.replace(APP_ROUTES.scan);
  }, [clearPhoto, router]);

  const handleRetake = useCallback(() => {
    clearPhoto();
    router.replace(APP_ROUTES.scan);
  }, [clearPhoto, router]);

  const handleUsePhoto = useCallback(() => {
    if (!session.photoUri) {
      return;
    }
    startAnalysis();
    router.replace(APP_ROUTES.scanAnalyzing);
  }, [router, session.photoUri, startAnalysis]);

  if (!session.photoUri) {
    return null;
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Review Photo</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.previewContainer}>
            {imageError ? (
              <View style={styles.errorState}>
                <Ionicons name="image-outline" size={40} color={colors.textMuted} />
                <Text style={styles.errorTitle}>Could not load photo</Text>
                <Text style={styles.errorText}>
                  The captured image is unavailable. Please retake your scan.
                </Text>
                <Pressable
                  onPress={handleRetake}
                  style={({ pressed }) => [styles.errorButton, pressed && styles.pressed]}>
                  <Text style={styles.errorButtonText}>Retake Photo</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Image
                  source={{ uri: session.photoUri }}
                  style={styles.previewImage}
                  contentFit="cover"
                  onError={() => setImageError(true)}
                />
                <FaceGuideOverlay showScanLine={false} showLandmarks variant="review" />
              </>
            )}
          </View>

          {!imageError && (
            <>
              <Text style={styles.instruction}>
                Make sure your face is clear, centered, and evenly lit.
              </Text>
              <PhotoQualityChecklist />

              <View style={styles.actions}>
                <Pressable
                  onPress={handleUsePhoto}
                  accessibilityRole="button"
                  accessibilityLabel="Use this photo"
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <LinearGradient
                    colors={[...gradients.scan]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryGradient}>
                    <Text style={styles.primaryText}>Use This Photo</Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={handleRetake}
                  accessibilityRole="button"
                  accessibilityLabel="Retake photo"
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                  <Text style={styles.secondaryText}>Retake</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
