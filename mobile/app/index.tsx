import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Txt } from '@/components/ui/kit';
import { LogoMark, Wordmark } from '@/components/visual';
import { useStore } from '@/store/AppStore';
import { homeFor } from '@/lib/nav';
import { lightColors } from '@/theme/colors';
import { space } from '@/theme/tokens';

/** A1 Splash: shows while the app restores the session, then routes by role. */
export default function Splash() {
  const { state, ready } = useStore();
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMinTimeDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && minTimeDone) router.replace(homeFor(state));
  }, [ready, minTimeDone, state]);

  return (
    <View style={{ flex: 1, backgroundColor: lightColors.ink }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', gap: space.md }}>
          <LogoMark size={76} ring="#4FB3A6" />
          <Wordmark size={30} color="#FFFFFF" />
        </View>
        <View style={{ position: 'absolute', bottom: space.xxl }}>
          <Txt variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Skin guidance, not diagnosis
          </Txt>
        </View>
      </SafeAreaView>
    </View>
  );
}
