import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, ErrorBanner, IconButton, Screen, Txt } from '@/components/ui/kit';
import { FaceMap, ScanSweep } from '@/components/visual';
import { errorMessage } from '@/lib/api';
import { useActions } from '@/store/AppStore';
import { NightTheme, useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** The stages play over at least this long so each label can be read. */
const MIN_MS = 3500;
const STAGES = ['Photo quality checked', 'Face zones found', 'Measuring six concerns', 'Building your routine'];

/** C4 Analysing (Night): a violet line sweeps the face; the person can leave and get notified. */
function Analyzing() {
  const { colors } = useTheme();
  const { uploadId, uri } = useLocalSearchParams<{ uploadId: string; uri?: string }>();
  const { runAnalysis } = useActions();
  const [elapsed, setElapsed] = useState(0);
  const [scanId, setScanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const left = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !uploadId) return;
    started.current = true;
    // Keeps running if the person leaves; the server adds a "results ready" notification.
    runAnalysis(uploadId, uri)
      .then((scan) => setScanId(scan.id))
      .catch((e) => {
        if (!left.current) setError(errorMessage(e));
      });
  }, [uploadId, uri, runAnalysis]);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 150);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (scanId && elapsed >= MIN_MS && !left.current) router.replace({ pathname: '/scan/results/[id]', params: { id: scanId, fresh: '1' } });
  }, [scanId, elapsed]);

  const leave = () => {
    left.current = true;
    router.dismissTo('/home');
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      leave();
      return true;
    });
    return () => sub.remove();
  }, []);

  const progress = scanId ? Math.min(1, elapsed / MIN_MS) : Math.min(0.9, 1 - Math.exp(-elapsed / 2500));
  const stage = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));
  const measured = Math.min(6, Math.max(1, Math.round((progress * STAGES.length - 2) * 6)));

  if (error) {
    return (
      <Screen
        scroll={false}
        edges={['top', 'bottom']}
        footer={
          <>
            <Button label="Retake photo" onPress={() => router.replace('/scan/camera')} />
            <Button label="Close" variant="secondary" onPress={() => router.dismissTo('/home')} />
          </>
        }>
        <View style={{ flex: 1, justifyContent: 'center', gap: space.lg }}>
          <Txt variant="title">We couldn&apos;t read that photo</Txt>
          <ErrorBanner error={error} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll={false}
      edges={['top', 'bottom']}
      footer={
        <Txt variant="small" color="secondary" align="center">
          You can leave this screen. We&apos;ll notify you when it&apos;s ready.
        </Txt>
      }>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingTop: space.sm }}>
        <IconButton icon="close" label="Leave and notify me" variant="dark" onPress={leave} />
      </View>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 220, height: 270 }}>
          <FaceMap zones={null} width={220} height={270} density={26} />
          <ScanSweep width={220} height={270} />
        </View>
      </View>
      <Txt variant="display" align="center" style={{ marginTop: space.md }}>
        Reading your skin
      </Txt>
      <View style={{ gap: space.md, paddingHorizontal: space.lg, marginTop: space.lg }} accessibilityLiveRegion="polite">
        {STAGES.map((s, i) => {
          const done = i < stage;
          const now = i === stage;
          return (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, opacity: i > stage ? 0.45 : 1 }}>
              <Icon name={done ? 'check-circle' : now ? 'autorenew' : 'radio-button-unchecked'} size={20} color={done ? '#8C7BFF' : colors.textPrimary} />
              <Txt variant={now ? 'bodyStrong' : 'body'} style={{ flex: 1 }}>
                {s}
              </Txt>
              {now && i === 2 ? (
                <Txt variant="caption" color="secondary">
                  {measured} of 6
                </Txt>
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

export default function AnalyzingScreen() {
  return (
    <NightTheme>
      <Analyzing />
    </NightTheme>
  );
}
