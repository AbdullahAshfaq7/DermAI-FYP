import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecommendationActionBar } from '@/components/recommendations/RecommendationActionBar';
import { RecommendationDetailHeader } from '@/components/recommendations/RecommendationDetailHeader';
import { RecommendationStepList } from '@/components/recommendations/RecommendationStepList';
import { StatusBadge } from '@/components/recommendations/StatusBadge';
import { useRecommendationsState } from '@/context/RecommendationsContext';
import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';
import { getRecommendationById } from '@/data/recommendations';

export default function RecommendationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const {
    getStatus,
    isInRoutine,
    hasReminder,
    addToRoutine,
    markCompleted,
    setReminder,
    scheduleNextScan,
    feedback,
    clearFeedback,
  } = useRecommendationsState();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
        },
        safeArea: {
          flex: 1,
        },
        feedbackBanner: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginHorizontal: spacing.lg,
          marginBottom: spacing.sm,
          backgroundColor: colors.successSoft,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm + 2,
          borderWidth: 1,
          borderColor: isDark ? colors.success : colors.successSoft,
        },
        feedbackText: {
          fontSize: typography.caption,
          color: colors.success,
          fontWeight: '600',
        },
        scrollContent: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg,
        },
        statusCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          marginBottom: spacing.lg,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        sectionLabel: {
          fontSize: typography.caption,
          color: colors.textMuted,
          fontWeight: '600',
          marginBottom: spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        statusGrid: {
          gap: spacing.sm + 4,
        },
        statusItem: {
          gap: spacing.xs,
        },
        statusKey: {
          fontSize: typography.tiny,
          color: colors.textMuted,
          fontWeight: '500',
        },
        statusValue: {
          fontSize: typography.body,
          color: colors.textPrimary,
          fontWeight: '500',
        },
        section: {
          marginBottom: spacing.lg,
        },
        sectionTitle: {
          fontSize: typography.subtitle,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: spacing.sm + 4,
        },
        infoCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        bodyText: {
          fontSize: typography.body,
          color: colors.textSecondary,
          lineHeight: 21,
        },
        chips: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        chip: {
          backgroundColor: colors.primarySoft,
          paddingHorizontal: spacing.sm + 4,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
        },
        chipText: {
          fontSize: typography.caption,
          color: colors.primary,
          fontWeight: '500',
        },
        warningCard: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          backgroundColor: colors.warningSoft,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: isDark ? colors.warning : colors.warningSoft,
        },
        warningContent: {
          flex: 1,
          gap: spacing.xs,
        },
        warningText: {
          fontSize: typography.body,
          color: colors.warning,
          lineHeight: 20,
        },
        safetyCard: {
          backgroundColor: colors.infoSoft,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        safetyText: {
          fontSize: typography.body,
          color: colors.textSecondary,
          lineHeight: 20,
        },
        disclaimer: {
          fontSize: typography.caption,
          color: colors.textMuted,
          fontStyle: 'italic',
        },
        actionSpacer: {
          height: 120,
        },
        notFound: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
        },
        notFoundTitle: {
          fontSize: typography.title,
          fontWeight: '700',
          color: colors.textPrimary,
          marginTop: spacing.sm,
        },
        notFoundBody: {
          fontSize: typography.body,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
        },
        notFoundLink: {
          fontSize: typography.subtitle,
          color: colors.primary,
          fontWeight: '600',
          marginTop: spacing.lg,
          minHeight: 44,
          textAlignVertical: 'center',
        },
      }),
    [colors, isDark],
  );

  useEffect(() => {
    if (!feedback) {
      return;
    }
    const timer = setTimeout(clearFeedback, 2500);
    return () => clearTimeout(timer);
  }, [feedback, clearFeedback]);

  if (id === 'index' || id === 'list') {
    return <Redirect href="/recommendations/list" />;
  }

  const recommendation = getRecommendationById(id ?? '');

  if (!recommendation) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.notFound} edges={['top', 'bottom']}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.iconMuted} />
          <Text style={styles.notFoundTitle}>Recommendation not found</Text>
          <Text style={styles.notFoundBody}>
            This recommendation may have been removed or the link is invalid.
          </Text>
          <Text style={styles.notFoundLink} onPress={() => router.back()}>
            Go back
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const status = getStatus(recommendation.id, recommendation.status);
  const inRoutine = isInRoutine(recommendation.id);
  const reminderSet = hasReminder(recommendation.id);
  const isCompleted = status === 'Completed today';
  const isNextSteps = recommendation.id === 'next-steps';

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {feedback && (
          <View style={styles.feedbackBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        <RecommendationDetailHeader recommendation={recommendation} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.statusCard}>
            <Text style={styles.sectionLabel}>Status summary</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusKey}>Status</Text>
                <StatusBadge status={status} />
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusKey}>Timing</Text>
                <Text style={styles.statusValue}>{recommendation.timing}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusKey}>Frequency</Text>
                <Text style={styles.statusValue}>{recommendation.frequency}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusKey}>Duration</Text>
                <Text style={styles.statusValue}>{recommendation.duration}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why this is recommended</Text>
            <View style={styles.infoCard}>
              <Text style={styles.bodyText}>{recommendation.reason}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to follow it</Text>
            <RecommendationStepList steps={recommendation.steps} />
          </View>

          {recommendation.ingredients && recommendation.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suggested ingredients</Text>
              <View style={styles.chips}>
                {recommendation.ingredients.map((ingredient) => (
                  <View key={ingredient} style={styles.chip}>
                    <Text style={styles.chipText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {recommendation.avoid && recommendation.avoid.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Things to avoid</Text>
              <View style={styles.warningCard}>
                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                <View style={styles.warningContent}>
                  {recommendation.avoid.map((item) => (
                    <Text key={item} style={styles.warningText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expected results</Text>
            <View style={styles.infoCard}>
              <Text style={styles.bodyText}>{recommendation.expectedResults}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety note</Text>
            <View style={styles.safetyCard}>
              <Text style={styles.safetyText}>
                {recommendation.safetyNote ??
                  'Stop using the product if you experience persistent burning, swelling, or worsening irritation.'}
              </Text>
              <Text style={styles.disclaimer}>
                For informational use only — not a medical diagnosis.
              </Text>
            </View>
          </View>

          <View style={styles.actionSpacer} />
        </ScrollView>

        <RecommendationActionBar
          isNextSteps={isNextSteps}
          isCompleted={isCompleted}
          isInRoutine={inRoutine}
          hasReminder={reminderSet}
          onPrimary={() =>
            isNextSteps ? scheduleNextScan(recommendation.id) : addToRoutine(recommendation.id)
          }
          onSecondary={() => markCompleted(recommendation.id)}
          onTertiary={() => setReminder(recommendation.id)}
        />
      </SafeAreaView>
    </View>
  );
}
