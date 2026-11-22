import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, ErrorBanner, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { ScanPhoto } from '@/components/visual';
import { errorMessage, isApiError } from '@/lib/api';
import { pickFromLibrary } from '@/lib/photos';
import { useActions, useApp, type PhotoCheck, type QualityCheck } from '@/store/AppStore';
import { NightTheme, useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const NAME: Record<QualityCheck['key'], string> = { light: 'Lighting', focus: 'Focus', face: 'Framing' };
const ORDER: QualityCheck['key'][] = ['light', 'focus', 'face'];

/** C3 Review (Night): real check results from the server, and a retake is always one tap (FR-3, FR-5). */
function Review() {
  const { colors } = useTheme();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { profile } = useApp();
  const { checkPhoto } = useActions();
  const [result, setResult] = useState<PhotoCheck | null>(null);
  const [rejected, setRejected] = useState<{ reason: string; checks: QualityCheck[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uri) return;
    let live = true;
    checkPhoto(uri)
      .then((r) => live && setResult(r))
      .catch((e) => {
        if (!live) return;
        if (isApiError(e) && e.code === 'photo_unusable') setRejected({ reason: e.message, checks: (e.extra.checks as QualityCheck[]) ?? [] });
        else setError(errorMessage(e));
      });
    return () => {
      live = false;
    };
  }, [uri, attempt, checkPhoto]);

  const checks = [...(result?.checks ?? rejected?.checks ?? [])].sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key));
  const checking = !result && !rejected && !error;

  const uploadAnother = async () => {
    const next = await pickFromLibrary().catch(() => null);
    if (next) router.replace({ pathname: '/scan/review', params: { uri: next } });
  };

  return (
    <Screen
      header={<TopBar title="Check your photo" onLeft={() => router.replace('/scan/camera')} />}
      footer={
        result ? (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Retake" variant="secondary" style={{ flex: 1 }} onPress={() => router.replace('/scan/camera')} />
            <Button label="Use photo" style={{ flex: 1 }} onPress={() => router.replace({ pathname: '/scan/analyzing', params: { uploadId: result.uploadId, uri } })} />
          </View>
        ) : (
          <>
            {error ? (
              <Button
                label="Try again"
                onPress={() => {
                  setError(null);
                  setAttempt((a) => a + 1);
                }}
              />
            ) : null}
            <Button label="Retake" variant={rejected ? 'primary' : 'secondary'} onPress={() => router.replace('/scan/camera')} />
            {rejected ? <Button label="Upload a different photo" variant="ghost" onPress={() => void uploadAnother()} /> : null}
          </>
        )
      }>
      <ScanPhoto uri={uri} tone={profile.tone ?? 2} style={{ height: 300, borderRadius: 26 }} />
      {checking ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md }} accessibilityLiveRegion="polite">
          <ActivityIndicator color={colors.brand} />
          <Txt variant="body" color="secondary">
            Checking light, focus and framing…
          </Txt>
        </View>
      ) : null}
      <ErrorBanner error={error ?? rejected?.reason} />
      {checks.length ? (
        <List>
          {checks.map((c) => {
            const okay = !c.ok && !!c.note;
            return (
              <Row
                key={c.key}
                leading={<Icon name={c.ok ? 'check-circle' : 'error'} size={22} color={c.ok ? '#5FD3A0' : okay ? '#FFD66E' : colors.actIcon} />}
                title={NAME[c.key]}
                subtitle={c.label}
                right={<StatusPill label={c.ok ? 'Good' : okay ? 'Okay' : 'Fix'} tone={c.ok ? 'good' : okay ? 'watch' : 'act'} />}
              />
            );
          })}
        </List>
      ) : null}
      {result?.dim ? (
        <Txt variant="small" color="secondary">
          We&apos;ll score it with a little less confidence. Retake facing a window for the clearest read.
        </Txt>
      ) : null}
    </Screen>
  );
}

export default function ReviewScreen() {
  return (
    <NightTheme>
      <Review />
    </NightTheme>
  );
}
