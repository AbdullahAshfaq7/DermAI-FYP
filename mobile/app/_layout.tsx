import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BrandedSplashScreen } from '@/components/branding/BrandedSplashScreen';
import { SPLASH_BACKGROUND } from '@/constants/branding';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { RecommendationsProvider } from '@/context/RecommendationsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeApp } from '@/lib/initialize-app';
import { ThemeProvider as AppThemeProvider } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash may already be hidden during fast refresh in development.
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAppReady, setIsAppReady] = useState(false);
  const [isNativeSplashHidden, setIsNativeSplashHidden] = useState(false);
  const [showBrandedSplash, setShowBrandedSplash] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function prepare() {
      try {
        await initializeApp();
      } catch (error) {
        console.warn('App initialization failed:', error);
      } finally {
        if (isMounted) {
          setIsAppReady(true);
        }
      }
    }

    prepare();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAppReady || isNativeSplashHidden) {
      return;
    }

    let isMounted = true;

    async function hideNativeSplash() {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('Failed to hide native splash screen:', error);
      } finally {
        if (isMounted) {
          setIsNativeSplashHidden(true);
        }
      }
    }

    hideNativeSplash();

    return () => {
      isMounted = false;
    };
  }, [isAppReady, isNativeSplashHidden]);

  // Safety net so the splash cannot remain stuck if init/hide fails.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAppReady(true);
      setIsNativeSplashHidden(true);
      setShowBrandedSplash(false);
      SplashScreen.hideAsync().catch(() => {});
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  const handleBrandedSplashFinish = () => {
    setShowBrandedSplash(false);
  };

  const showMainApp = isAppReady && isNativeSplashHidden && !showBrandedSplash;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: SPLASH_BACKGROUND }}>
        {showMainApp ? (
          <AppThemeProvider>
            <RecommendationsProvider>
              <NotificationsProvider>
              <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerBackTitle: 'Back' }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="recommendations" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false, presentation: 'card' }} />
                  <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card' }} />
                  <Stack.Screen name="scan" options={{ headerShown: false, presentation: 'card' }} />
                  <Stack.Screen name="pre-scan" options={{ headerShown: false, presentation: 'card' }} />
                </Stack>
              </NavigationThemeProvider>
              </NotificationsProvider>
            </RecommendationsProvider>
          </AppThemeProvider>
        ) : null}

        {isNativeSplashHidden && showBrandedSplash ? (
          <BrandedSplashScreen onFinish={handleBrandedSplashFinish} />
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}
