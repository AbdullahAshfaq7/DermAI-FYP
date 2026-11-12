import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing, typography } from '@/theme/tokens';
import { Recommendation } from '@/data/recommendations';

interface RecommendationPreviewRowProps {
  recommendation: Recommendation;
  showDivider?: boolean;
}

export function RecommendationPreviewRow({
  recommendation,
  showDivider = true,
}: RecommendationPreviewRowProps) {
  const router = useRouter();
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm + 4,
          minHeight: 56,
          paddingVertical: spacing.sm + 2,
        },
        pressed: {
          opacity: 0.72,
        },
        iconCircle: {
          width: 42,
          height: 42,
          borderRadius: radius.full,
          alignItems: 'center',
          justifyContent: 'center',
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
        subtitle: {
          fontSize: typography.caption,
          color: colors.textSecondary,
          lineHeight: 17,
        },
        separator: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.divider,
          marginLeft: 54,
        },
      }),
    [colors],
  );

  const handlePress = () => {
    router.push({
      pathname: '/recommendations/detail/[id]',
      params: { id: recommendation.id },
    });
  };

  return (
    <View>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${recommendation.title}. ${recommendation.summary}`}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View
          style={[styles.iconCircle, { backgroundColor: recommendation.iconBackgroundColor }]}>
          <Ionicons name={recommendation.icon} size={18} color={recommendation.accentColor} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {recommendation.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {recommendation.summary}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} />
      </Pressable>
      {showDivider && <View style={styles.separator} />}
    </View>
  );
}
