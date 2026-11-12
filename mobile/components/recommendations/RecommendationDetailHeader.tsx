import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing, typography } from '@/theme/tokens';
import { Recommendation } from '@/data/recommendations';

import { PriorityBadge } from './PriorityBadge';

interface RecommendationDetailHeaderProps {
  recommendation: Recommendation;
}

export function RecommendationDetailHeader({ recommendation }: RecommendationDetailHeaderProps) {
  const router = useRouter();
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.lg,
          backgroundColor: colors.background,
        },
        backButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: -spacing.sm,
          marginBottom: spacing.sm,
        },
        content: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.lg,
        },
        iconCircle: {
          width: 56,
          height: 56,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        textBlock: {
          flex: 1,
          gap: spacing.xs,
        },
        category: {
          fontSize: typography.caption,
          color: colors.textMuted,
          fontWeight: '500',
        },
        title: {
          fontSize: typography.title + 2,
          fontWeight: '700',
          color: colors.textPrimary,
          lineHeight: 26,
        },
        pressed: {
          opacity: 0.75,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.content}>
        <View
          style={[styles.iconCircle, { backgroundColor: recommendation.iconBackgroundColor }]}>
          <Ionicons name={recommendation.icon} size={24} color={recommendation.accentColor} />
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.category}>{recommendation.category}</Text>
          <Text style={styles.title}>{recommendation.title}</Text>
          <PriorityBadge priority={recommendation.priority} />
        </View>
      </View>
    </View>
  );
}
