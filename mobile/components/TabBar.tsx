import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export interface TabSpec {
  name: string;
  label: string;
  icon: IconName;
  /** Icon when the tab is selected (filled). */
  iconOn?: IconName;
  badge?: number;
}

/**
 * Lumen floating dock: a rounded bar above the screen edge, with a large Scan button in thumb reach
 * for patients. Screens under it add `dockClearance` bottom padding (Screen's `dock` prop).
 */
export function TabBar({ state, emitter, navigateToTab, tabs, role }: BottomTabBarProps & { tabs: TabSpec[]; role: 'patient' | 'dermatologist' }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const items = tabs.map((t) => ({ ...t, index: state.routes.findIndex((r) => r.name === t.name) }));
  const half = role === 'patient' ? 2 : items.length;
  const bottom = Math.max(insets.bottom, 10) + 4;

  const renderTab = (t: (typeof items)[number]) => {
    const focused = state.index === t.index;
    const c = focused ? colors.brand : colors.textMuted;
    return (
      <Pressable
        key={t.name}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={t.badge ? `${t.label}, ${t.badge} new` : t.label}
        onPress={() => {
          const route = state.routes[t.index];
          const ev = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !ev.defaultPrevented) navigateToTab(route.key);
        }}
        style={styles.tab}>
        <View>
          <Icon name={focused ? (t.iconOn ?? t.icon) : t.icon} size={23} color={c} />
          {t.badge ? <View style={[styles.dot, { backgroundColor: colors.actIcon, borderColor: colors.surface }]} /> : null}
        </View>
        <Text style={{ fontFamily: fonts.sans600, fontSize: 10.5, color: c }}>{t.label}</Text>
      </Pressable>
    );
  };

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64 + bottom + 40 }}>
      <LinearGradient pointerEvents="none" colors={[`${colors.bg}00`, colors.bg]} locations={[0, 0.55]} style={StyleSheet.absoluteFill} />
      <View
        style={[
          styles.dock,
          { bottom, backgroundColor: colors.dock, borderColor: colors.border },
          colors.shadow !== 'rgba(0, 0, 0, 0)' ? ({ boxShadow: '0 14px 30px -12px rgba(33,20,58,0.4)' } as ViewStyle) : null,
        ]}>
        {items.slice(0, half).map(renderTab)}
        {role === 'patient' ? (
          <View style={styles.tab}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan my skin"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/scan');
              }}
              style={({ pressed }) => [
                styles.scan,
                { backgroundColor: colors.brand, borderColor: colors.dock === lightDock ? '#FFFFFF' : colors.surface, opacity: pressed ? 0.88 : 1 },
                { boxShadow: `0 10px 20px -6px ${colors.brand}` } as ViewStyle,
              ]}>
              <Icon name="center-focus-strong" size={26} color={colors.onFill} />
            </Pressable>
          </View>
        ) : null}
        {role === 'patient' ? items.slice(half).map(renderTab) : null}
      </View>
    </View>
  );
}

const lightDock = 'rgba(255, 255, 255, 0.97)';

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: 14,
    right: 14,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 52 },
  dot: { position: 'absolute', top: -2, right: -5, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  scan: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
  },
});
