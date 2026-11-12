import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FONT, RADIUS, SPACING } from '@/constants/homeTheme';
import { PHOTO_QUALITY_ITEMS } from '@/data/skinScanResult';
import { useAppTheme } from '@/theme/useAppTheme';

export function PhotoQualityChecklist() {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.primarySoft,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          gap: SPACING.sm,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: SPACING.sm,
        },
        iconWrap: {
          width: 22,
          alignItems: 'center',
        },
        text: {
          flex: 1,
          fontSize: FONT.caption + 1,
          color: colors.textSecondary,
          lineHeight: 18,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.container}>
      {PHOTO_QUALITY_ITEMS.map((item) => (
        <View key={item} style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="checkmark-circle" size={18} color={colors.secondary} />
          </View>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  );
}
