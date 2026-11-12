import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing, typography } from '@/theme/tokens';
import { FILTER_OPTIONS, FilterTag } from '@/data/recommendations';

interface RecommendationFilterChipsProps {
  activeFilter: 'All' | FilterTag;
  onFilterChange: (filter: 'All' | FilterTag) => void;
}

export function RecommendationFilterChips({
  activeFilter,
  onFilterChange,
}: RecommendationFilterChipsProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: spacing.sm,
          paddingVertical: spacing.sm,
        },
        chip: {
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.divider,
          minHeight: 36,
          justifyContent: 'center',
        },
        chipActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        chipText: {
          fontSize: typography.caption,
          color: colors.textSecondary,
          fontWeight: '500',
        },
        chipTextActive: {
          color: colors.textInverse,
          fontWeight: '600',
        },
        pressed: {
          opacity: 0.8,
        },
      }),
    [colors],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {FILTER_OPTIONS.map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <Pressable
            key={filter}
            onPress={() => onFilterChange(filter)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${filter}`}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{filter}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
