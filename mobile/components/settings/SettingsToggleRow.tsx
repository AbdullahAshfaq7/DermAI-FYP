import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppDivider } from '@/components/ui/AppDivider';
import { AppSwitch } from '@/components/ui/AppSwitch';
import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import { componentHeights, spacing } from '@/theme/tokens';

interface SettingsToggleRowProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
}

export function SettingsToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  isLast = false,
  disabled = false,
}: SettingsToggleRowProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: componentHeights.row + 8,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          gap: spacing.md,
        },
        content: {
          flex: 1,
        },
      }),
    [],
  );

  return (
    <>
      <View style={styles.row} accessibilityRole="none">
        <View style={styles.content}>
          <AppText variant="body" weight="500">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" color="secondary" numberOfLines={2}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        <AppSwitch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          accessibilityLabel={title}
        />
      </View>
      {!isLast ? <AppDivider inset={spacing.lg} /> : null}
    </>
  );
}
