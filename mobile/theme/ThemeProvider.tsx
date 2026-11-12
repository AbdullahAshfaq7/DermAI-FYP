import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme, View } from 'react-native';

import { getThemeColors } from '@/theme/colors';
import { AppThemeContext } from '@/theme/useAppTheme';
import type { AppThemeContextValue, ThemePreference } from '@/theme/types';
import { isValidThemePreference, resolveTheme, THEME_STORAGE_KEY } from '@/theme/utils';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const rawSystemScheme = useColorScheme();
  const systemScheme = rawSystemScheme === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadPreference() {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (isMounted && stored && isValidThemePreference(stored)) {
          setPreferenceState(stored);
        }
      } catch {
        if (isMounted) {
          setPreferenceState('system');
        }
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    loadPreference();

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedTheme = useMemo(
    () => resolveTheme(preference, systemScheme),
    [preference, systemScheme],
  );

  const colors = useMemo(() => getThemeColors(resolvedTheme), [resolvedTheme]);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!isReady) {
      return;
    }

    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {
      // Non-fatal on unsupported platforms.
    });
  }, [colors.background, isReady]);

  const setPreference = useCallback(async (nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);

    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    } catch {
      // Keep in-memory preference even if persistence fails.
    }
  }, []);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      preference,
      resolvedTheme,
      isDark,
      colors,
      setPreference,
      isReady,
    }),
    [preference, resolvedTheme, isDark, colors, setPreference, isReady],
  );

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <AppThemeContext.Provider value={value}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </AppThemeContext.Provider>
  );
}
