import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';

import { Button, ProgressBar, Screen, Txt } from '@/components/ui/kit';
import { FaceMap, ScanSweep } from '@/components/visual';
import { ANALYSIS_STAGES } from '@/lib/analysis';
import { useActions } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const TOTAL_MS = 8000;

/** C4 Analysing: stage labels from the pipeline; the person can leave and get notified. */
export default function Analyzing() {
  const { colors } = useTheme();
  const { uri, dim } = useLocalSearchParams<{ uri: string; dim?: string }>();
  const { runAnalysis } = useActions();
  const [elapsed, setElapsed] = useState(0);
  const done = useRef(false);

  const finish = (leave: boolean) => {
    if (done.current) return;
    done.current = true;
    const scan = runAnalysis(uri ?? '', dim === '1');
    if (leave) router.dismissTo('/home');
    else router.replace({ pathname: '/scan/results/[id]', params: { id: scan.id, fresh: '1' } });
  };

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const e = Date.now() - start;
      setElapsed(e);
      if (e >= TOTAL_MS) {
        clearInterval(t);
        finish(false);
      }
    }, 200);
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      finish(true);
      return true;
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stage = Math.min(ANALYSIS_STAGES.length - 1, Math.floor((elapsed / TOTAL_MS) * ANALYSIS_STAGES.length));
  const secondsLeft = Math.max(1, Math.ceil((TOTAL_MS - elapsed) / 1000));

  return (
    <Screen scroll={false} edges={['top', 'bottom']} footer={<Button label="Leave and notify me" variant="secondary" onPress={() => finish(true)} />}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xl }}>
        <View style={{ borderRadius: 90, overflow: 'hidden' }}>
          <FaceMap zones={null} width={180} />
          <ScanSweep width={180} height={225} />
        </View>
        <View style={{ alignItems: 'center', gap: space.xs }} accessibilityLiveRegion="polite">
          <Txt variant="title" align="center">
            {ANALYSIS_STAGES[stage]}
          </Txt>
          <Txt variant="small" color="secondary">
            Step {stage + 1} of {ANALYSIS_STAGES.length} · about {secondsLeft} seconds left
          </Txt>
        </View>
        <View style={{ alignSelf: 'stretch' }}>
          <ProgressBar value={(elapsed / TOTAL_MS) * 100} color={colors.brand} />
        </View>
        <Txt variant="small" color="secondary" align="center">
          You can leave this screen. We&apos;ll notify you when it&apos;s ready.
        </Txt>
      </View>
    </Screen>
  );
}
