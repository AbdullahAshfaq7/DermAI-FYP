import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui/kit';
import { LogoMark, Wordmark } from '@/components/visual';
import { homeFor } from '@/lib/nav';
import { useStore } from '@/store/AppStore';
import { nightColors } from '@/theme/colors';
import { space } from '@/theme/tokens';

/** A1 Splash (Night): restores the session, then routes by role. */
export default function Splash() {
  const { state, ready } = useStore();
  const pathname = usePathname();
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  // The splash is the stack's anchor, so it stays mounted under deep links; only route when it is showing.
  useEffect(() => {
    if (ready && minTimeDone && pathname === '/') router.replace(homeFor(state));
  }, [ready, minTimeDone, state, pathname]);

  return (
    <View style={{ flex: 1, backgroundColor: nightColors.bg }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', gap: space.lg }}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(123,99,255,0.18)', boxShadow: '0 0 80px 40px rgba(123,99,255,0.22)' } as object} />
            <LogoMark size={96} />
          </View>
          <Wordmark size={38} color={nightColors.textPrimary} />
          <Txt variant="body" style={{ color: nightColors.textSecondary }}>
            Every skin, seen clearly.
          </Txt>
        </View>
        <View style={{ position: 'absolute', bottom: space.xxl, flexDirection: 'row', gap: 5 }}>
          <View style={{ width: 18, height: 4, borderRadius: 9, backgroundColor: '#7B63FF' }} />
          <View style={{ width: 6, height: 4, borderRadius: 9, backgroundColor: nightColors.border }} />
          <View style={{ width: 6, height: 4, borderRadius: 9, backgroundColor: nightColors.border }} />
        </View>
      </SafeAreaView>
    </View>
  );
}
