import { router, type Href } from 'expo-router';

import type { AppState } from '@/store/state';

/** Where a person should land, given what they've finished so far. */
export function homeFor(s: AppState): Href {
  if (!s.session) return '/welcome';
  if (!s.consent) return '/consent';
  if (s.session.role === 'patient') return s.profile.done ? '/home' : '/setup/tone';
  if (s.derm.step === 'profile') return '/derm-setup/profile';
  if (s.derm.step === 'credentials') return '/derm-setup/credentials';
  if (s.derm.step === 'services') return '/derm-setup/services';
  return '/today';
}

/** Navigate to a stored link (notifications) that isn't known at compile time. */
export function go(href: string) {
  router.push(href as Href);
}

export function back(fallback: Href = '/') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/** Clear any modals and history, then land on `href` (used on log-in and log-out). */
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
