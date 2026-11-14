import { Stack } from 'expo-router';

export default function ScanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="camera" options={{ animation: 'fade' }} />
      <Stack.Screen name="review" />
      <Stack.Screen name="analyzing" options={{ gestureEnabled: false, animation: 'fade' }} />
      <Stack.Screen name="results/[id]" options={{ animation: 'fade' }} />
    </Stack>
  );
}
