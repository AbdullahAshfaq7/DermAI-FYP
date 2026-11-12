import { APP_INIT_MIN_MS } from '@/constants/branding';

export type AppInitResult = {
  initialRoute: '/(tabs)';
};

async function wait(ms: number) {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Loads fonts, restores auth, and checks onboarding before first navigation.
 * Static build always routes to the main tabs.
 */
export async function initializeApp(): Promise<AppInitResult> {
  const startedAt = Date.now();

  // Future: load custom fonts with useFonts, restore auth, read onboarding flag.
  await wait(APP_INIT_MIN_MS);

  const elapsed = Date.now() - startedAt;
  if (elapsed < APP_INIT_MIN_MS) {
    await wait(APP_INIT_MIN_MS - elapsed);
  }

  return { initialRoute: '/(tabs)' };
}
