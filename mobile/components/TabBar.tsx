import * as Haptics from 'expo-haptics';
import { router, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/tokens';

export type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export interface TabSpec {
  name: string;
  label: string;
  icon: IconName;
  badge?: number;
}

/**
 * Patient tab bar puts a raised Scan button in the middle (design.md section 7);
 * the dermatologist bar uses the clinician accent for the active tab.
 */
export function TabBar({ state, emitter, navigateToTab, tabs, role }: BottomTabBarProps & { tabs: TabSpec[]; role: 'patient' | 'dermatologist' }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const active = role === 'dermatologist' ? colors.clinician : colors.textPrimary;
  const items = tabs.map((t) => ({ ...t, index: state.routes.findIndex((r) => r.name === t.name) }));
  const half = role === 'patient' ? 2 : items.length;

  const renderTab = (t: (typeof items)[number]) => {
    const focused = state.index === t.index;
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
          <Icon name={t.icon} size={24} color={focused ? active : colors.textMuted} />
          {t.badge ? <View style={[styles.dot, { backgroundColor: colors.actIcon, borderColor: colors.surface }]} /> : null}
        </View>
        <Text style={[type.caption, { fontSize: 11, color: focused ? active : colors.textMuted }]}>{t.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
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
              { backgroundColor: colors.brand, borderColor: colors.surface, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Icon name="center-focus-weak" size={28} color={colors.onFill} />
          </Pressable>
        </View>
      ) : null}
      {role === 'patient' ? items.slice(half).map(renderTab) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, minHeight: 48 },
  dot: { position: 'absolute', top: -2, right: -4, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  scan: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    ...Platform.select({
      ios: { shadowColor: '#0E2A33', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 8 },
      default: {},
    }),
  },
});
