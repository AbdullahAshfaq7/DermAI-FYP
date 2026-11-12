import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { SCAN_CAMERA_OVERLAY } from '@/constants/scanTheme';
import { useAppTheme } from '@/theme/useAppTheme';

interface ScanDisclaimerProps {
  variant?: 'light' | 'dark';
}

export function ScanDisclaimer({ variant = 'light' }: ScanDisclaimerProps) {
  const { colors } = useAppTheme();
  const isDarkOverlay = variant === 'dark';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: SPACING.sm,
          backgroundColor: isDarkOverlay
            ? SCAN_CAMERA_OVERLAY.disclaimerDarkBg
            : colors.primarySoft,
          borderRadius: RADIUS.md,
          padding: SPACING.sm + 4,
        },
        text: {
          flex: 1,
          fontSize: FONT.tiny + 1,
          color: isDarkOverlay ? SCAN_CAMERA_OVERLAY.disclaimerDarkText : colors.textMuted,
          lineHeight: 16,
        },
      }),
    [colors, isDarkOverlay],
  );

  return (
    <View style={styles.container}>
      <Ionicons
        name="information-circle-outline"
        size={16}
        color={isDarkOverlay ? SCAN_CAMERA_OVERLAY.disclaimerDarkText : colors.textMuted}
      />
      <Text style={styles.text}>
        {isDarkOverlay
          ? 'This scan provides informational skin insights and is not a medical diagnosis.'
          : 'For informational use only — not a medical diagnosis.'}
      </Text>
    </View>
  );
}
