import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomNavPadding } from '@/components/navigation/useBottomNavPadding';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { SKIN_METRICS, SKIN_SCORE } from '@/data/homeMockData';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';
import { useAppTheme } from '@/theme/useAppTheme';

const skinProfileAnswers = [
  { label: 'Skin Type', value: 'Combination' },
  { label: 'Sensitivity', value: 'Somewhat sensitive' },
  { label: 'Current routine', value: 'Basic routine' },
];

const metricInsights: Record<string, string> = {
  acne: 'Moderate breakouts detected in the T-zone. A consistent cleanse can help.',
  dryness: 'Skin is slightly dehydrated. Layer lightweight hydrators to restore balance.',
  redness: 'Inflammation is noticeable. Calming ingredients can help soothe skin.',
  'dark-spots': 'Uneven pigmentation appears. Daily SPF helps prevent further discoloration.',
  sensitivity: 'Skin reacts easily to stress. Gentle formulas are best for daily use.',
  pores: 'Pores look more visible around the nose. A refining toner may help.',
};

function CircularScore({ score, styles }: { score: number; styles: ReturnType<typeof createStyles> }) {
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

function MetricCard({ metric, styles }: { metric: (typeof SKIN_METRICS)[number]; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: metric.trackColor }]}> 
          <Ionicons name={metric.icon} size={16} color={metric.color} />
        </View>
        <View style={styles.metricInfo}>
          <Text style={styles.metricTitle} numberOfLines={1}>
            {metric.title}
          </Text>
          <View style={styles.metricValues}>
            <Text style={[styles.metricPercentage, { color: metric.color }]}>{metric.percentage}%</Text>
            <Text style={styles.metricSeverity} numberOfLines={1}>
              {metric.severity}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: metric.trackColor }]}> 
        <View style={[styles.progressFill, { width: `${metric.percentage}%`, backgroundColor: metric.color }]} />
      </View>
      <Text style={styles.metricInsight} numberOfLines={1}>
        {metricInsights[metric.id]}
      </Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean, width: number) {
  const columns = width >= 420 ? 3 : 2;

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    safeArea: {
      flex: 1,
    },
    container: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      ...(isDark ? { borderWidth: 1, borderColor: colors.border } : createShadowStyle(colors, isDark, 'soft')),
    },
    screenTitle: {
      fontSize: typography.title,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    summaryCard: {
      padding: spacing.lg,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    latestBadge: {
      backgroundColor: colors.primarySoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    latestBadgeText: {
      fontSize: typography.tiny,
      fontWeight: '700',
      color: colors.primary,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    scoreContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scoreRingOuter: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 4,
      borderColor: colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    scoreRingProgress: {
      position: 'absolute',
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 4,
      borderColor: colors.primary,
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    scoreRingInner: {
      width: 84 - 16,
      height: 84 - 16,
      borderRadius: 34,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...(isDark ? { borderWidth: 1, borderColor: colors.border } : createShadowStyle(colors, isDark, 'soft')),
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
    summaryText: {
      flex: 1,
      fontSize: typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    sectionTitle: {
      fontSize: typography.subtitle,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipLabel: {
      fontSize: typography.caption,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    insightSection: {
      gap: spacing.sm,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    metricWrapper: {
      width: columns === 3 ? '31%' : '48%',
    },
    metricCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.sm + 4,
      ...(isDark ? { borderWidth: 1, borderColor: colors.border } : createShadowStyle(colors, isDark, 'soft')),
    },
    metricHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    metricIcon: {
      width: 30,
      height: 30,
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
      marginBottom: spacing.xs,
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
      color: colors.textSecondary,
      flexShrink: 1,
    },
    progressTrack: {
      height: 6,
      borderRadius: radius.full,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
    },
    metricInsight: {
      fontSize: typography.tiny,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    recommendationCard: {
      padding: spacing.lg,
    },
    recommendationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    recommendationTitle: {
      fontSize: typography.body,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    recommendationCopy: {
      fontSize: typography.caption,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
  });
}

export default function SkinProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const bottomPadding = useBottomNavPadding();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors, isDark, width), [colors, isDark, width]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: bottomPadding + spacing.xl }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
              <Text style={styles.screenTitle}>Skin Profile</Text>
            </Pressable>
          </View>

          <AppCard style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <AppText variant="subtitle" weight="700">
                Latest scan
              </AppText>
              <View style={styles.latestBadge}>
                <AppText variant="tiny" weight="700" color="primary">
                  Latest scan
                </AppText>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <CircularScore score={SKIN_SCORE} styles={styles} />
              <Text style={styles.summaryText}>
                Your skin is in good condition with a few areas to improve.
              </Text>
            </View>
          </AppCard>

          <View>
            <Text style={styles.sectionTitle}>About your skin</Text>
            <AppCard style={styles.summaryCard}>
              <View style={styles.chipRow}>
                {skinProfileAnswers.map((item) => (
                  <View key={item.label} style={styles.chip}>
                    <Text style={styles.chipLabel}>{`${item.label}: ${item.value}`}</Text>
                  </View>
                ))}
              </View>
            </AppCard>
          </View>

          <View style={styles.insightSection}>
            <Text style={styles.sectionTitle}>Skin insights</Text>
            <View style={styles.metricsGrid}>
              {SKIN_METRICS.map((metric) => (
                <View key={metric.id} style={styles.metricWrapper}>
                  <MetricCard metric={metric} styles={styles} />
                </View>
              ))}
            </View>
          </View>

          <AppCard style={styles.recommendationCard}>
            <View style={styles.recommendationRow}>
              <Text style={styles.recommendationTitle}>Want a personalized routine?</Text>
            </View>
            <Text style={styles.recommendationCopy}>
              Discover routine guidance matched to your latest skin profile.
            </Text>
            <AppButton label="View My Routine" onPress={() => router.push('/(tabs)/routine')} />
          </AppCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
