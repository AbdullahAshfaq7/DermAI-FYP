import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';
import { LATEST_SCAN_DATE, MAIN_CONCERNS, OVERALL_SKIN_SCORE } from '@/data/recommendations';

export function RecommendationSummaryCard() {
  const { colors, isDark } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        block: {
          flex: 1,
          alignItems: 'center',
        },
        divider: {
          width: StyleSheet.hairlineWidth,
          height: 40,
          backgroundColor: colors.divider,
        },
        label: {
          fontSize: typography.tiny,
          color: colors.textMuted,
          marginBottom: spacing.xs,
          fontWeight: '500',
        },
        value: {
          fontSize: typography.subtitle,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        score: {
          color: colors.primary,
        },
        concerns: {
          marginTop: spacing.lg,
          paddingTop: spacing.lg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.divider,
        },
        chips: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginTop: spacing.xs,
        },
        concernChip: {
          backgroundColor: colors.primarySoft,
          paddingHorizontal: spacing.sm + 4,
          paddingVertical: spacing.xs + 2,
          borderRadius: radius.full,
        },
        concernText: {
          fontSize: typography.caption,
          color: colors.primary,
          fontWeight: '500',
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.block}>
          <Text style={styles.label}>Latest scan</Text>
          <Text style={styles.value}>{LATEST_SCAN_DATE}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.block}>
          <Text style={styles.label}>Skin score</Text>
          <Text style={[styles.value, styles.score]}>{OVERALL_SKIN_SCORE}</Text>
        </View>
      </View>
      <View style={styles.concerns}>
        <Text style={styles.label}>Main concerns</Text>
        <View style={styles.chips}>
          {MAIN_CONCERNS.map((concern) => (
            <View key={concern} style={styles.concernChip}>
              <Text style={styles.concernText}>{concern}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
