import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { SKIN_METRICS, SKIN_SCORE } from '@/data/homeMockData';
import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';

const SCORE_SIZE = 72;

type SkinOverviewStyles = ReturnType<typeof StyleSheet.create<{
  scoreContainer: object;
  scoreRingOuter: object;
  scoreRingProgress: object;
  scoreRingInner: object;
  scoreValue: object;
  scoreLabel: object;
  metricCard: object;
  metricHeader: object;
  metricIcon: object;
  metricInfo: object;
  metricTitle: object;
  metricValues: object;
  metricPercentage: object;
  metricSeverity: object;
  progressTrack: object;
  progressFill: object;
}>>;

function CircularScore({ score, styles }: { score: number; styles: SkinOverviewStyles }) {
  const rotation = `${(score / 100) * 360 - 90}deg`;

  return (
    <View style={styles.scoreContainer} accessibilityLabel={`Overall skin score ${score}`}>
      <View style={styles.scoreRingOuter}>
        <View style={[styles.scoreRingProgress, { transform: [{ rotate: rotation }] }]} />
        <View style={styles.scoreRingInner}>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
      </View>
    </View>
  );
}

function MetricCard({
  metric,
  styles,
}: {
  metric: (typeof SKIN_METRICS)[number];
  styles: SkinOverviewStyles;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: metric.trackColor }]}>
          <Ionicons name={metric.icon} size={14} color={metric.color} />
        </View>
        <View style={styles.metricInfo}>
          <Text style={styles.metricTitle} numberOfLines={1}>
            {metric.title}
          </Text>
          <View style={styles.metricValues}>
            <Text style={[styles.metricPercentage, { color: metric.color }]}>
              {metric.percentage}%
            </Text>
            <Text style={styles.metricSeverity} numberOfLines={1}>
              {metric.severity}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: metric.trackColor }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${metric.percentage}%`, backgroundColor: metric.color },
          ]}
        />
      </View>
    </View>
  );
}

export function SkinOverview() {
  const { width } = useWindowDimensions();
  const columns = width >= 400 ? 3 : 2;
  const { colors, isDark } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginTop: spacing.lg,
          marginBottom: spacing.md,
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        titleBlock: {
          flex: 1,
          marginRight: spacing.sm,
        },
        sectionTitle: {
          fontSize: typography.title,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        },
        latestBadge: {
          alignSelf: 'flex-start',
          backgroundColor: colors.primarySoft,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
        },
        latestBadgeText: {
          fontSize: typography.tiny,
          color: colors.primary,
          fontWeight: '600',
        },
        scoreContainer: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        scoreRingOuter: {
          width: SCORE_SIZE,
          height: SCORE_SIZE,
          borderRadius: SCORE_SIZE / 2,
          borderWidth: 4,
          borderColor: colors.divider,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        scoreRingProgress: {
          position: 'absolute',
          width: SCORE_SIZE,
          height: SCORE_SIZE,
          borderRadius: SCORE_SIZE / 2,
          borderWidth: 4,
          borderColor: colors.primary,
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
        },
        scoreRingInner: {
          width: SCORE_SIZE - 16,
          height: SCORE_SIZE - 16,
          borderRadius: (SCORE_SIZE - 16) / 2,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        scoreValue: {
          fontSize: typography.title,
          fontWeight: '700',
          color: colors.primary,
          lineHeight: 22,
        },
        scoreLabel: {
          fontSize: typography.tiny,
          color: colors.textMuted,
        },
        metricsGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          justifyContent: 'space-between',
        },
        metricWrapper: {
          flexGrow: 1,
          minWidth: '46%',
        },
        metricCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.sm + 4,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        metricHeader: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        metricIcon: {
          width: 28,
          height: 28,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        metricInfo: {
          flex: 1,
        },
        metricTitle: {
          fontSize: typography.caption,
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: 2,
        },
        metricValues: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        },
        metricPercentage: {
          fontSize: typography.caption,
          fontWeight: '700',
        },
        metricSeverity: {
          fontSize: typography.tiny,
          color: colors.textMuted,
          flexShrink: 1,
        },
        progressTrack: {
          height: 4,
          borderRadius: radius.full,
          overflow: 'hidden',
        },
        progressFill: {
          height: '100%',
          borderRadius: radius.full,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.sectionTitle}>Your Skin Overview</Text>
          <View style={styles.latestBadge}>
            <Text style={styles.latestBadgeText}>Latest scan</Text>
          </View>
        </View>
        <CircularScore score={SKIN_SCORE} styles={styles} />
      </View>

      <View style={styles.metricsGrid}>
        {SKIN_METRICS.map((metric) => (
          <View key={metric.id} style={[styles.metricWrapper, { width: `${100 / columns - 2}%` }]}>
            <MetricCard metric={metric} styles={styles} />
          </View>
        ))}
      </View>
    </View>
  );
}
