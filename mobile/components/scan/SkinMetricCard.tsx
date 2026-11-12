import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { SkinMetric, getLevelColor } from '@/data/skinScanResult';
import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle } from '@/theme/tokens';

interface SkinMetricCardProps {
  metric: SkinMetric;
}

export function SkinMetricCard({ metric }: SkinMetricCardProps) {
  const { colors, isDark } = useAppTheme();
  const levelColor = getLevelColor(metric.level);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flex: 1,
          minWidth: '46%',
          backgroundColor: colors.surface,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'card')),
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING.sm,
        },
        iconCircle: {
          width: 36,
          height: 36,
          borderRadius: RADIUS.full,
          alignItems: 'center',
          justifyContent: 'center',
        },
        levelBadge: {
          paddingHorizontal: SPACING.sm,
          paddingVertical: 3,
          borderRadius: RADIUS.full,
        },
        levelText: {
          fontSize: FONT.tiny,
          fontWeight: '700',
        },
        label: {
          fontSize: FONT.caption,
          color: colors.textSecondary,
          marginBottom: 2,
        },
        score: {
          fontSize: 22,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: SPACING.sm,
        },
        progressTrack: {
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.divider,
          overflow: 'hidden',
          marginBottom: SPACING.sm,
        },
        progressFill: {
          height: '100%',
          borderRadius: 2,
        },
        description: {
          fontSize: FONT.tiny + 1,
          color: colors.textMuted,
          lineHeight: 16,
        },
      }),
    [colors, isDark],
  );

  return (
    <View
      style={styles.card}
      accessibilityLabel={`${metric.label}, score ${metric.score}, ${metric.level}`}>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: metric.backgroundColor }]}>
          <Ionicons name={metric.icon} size={18} color={metric.accentColor} />
        </View>
        <View style={[styles.levelBadge, { backgroundColor: `${levelColor}18` }]}>
          <Text style={[styles.levelText, { color: levelColor }]}>{metric.level}</Text>
        </View>
      </View>

      <Text style={styles.label}>{metric.label}</Text>
      <Text style={styles.score}>{metric.score}</Text>

      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: metric.score }}>
        <View
          style={[
            styles.progressFill,
            { width: `${metric.score}%`, backgroundColor: metric.accentColor },
          ]}
        />
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {metric.description}
      </Text>
    </View>
  );
}
