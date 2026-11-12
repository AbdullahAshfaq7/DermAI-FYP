import { Stack } from 'expo-router';

import { ScanProvider } from '@/context/ScanContext';

export default function ScanLayout() {
  return (
    <ScanProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="review" />
        <Stack.Screen name="analyzing" options={{ gestureEnabled: false }} />
        <Stack.Screen name="results" />
      </Stack>
    </ScanProvider>
  );
}
