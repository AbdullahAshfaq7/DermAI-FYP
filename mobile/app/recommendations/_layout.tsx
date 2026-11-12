import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'list',
};

export default function RecommendationsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="list" />
      <Stack.Screen name="index" />
      <Stack.Screen name="detail/[id]" />
    </Stack>
  );
}
