import { BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold } from '@expo-google-fonts/instrument-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/webAlert';
import { AppStoreProvider, useStore } from '@/store/AppStore';
import { nightColors } from '@/theme/colors';
import { RoleTheme, ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { anchor: 'index' };

function Navigator() {
  const { isDark, colors } = useTheme();
  // Screens read the session when they mount (forms copy it into local state), so wait until it is restored.
  const { ready } = useStore();
  if (!ready) return <View style={{ flex: 1, backgroundColor: nightColors.bg }} />;
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

function Themed() {
  const { state } = useStore();
  return (
    <RoleTheme clinician={state.session?.role === 'dermatologist'}>
      <Navigator />
    </RoleTheme>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
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
          <Themed />
        </AppStoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
