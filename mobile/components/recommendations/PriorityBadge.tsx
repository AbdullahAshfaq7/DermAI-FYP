import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { radius, typography } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/types';
import { RecommendationPriority } from '@/data/recommendations';

interface PriorityBadgeProps {
  priority: RecommendationPriority;
}

function getPriorityPalette(
  priority: RecommendationPriority,
  colors: ThemeColors,
): { backgroundColor: string; color: string } {
  switch (priority) {
    case 'High':
      return { backgroundColor: colors.dangerSoft, color: colors.danger };
    case 'Medium':
      return { backgroundColor: colors.warningSoft, color: colors.warning };
    case 'Low':
      return { backgroundColor: colors.surfaceMuted, color: colors.textMuted };
    case 'Conditional':
      return { backgroundColor: colors.infoSoft, color: colors.info };
  }
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const { colors } = useAppTheme();
  const palette = getPriorityPalette(priority, colors);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        badge: {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: radius.full,
          alignSelf: 'flex-start',
        },
        text: {
          fontSize: typography.tiny,
          fontWeight: '600',
        },
      }),
    [],
  );

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.text, { color: palette.color }]}>{priority}</Text>
    </View>
  );
}
