import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { radius, typography } from '@/theme/tokens';
import type { ThemeColors } from '@/theme/types';
import { RecommendationStatus } from '@/data/recommendations';

interface StatusBadgeProps {
  status: RecommendationStatus;
}

function getStatusPalette(
  status: RecommendationStatus,
  colors: ThemeColors,
): { backgroundColor: string; color: string } {
  switch (status) {
    case 'Not started':
      return { backgroundColor: colors.surfaceMuted, color: colors.textMuted };
    case 'In progress':
      return { backgroundColor: colors.infoSoft, color: colors.info };
    case 'Completed today':
      return { backgroundColor: colors.successSoft, color: colors.success };
    case 'Active':
      return { backgroundColor: colors.successSoft, color: colors.success };
    case 'Due soon':
      return { backgroundColor: colors.warningSoft, color: colors.warning };
    case 'Conditional':
      return { backgroundColor: colors.infoSoft, color: colors.info };
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors } = useAppTheme();
  const palette = getStatusPalette(status, colors);

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
      <Text style={[styles.text, { color: palette.color }]} numberOfLines={1}>
        {status}
      </Text>
    </View>
  );
}
