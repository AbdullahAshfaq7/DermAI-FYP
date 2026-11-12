import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useRecommendationsState } from '@/context/RecommendationsContext';
import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';
import { Recommendation } from '@/data/recommendations';

import { PriorityBadge } from './PriorityBadge';
import { StatusBadge } from './StatusBadge';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { getStatus, isInRoutine } = useRecommendationsState();
  const status = getStatus(recommendation.id, recommendation.status);
  const inRoutine = isInRoutine(recommendation.id);
  const isCompleted = status === 'Completed today';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm + 4,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          marginBottom: spacing.sm,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        pressed: {
          opacity: 0.78,
        },
        iconCircle: {
          width: 44,
          height: 44,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        completedDot: {
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: colors.success,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.surface,
        },
        content: {
          flex: 1,
          paddingRight: spacing.xs,
        },
        title: {
          fontSize: typography.body,
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: 2,
        },
        summary: {
          fontSize: typography.caption,
          color: colors.textSecondary,
          lineHeight: 17,
          marginBottom: spacing.xs,
        },
        metaRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: spacing.sm,
        },
        metaText: {
          fontSize: typography.tiny,
          color: colors.textMuted,
        },
        metaDot: {
          marginHorizontal: 4,
          color: colors.textMuted,
          fontSize: typography.tiny,
        },
        badges: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.xs,
        },
        routineBadge: {
          backgroundColor: colors.primarySoft,
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: radius.full,
        },
        routineText: {
          fontSize: typography.tiny,
          color: colors.primary,
          fontWeight: '600',
        },
      }),
    [colors, isDark],
  );

  const handlePress = () => {
    router.push({
      pathname: '/recommendations/detail/[id]',
      params: { id: recommendation.id },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${recommendation.title}. ${recommendation.summary}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View
        style={[styles.iconCircle, { backgroundColor: recommendation.iconBackgroundColor }]}>
        <Ionicons name={recommendation.icon} size={20} color={recommendation.accentColor} />
        {isCompleted && (
          <View style={styles.completedDot}>
            <Ionicons name="checkmark" size={10} color={colors.textInverse} />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {recommendation.title}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {recommendation.summary}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{recommendation.timing}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{recommendation.frequency}</Text>
        </View>
        <View style={styles.badges}>
          <PriorityBadge priority={recommendation.priority} />
          <StatusBadge status={status} />
          {inRoutine && (
            <View style={styles.routineBadge}>
              <Text style={styles.routineText}>In routine</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
    </Pressable>
  );
}
