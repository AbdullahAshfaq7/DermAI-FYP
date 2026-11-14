import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold } from '@expo-google-fonts/dm-sans';
import { Sora_500Medium, Sora_600SemiBold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStoreProvider } from '@/store/AppStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { anchor: 'index' };

function Navigator() {
  const { isDark, colors } = useTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  return (
    <NavigationThemeProvider
      value={{ ...base, colors: { ...base.colors, background: colors.bg, card: colors.surface, text: colors.textPrimary, border: colors.border, primary: colors.brand } }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(patient)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(derm)" options={{ animation: 'fade' }} />
        <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="booked/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="assess/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_500Medium,
    Sora_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });
  const fontsReady = fontsLoaded || !!fontError;

  useEffect(() => {
    if (fontsReady) SplashScreen.hideAsync().catch(() => {});
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppStoreProvider>
          <Navigator />
        </AppStoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
