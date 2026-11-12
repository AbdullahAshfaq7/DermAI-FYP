import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { getThemeGradients } from '@/theme/colors';
import { useAppTheme } from '@/theme/useAppTheme';

interface ScanResultActionsProps {
  onSave: () => void;
  onScanAgain: () => void;
  onGoHome: () => void;
  isSaved: boolean;
  saveFeedback: string | null;
}

export function ScanResultActions({
  onSave,
  onScanAgain,
  onGoHome,
  isSaved,
  saveFeedback,
}: ScanResultActionsProps) {
  const { colors, resolvedTheme } = useAppTheme();
  const gradients = getThemeGradients(resolvedTheme);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: SPACING.sm,
        },
        feedbackBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
          backgroundColor: colors.primarySoft,
          borderRadius: RADIUS.md,
          padding: SPACING.sm + 4,
          marginBottom: SPACING.xs,
        },
        feedbackText: {
          flex: 1,
          fontSize: FONT.caption + 1,
          color: colors.textPrimary,
          fontWeight: '500',
        },
        primaryButton: {
          borderRadius: RADIUS.lg,
          overflow: 'hidden',
        },
        primaryGradient: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          paddingVertical: SPACING.md,
        },
        primaryDisabled: {
          opacity: 0.65,
        },
        primaryText: {
          fontSize: FONT.subtitle,
          fontWeight: '600',
          color: colors.textInverse,
        },
        secondaryButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
          paddingVertical: SPACING.md,
          borderRadius: RADIUS.lg,
          borderWidth: 1.5,
          borderColor: colors.primary,
          backgroundColor: colors.surface,
        },
        secondaryText: {
          fontSize: FONT.subtitle,
          fontWeight: '600',
          color: colors.primary,
        },
        tertiaryButton: {
          alignItems: 'center',
          paddingVertical: SPACING.sm,
        },
        tertiaryText: {
          fontSize: FONT.body,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        pressed: {
          opacity: 0.82,
          transform: [{ scale: 0.98 }],
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      {saveFeedback && (
        <View style={styles.feedbackBanner}>
          <Ionicons
            name={isSaved ? 'checkmark-circle' : 'information-circle'}
            size={18}
            color={isSaved ? colors.success : colors.info}
          />
          <Text style={styles.feedbackText}>{saveFeedback}</Text>
        </View>
      )}

      <Pressable
        onPress={onSave}
        disabled={isSaved}
        accessibilityRole="button"
        accessibilityLabel="Save scan result"
        accessibilityState={{ disabled: isSaved }}
        style={({ pressed }) => [styles.primaryButton, pressed && !isSaved && styles.pressed]}>
        <LinearGradient
          colors={[...gradients.scan]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.primaryGradient, isSaved && styles.primaryDisabled]}>
          <Ionicons name="bookmark-outline" size={20} color={colors.textInverse} />
          <Text style={styles.primaryText}>{isSaved ? 'Scan Saved' : 'Save Scan Result'}</Text>
        </LinearGradient>
      </Pressable>

      <Pressable
        onPress={onScanAgain}
        accessibilityRole="button"
        accessibilityLabel="Scan again"
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
        <Ionicons name="scan-outline" size={20} color={colors.primary} />
        <Text style={styles.secondaryText}>Scan Again</Text>
      </Pressable>

      <Pressable
        onPress={onGoHome}
        accessibilityRole="button"
        accessibilityLabel="Go to home"
        style={({ pressed }) => [styles.tertiaryButton, pressed && styles.pressed]}>
        <Text style={styles.tertiaryText}>Go to Home</Text>
      </Pressable>
    </View>
  );
}
