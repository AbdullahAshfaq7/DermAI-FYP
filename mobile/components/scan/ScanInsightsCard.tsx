import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle } from '@/theme/tokens';

interface ScanInsightsCardProps {
  insights: string[];
}

export function ScanInsightsCard({ insights }: ScanInsightsCardProps) {
  const { colors, isDark } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: SPACING.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: SPACING.sm,
          backgroundColor: colors.surface,
          borderRadius: RADIUS.md,
          padding: SPACING.md,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'soft')),
        },
        iconWrap: {
          marginTop: 2,
        },
        text: {
          flex: 1,
          fontSize: FONT.body,
          color: colors.textPrimary,
          lineHeight: 20,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.container}>
      {insights.map((insight) => (
        <View key={insight} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
          <Text style={styles.text}>{insight}</Text>
        </View>
      ))}
    </View>
  );
}
