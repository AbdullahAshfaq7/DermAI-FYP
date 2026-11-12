import { useMemo } from 'react';
import { Platform, StyleSheet, Switch, SwitchProps } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

interface AppSwitchProps extends Omit<SwitchProps, 'trackColor' | 'thumbColor' | 'ios_backgroundColor'> {}

export function AppSwitch({ value, disabled, ...props }: AppSwitchProps) {
  const { colors } = useAppTheme();

  const trackColor = useMemo(
    () => ({
      false: colors.surfaceMuted,
      true: colors.primary,
    }),
    [colors],
  );

  return (
    <Switch
      {...props}
      value={value}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      trackColor={trackColor}
      thumbColor={Platform.OS === 'android' ? colors.textInverse : undefined}
      ios_backgroundColor={colors.surfaceMuted}
    />
  );
}
