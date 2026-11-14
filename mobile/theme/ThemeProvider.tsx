import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { getColors, type ResolvedTheme, type ThemeColors, type ThemePreference } from '@/theme/colors';

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
