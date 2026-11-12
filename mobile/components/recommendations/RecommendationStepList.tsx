import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';

interface RecommendationStepListProps {
  steps: string[];
}

export function RecommendationStepList({ steps }: RecommendationStepListProps) {
  const { colors, isDark } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: spacing.sm,
        },
        stepCard: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm + 4,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        stepNumber: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        stepNumberText: {
          fontSize: typography.caption,
          fontWeight: '700',
          color: colors.primary,
        },
        stepText: {
          flex: 1,
          fontSize: typography.body,
          color: colors.textSecondary,
          lineHeight: 20,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={`step-${index}`} style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}
