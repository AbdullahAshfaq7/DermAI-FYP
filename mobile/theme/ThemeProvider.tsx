import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { getColors, nightColors, withRole, type ResolvedTheme, type ThemeColors, type ThemePreference } from '@/theme/colors';

const STORAGE_KEY = 'dermai-theme-preference';

interface ThemeValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  isDark: boolean;
  colors: ThemeColors;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') setPreferenceState(stored);
      })
      .catch(() => {});
  }, []);

  const resolved: ResolvedTheme = preference === 'system' ? system : preference;
  const colors = getColors(resolved);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [colors.bg]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, isDark: resolved === 'dark', colors, setPreference }),
    [preference, resolved, colors, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

/** Build a memoised StyleSheet-like object from the current colours. */
export function makeStyles<T>(factory: (c: ThemeColors, isDark: boolean) => T) {
  return function useStyles(): T {
    const { colors, isDark } = useTheme();
    return useMemo(() => factory(colors, isDark), [colors, isDark]);
  };
}

/** Re-provides the theme with different colours for a subtree (role accent, Night). */
function Override({ children, map, dark }: { children: ReactNode; map: (c: ThemeColors) => ThemeColors; dark?: boolean }) {
  const parent = useTheme();
  const colors = useMemo(() => map(parent.colors), [map, parent.colors]);
  const value = useMemo(() => ({ ...parent, colors, isDark: dark ?? parent.isDark }), [parent, colors, dark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Dermatologists see Emerald wherever patients see Lamp violet. */
export function RoleTheme({ clinician, children }: { clinician: boolean; children: ReactNode }) {
  const map = useCallback((c: ThemeColors) => withRole(c, clinician), [clinician]);
  return <Override map={map}>{children}</Override>;
}

const toNight = () => nightColors;

/** The scan flow (camera, analysis, results) runs on Night whatever the app theme. */
export function NightTheme({ children }: { children: ReactNode }) {
  return (
    <Override map={toNight} dark>
      <StatusBar style="light" />
      {children}
    </Override>
  );
}
