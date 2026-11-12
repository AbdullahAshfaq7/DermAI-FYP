import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CONTENT_EXTRA, getBottomNavPadding } from '@/constants/navigation';

export function useBottomNavPadding(extra = BOTTOM_NAV_CONTENT_EXTRA): number {
  const insets = useSafeAreaInsets();
  return getBottomNavPadding(insets.bottom, extra);
}
