import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { spacing, typography } from '@/theme/tokens';
import { RecommendationCategory } from '@/data/recommendations';

interface RecommendationSectionHeaderProps {
  title: RecommendationCategory;
  count: number;
}

export function RecommendationSectionHeader({ title, count }: RecommendationSectionHeaderProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: spacing.lg,
          paddingBottom: spacing.sm,
        },
        title: {
          fontSize: typography.subtitle,
          fontWeight: '700',
          color: colors.textPrimary,
        },
        count: {
          fontSize: typography.caption,
          color: colors.textMuted,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}
