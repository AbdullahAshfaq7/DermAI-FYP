import { Tabs, usePathname, useRouter } from 'expo-router';
import { ComponentProps, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBackdrop, getBottomNavWrapperHeight } from '@/components/navigation/BottomNavBackdrop';
import { CenterScanButton } from '@/components/navigation/CenterScanButton';
import { GlassNavigationSurface } from '@/components/navigation/GlassNavigationSurface';
import { NavigationTab } from '@/components/navigation/NavigationTab';
import {
    getNavBottomOffset,
    GLASS_NAV_BAR_HEIGHT,
    NAV_HORIZONTAL_MARGIN,
    NAVIGATION_ITEMS,
    NavigationItem
} from '@/constants/navigation';
import { useAppTheme } from '@/theme/useAppTheme';

type NavSlot =
  | { type: 'tab'; item: NavigationItem }
  | { type: 'scan' };

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const NAV_SLOTS: NavSlot[] = [
  { type: 'tab', item: NAVIGATION_ITEMS[0] },
  { type: 'tab', item: NAVIGATION_ITEMS[1] },
  { type: 'scan' },
  { type: 'tab', item: NAVIGATION_ITEMS[2] },
  { type: 'tab', item: NAVIGATION_ITEMS[3] },
];

export function BottomNavigation({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useAppTheme();
  const bottomOffset = getNavBottomOffset(insets.bottom);
  const isScanActive = pathname.startsWith('/scan');
  const backdropHeight = getBottomNavWrapperHeight(bottomOffset);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          pointerEvents: 'box-none',
        },
        navWrapper: {
          position: 'absolute',
          left: NAV_HORIZONTAL_MARGIN,
          right: NAV_HORIZONTAL_MARGIN,
          bottom: bottomOffset,
          height: GLASS_NAV_BAR_HEIGHT,
          overflow: 'visible',
        },
        navigationContent: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 6,
          paddingTop: 4,
          paddingBottom: 6,
        },
        slot: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [bottomOffset],
  );

  const handleScanPress = () => {
    router.push('/pre-scan');
  };

  const renderTab = (item: NavigationItem) => {
    const routeIndex = state.routes.findIndex((route) => route.name === item.name);

    if (routeIndex === -1) {
      return null;
    }

    const route = state.routes[routeIndex];
    const isFocused = state.index === routeIndex;

    const onPress = () => {
      const event = emitter.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigateToTab(route.key);
      }
    };

    return (
      <NavigationTab
        label={item.label}
        activeIcon={item.activeIcon}
        inactiveIcon={item.inactiveIcon}
        active={isFocused}
        onPress={onPress}
        isDark={isDark}
      />
    );
  };

  return (
    <View style={[styles.wrapper, { height: backdropHeight + 8 }]} pointerEvents="box-none">
      <BottomNavBackdrop bottomOffset={bottomOffset} isDark={isDark} />

      <View style={styles.navWrapper} pointerEvents="box-none">
        <GlassNavigationSurface isDark={isDark}>
          <View style={styles.navigationContent}>
            {NAV_SLOTS.map((slot) => {
              if (slot.type === 'scan') {
                return <View key="scan-slot" style={styles.slot} pointerEvents="none" />;
              }

              return (
                <View key={slot.item.name} style={styles.slot}>
                  {renderTab(slot.item)}
                </View>
              );
            })}
          </View>
        </GlassNavigationSurface>

        <CenterScanButton active={isScanActive} onPress={handleScanPress} isDark={isDark} />
      </View>
    </View>
  );
}
