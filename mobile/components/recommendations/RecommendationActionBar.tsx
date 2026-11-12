import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getThemeGradients } from '@/theme/colors';
import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';

interface RecommendationActionBarProps {
  isNextSteps: boolean;
  isCompleted: boolean;
  isInRoutine: boolean;
  hasReminder: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
  onTertiary: () => void;
}

export function RecommendationActionBar({
  isNextSteps,
  isCompleted,
  isInRoutine,
  hasReminder,
  onPrimary,
  onSecondary,
  onTertiary,
}: RecommendationActionBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, resolvedTheme } = useAppTheme();
  const gradients = getThemeGradients(resolvedTheme);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          ...(isDark
            ? { borderTopWidth: 1, borderTopColor: colors.border }
            : createShadowStyle(colors, isDark, 'card')),
        },
        primaryWrapper: {
          borderRadius: radius.lg,
          overflow: 'hidden',
          marginBottom: spacing.sm,
        },
        primaryButton: {
          minHeight: 50,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: spacing.sm + 4,
        },
        primaryText: {
          fontSize: typography.subtitle,
          fontWeight: '600',
          color: colors.textInverse,
        },
        secondaryRow: {
          flexDirection: 'row',
          gap: spacing.sm,
        },
        secondaryButton: {
          flex: 1,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        secondaryCompleted: {
          backgroundColor: colors.successSoft,
          borderColor: isDark ? colors.success : colors.successSoft,
        },
        secondaryText: {
          fontSize: typography.caption,
          fontWeight: '600',
          color: colors.textPrimary,
        },
        secondaryTextCompleted: {
          color: colors.success,
        },
        tertiaryButton: {
          flex: 1,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.lg,
          backgroundColor: colors.primarySoft,
        },
        tertiaryActive: {
          backgroundColor: colors.infoSoft,
        },
        tertiaryText: {
          fontSize: typography.caption,
          fontWeight: '600',
          color: colors.primary,
        },
        tertiaryTextActive: {
          color: colors.primary,
        },
        disabled: {
          opacity: 0.65,
        },
        pressed: {
          opacity: 0.82,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
      <Pressable
        onPress={onPrimary}
        disabled={!isNextSteps && isInRoutine}
        accessibilityRole="button"
        accessibilityLabel={isNextSteps ? 'Schedule next scan' : 'Add to routine'}
        style={({ pressed }) => [
          styles.primaryWrapper,
          !isNextSteps && isInRoutine && styles.disabled,
          pressed && !(!isNextSteps && isInRoutine) && styles.pressed,
        ]}>
        <LinearGradient
          colors={[...gradients.primaryButton]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.primaryButton}>
          <Text style={styles.primaryText}>
            {isNextSteps ? 'Schedule Next Scan' : isInRoutine ? 'Added to Routine' : 'Add to Routine'}
          </Text>
        </LinearGradient>
      </Pressable>

      <View style={styles.secondaryRow}>
        <Pressable
          onPress={onSecondary}
          disabled={isCompleted}
          accessibilityRole="button"
          accessibilityLabel="Mark as completed"
          style={({ pressed }) => [
            styles.secondaryButton,
            isCompleted && styles.secondaryCompleted,
            pressed && !isCompleted && styles.pressed,
          ]}>
          <Text style={[styles.secondaryText, isCompleted && styles.secondaryTextCompleted]}>
            {isCompleted ? 'Completed Today' : 'Mark as Completed'}
          </Text>
        </Pressable>

        <Pressable
          onPress={onTertiary}
          disabled={hasReminder}
          accessibilityRole="button"
          accessibilityLabel="Set reminder"
          style={({ pressed }) => [
            styles.tertiaryButton,
            hasReminder && styles.tertiaryActive,
            pressed && !hasReminder && styles.pressed,
          ]}>
          <Text style={[styles.tertiaryText, hasReminder && styles.tertiaryTextActive]}>
            {hasReminder ? 'Reminder Set' : 'Set Reminder'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
