export const THEME_STORAGE_KEY = 'dermai-theme-preference';

export function isValidThemePreference(value: unknown): value is import('@/theme/types').ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function getPreferenceLabel(preference: import('@/theme/types').ThemePreference): string {
  switch (preference) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
      return 'System default';
  }
}

export function resolveTheme(
  preference: import('@/theme/types').ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): import('@/theme/types').ResolvedTheme {
  if (preference === 'light') {
    return 'light';
  }
  if (preference === 'dark') {
    return 'dark';
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}
