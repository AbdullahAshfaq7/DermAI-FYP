import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import type { IoniconName } from '@/constants/navigation';
import {
  ACTIVE_PILL_HEIGHT,
  ACTIVE_PILL_RADIUS,
  ACTIVE_PILL_WIDTH,
  TAB_ICON_LABEL_GAP,
  TAB_ICON_SIZE,
  TAB_LABEL_SIZE,
} from '@/constants/navigation';

export interface NavigationTabProps {
  label: string;
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
  active: boolean;
  onPress: () => void;
  isDark: boolean;
}

const TAB_COLORS = {
  light: {
    activeIcon: '#1769C2',
    activeLabel: '#1769C2',
    activePill: 'rgba(23, 105, 194, 0.10)',
    activePillBorder: 'rgba(23, 105, 194, 0.08)',
    inactiveIcon: '#7E92A6',
    inactiveLabel: '#71869A',
    ripple: 'rgba(23, 105, 194, 0.10)',
  },
  dark: {
    activeIcon: '#F1F7FC',
    activeLabel: '#F1F7FC',
    activePill: 'rgba(255, 255, 255, 0.10)',
    activePillBorder: 'rgba(255, 255, 255, 0.06)',
    inactiveIcon: '#B6C5D3',
    inactiveLabel: '#9EB0C0',
    ripple: 'rgba(255, 255, 255, 0.10)',
  },
} as const;

export function NavigationTab({
  label,
  activeIcon,
  inactiveIcon,
  active,
  onPress,
  isDark,
}: NavigationTabProps) {
  const palette = isDark ? TAB_COLORS.dark : TAB_COLORS.light;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressable: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 44,
          minHeight: 44,
        },
        pressed: {
          opacity: 0.86,
          transform: [{ scale: 0.97 }],
        },
        content: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        activePill: {
          width: ACTIVE_PILL_WIDTH,
          height: ACTIVE_PILL_HEIGHT,
          borderRadius: ACTIVE_PILL_RADIUS,
          backgroundColor: palette.activePill,
          borderWidth: 1,
          borderColor: palette.activePillBorder,
          overflow: 'hidden',
        },
        icon: {
          marginBottom: TAB_ICON_LABEL_GAP,
        },
        label: {
          fontSize: TAB_LABEL_SIZE,
          lineHeight: 12,
          fontWeight: '500',
          color: palette.inactiveLabel,
        },
        labelActive: {
          color: palette.activeLabel,
          fontWeight: '600',
        },
      }),
    [palette],
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      android_ripple={
        Platform.OS === 'android'
          ? { color: palette.ripple, borderless: false, radius: ACTIVE_PILL_RADIUS }
          : undefined
      }
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <View style={[styles.content, active && styles.activePill]}>
        <Ionicons
          name={active ? activeIcon : inactiveIcon}
          size={TAB_ICON_SIZE}
          color={active ? palette.activeIcon : palette.inactiveIcon}
          style={styles.icon}
        />
        <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
      </View>
    </Pressable>
  );
}
