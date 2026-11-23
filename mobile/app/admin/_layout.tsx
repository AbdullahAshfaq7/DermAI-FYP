import { Redirect, Stack } from 'expo-router';

import { homeFor } from '@/lib/nav';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';

/** Admin portal. Anyone who isn't signed in as an admin is sent to their own home. */
export default function AdminLayout() {
  const s = useApp();
  const { colors } = useTheme();
  if (s.session?.role !== 'admin') return <Redirect href={s.session ? homeFor(s) : '/admin-login'} />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
