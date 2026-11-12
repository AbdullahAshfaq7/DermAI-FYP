import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT, SPACING } from '@/constants/homeTheme';
import { getScanColors, SCAN_CAMERA_OVERLAY } from '@/constants/scanTheme';
import { useAppTheme } from '@/theme/useAppTheme';

import { ScanProgressStages } from './ScanProgressStages';

interface AnalysisProgressProps {
  progress: number;
  stageLabel: string;
}

export function AnalysisProgress({ progress, stageLabel }: AnalysisProgressProps) {
  const { colors } = useAppTheme();
  const scanColors = useMemo(() => getScanColors(colors), [colors]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: 'center',
          gap: SPACING.md,
          width: '100%',
        },
        percentRow: {
          flexDirection: 'row',
          alignItems: 'flex-end',
        },
        percentValue: {
          fontSize: 48,
          fontWeight: '700',
          color: SCAN_CAMERA_OVERLAY.textPrimary,
          lineHeight: 52,
        },
        percentSymbol: {
          fontSize: FONT.title,
          fontWeight: '600',
          color: scanColors.textSecondary,
          marginBottom: 8,
          marginLeft: 4,
        },
        progressTrack: {
          width: '100%',
          height: 6,
          borderRadius: 3,
          backgroundColor: scanColors.progressTrack,
          overflow: 'hidden',
        },
        progressFill: {
          height: '100%',
          borderRadius: 3,
          backgroundColor: scanColors.progressFill,
        },
        stageLabel: {
          fontSize: FONT.subtitle,
          fontWeight: '600',
          color: SCAN_CAMERA_OVERLAY.textPrimary,
          textAlign: 'center',
        },
      }),
    [scanColors],
  );

  return (
    <View style={styles.container}>
      <View style={styles.percentRow}>
        <Text style={styles.percentValue}>{Math.round(progress)}</Text>
        <Text style={styles.percentSymbol}>%</Text>
      </View>

      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress) }}>
        <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
      </View>

      <Text style={styles.stageLabel}>{stageLabel}</Text>
      <ScanProgressStages currentProgress={progress} />
    </View>
  );
}
