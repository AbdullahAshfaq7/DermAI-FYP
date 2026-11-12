import { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/tokens';

interface AppDividerProps {
  inset?: number;
  style?: ViewStyle;
}

export function AppDivider({ inset = 0, style }: AppDividerProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        divider: {
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.divider,
          marginVertical: spacing.xs,
          marginLeft: inset,
        },
      }),
    [colors.divider, inset],
  );

  return <View style={[styles.divider, style]} />;
}
