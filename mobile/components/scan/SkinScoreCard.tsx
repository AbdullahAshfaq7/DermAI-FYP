import { Image } from 'expo-image';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { formatScanDate } from '@/data/skinScanResult';
import { useAppTheme } from '@/theme/useAppTheme';
import { createShadowStyle } from '@/theme/tokens';

interface SkinScoreCardProps {
  photoUri: string;
  overallScore: number;
  skinType: string;
  scannedAt: string;
}

export function SkinScoreCard({
  photoUri,
  overallScore,
  skinType,
  scannedAt,
}: SkinScoreCardProps) {
  const { colors, isDark } = useAppTheme();

  const scoreColor =
    overallScore >= 80 ? colors.success : overallScore >= 65 ? colors.primary : colors.warning;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: RADIUS.xl,
          padding: SPACING.md,
          ...(isDark
            ? { borderWidth: 1, borderColor: colors.border }
            : createShadowStyle(colors, isDark, 'card')),
        },
        topRow: {
          flexDirection: 'row',
          gap: SPACING.md,
          alignItems: 'center',
        },
        thumbnailWrap: {
          width: 80,
          height: 80,
          borderRadius: RADIUS.lg,
          overflow: 'hidden',
          backgroundColor: colors.divider,
        },
        thumbnail: {
          width: '100%',
          height: '100%',
        },
        scoreSection: {
          flex: 1,
        },
        latestLabel: {
          fontSize: FONT.tiny,
          fontWeight: '600',
          color: colors.secondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 4,
        },
        scoreLabel: {
          fontSize: FONT.caption,
          color: colors.textSecondary,
          marginBottom: SPACING.xs,
        },
        scoreRow: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        scoreCircle: {
          width: 64,
          height: 64,
          borderRadius: 32,
          borderWidth: 3,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primarySoft,
        },
        scoreValue: {
          fontSize: 24,
          fontWeight: '700',
        },
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.divider,
          marginVertical: SPACING.md,
        },
        metaRow: {
          flexDirection: 'row',
          gap: SPACING.lg,
        },
        metaBlock: {
          flex: 1,
        },
        metaLabel: {
          fontSize: FONT.tiny,
          color: colors.textMuted,
          marginBottom: 2,
        },
        metaValue: {
          fontSize: FONT.body,
          fontWeight: '600',
          color: colors.textPrimary,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.thumbnailWrap}>
          <Image source={{ uri: photoUri }} style={styles.thumbnail} contentFit="cover" />
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.latestLabel}>Latest scan</Text>
          <Text style={styles.scoreLabel}>Overall Skin Score</Text>
          <View style={styles.scoreRow}>
            <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{overallScore}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.metaRow}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Skin type</Text>
          <Text style={styles.metaValue}>{skinType}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Scan date</Text>
          <Text style={styles.metaValue}>{formatScanDate(scannedAt)}</Text>
        </View>
      </View>
    </View>
  );
}
