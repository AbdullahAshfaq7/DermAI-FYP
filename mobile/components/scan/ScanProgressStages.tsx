import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { getScanColors, SCAN_CAMERA_OVERLAY } from '@/constants/scanTheme';
import { ANALYSIS_STAGES } from '@/data/skinScanResult';
import { useAppTheme } from '@/theme/useAppTheme';

interface ScanProgressStagesProps {
  currentProgress: number;
}

export function ScanProgressStages({ currentProgress }: ScanProgressStagesProps) {
  const { colors } = useAppTheme();
  const scanColors = useMemo(() => getScanColors(colors), [colors]);

  const activeStage = ANALYSIS_STAGES.find(
    (stage) => currentProgress >= stage.min && currentProgress <= stage.max,
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
          backgroundColor: SCAN_CAMERA_OVERLAY.stageContainer,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          gap: SPACING.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: SCAN_CAMERA_OVERLAY.stageDot,
        },
        dotComplete: {
          backgroundColor: colors.secondary,
        },
        dotActive: {
          backgroundColor: scanColors.progressFill,
          transform: [{ scale: 1.2 }],
        },
        label: {
          flex: 1,
          fontSize: FONT.caption,
          color: scanColors.textMuted,
        },
        labelComplete: {
          color: scanColors.textSecondary,
        },
        labelActive: {
          color: SCAN_CAMERA_OVERLAY.textPrimary,
          fontWeight: '600',
        },
      }),
    [colors, scanColors],
  );

  return (
    <View style={styles.container}>
      {ANALYSIS_STAGES.map((stage) => {
        const isComplete = currentProgress > stage.max;
        const isActive = stage.label === activeStage?.label;

        return (
          <View key={stage.label} style={styles.row}>
            <View
              style={[
                styles.dot,
                isComplete && styles.dotComplete,
                isActive && styles.dotActive,
              ]}
            />
            <Text
              style={[
                styles.label,
                isComplete && styles.labelComplete,
                isActive && styles.labelActive,
              ]}>
              {stage.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
