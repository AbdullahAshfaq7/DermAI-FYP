import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle, radius, spacing, typography } from '@/theme/tokens';
import { getPreviewRecommendations } from '@/data/recommendations';

import { RecommendationPreviewRow } from './RecommendationPreviewRow';

export function RecommendationsPreviewCard() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const previewItems = getPreviewRecommendations();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          padding: spacing.lg,
          marginTop: spacing.lg,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'card')),
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xs,
        },
        title: {
          fontSize: typography.subtitle,
          fontWeight: '700',
          color: colors.textPrimary,
          flex: 1,
          marginRight: spacing.sm,
        },
        viewAllButton: {
          minHeight: 44,
          minWidth: 44,
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingHorizontal: spacing.xs,
        },
        viewAllText: {
          fontSize: typography.caption,
          color: colors.primary,
          fontWeight: '600',
        },
        list: {
          marginTop: spacing.xs,
        },
        pressed: {
          opacity: 0.75,
        },
      }),
    [colors, isDark],
  );

  const handleViewAll = () => {
    router.push('/recommendations/list');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Personalized Recommendations</Text>
        <Pressable
          onPress={handleViewAll}
          accessibilityRole="button"
          accessibilityLabel="View all recommendations"
          hitSlop={8}
          style={({ pressed }) => [styles.viewAllButton, pressed && styles.pressed]}>
          <Text style={styles.viewAllText}>View all</Text>
        </Pressable>
      </View>

      <View style={styles.list}>
        {previewItems.map((item, index) => (
          <RecommendationPreviewRow
            key={item.id}
            recommendation={item}
            showDivider={index < previewItems.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
