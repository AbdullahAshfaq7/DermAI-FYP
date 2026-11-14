import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { ScanPhoto } from '@/components/visual';
import { reviewChecks } from '@/lib/analysis';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

/** C3 Review: per-photo check results (simulated until on-device checks exist). */
export default function Review() {
  const { colors } = useTheme();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const { profile } = useApp();
  const checks = useMemo(() => reviewChecks(uri ? uri.length : 1), [uri]);
  const dim = checks.some((c) => !c.ok);

  return (
    <Screen
      header={<TopBar title="Check your photo" onLeft={() => router.replace('/scan/camera')} />}
      footer={
        <>
          <Button label="Use this photo" variant="brand" onPress={() => router.replace({ pathname: '/scan/analyzing', params: { uri, dim: dim ? '1' : '0' } })} />
          <Button label="Retake" variant="secondary" onPress={() => router.replace('/scan/camera')} />
        </>
      }>
      <ScanPhoto uri={uri} tone={profile.tone ?? 2} style={{ height: 380, borderRadius: radius.sheet }} />
      <List>
        {checks.map((c) => (
          <Row
            key={c.key}
            leading={<Icon name={c.ok ? 'check-circle' : 'error'} size={22} color={c.ok ? colors.goodIcon : colors.watchIcon} />}
            title={c.label}
            right={c.note ? <StatusPill label={c.note} tone="watch" /> : null}
          />
        ))}
      </List>
      {dim ? (
        <View style={{ paddingHorizontal: 4 }}>
          <Txt variant="small" color="secondary">
            We&apos;ll score it with a little less confidence. Retake facing a window for the clearest read.
          </Txt>
        </View>
      ) : null}
    </Screen>
  );
}
