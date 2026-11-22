import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Card, EmptyState, List, Row, Screen, Segmented, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { PhotoCompare, TrendLine } from '@/components/visual';
import { CONCERN_ORDER, CONCERNS } from '@/data/seed';
import { dayMonth } from '@/lib/format';
import { useLocalPhotos } from '@/lib/localPhotos';
import { photoFor } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const RANGES = { '30': 30, '42': 42, '90': 90 } as const;

/** D4 Progress: drag the divider to compare; trend per concern. */
export default function Progress() {
  const s = useApp();
  const local = useLocalPhotos(s.session?.id);
  const [range, setRange] = useState<keyof typeof RANGES>('42');
  const [now] = useState(() => Date.now());
  const inRange = [...s.scans].filter((x) => now - new Date(x.date).getTime() < RANGES[range] * 86400000).reverse();
  const scans = inRange.length >= 2 ? inRange : [...s.scans].reverse();

  if (scans.length < 2) {
    return (
      <Screen header={<TopBar title="Progress" />}>
        <EmptyState icon="insights" title="Progress needs two scans" body="Scan again in the same light in about 10 days to see what's changing." action="Scan now" onAction={() => router.push('/scan')} />
      </Screen>
    );
  }

  const first = scans[0];
  const last = scans[scans.length - 1];
  const rows = CONCERN_ORDER.map((k) => ({ k, a: first.concerns[k].pct, b: last.concerns[k].pct }))
    .filter((r) => Math.max(r.a, r.b) >= 25)
    .sort((x, y) => Math.abs(y.b - y.a) - Math.abs(x.b - x.a));

  return (
    <Screen header={<TopBar title="Progress" />}>
      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { value: '30', label: '1 month' },
          { value: '42', label: '6 weeks' },
          { value: '90', label: '3 months' },
        ]}
      />
      {inRange.length < 2 ? (
        <Txt variant="small" color="muted">
          Fewer than two scans in that range, so this shows all your scans.
        </Txt>
      ) : null}
      <PhotoCompare
        height={220}
        before={{ uri: photoFor(first, local), tone: first.photoTone, label: dayMonth(first.date) }}
        after={{ uri: photoFor(last, local), tone: last.photoTone, label: dayMonth(last.date) }}
      />
      <List>
        {rows.map(({ k, a, b }) => {
          const d = b - a;
          return (
            <Row
              key={k}
              title={CONCERNS[k].label}
              subtitle={`${a} to ${b}`}
              right={
                <StatusPill
                  icon={d < 0 ? 'trending-down' : d > 0 ? 'trending-up' : 'trending-flat'}
                  label={d <= -3 ? 'Improving' : d >= 3 ? 'Up slightly' : 'Steady'}
                  tone={d <= -3 ? 'good' : d >= 3 ? 'watch' : 'neutral'}
                />
              }
            />
          );
        })}
      </List>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="bodyStrong">Skin score</Txt>
          <StatusPill label={`${first.score} to ${last.score}`} tone={last.score >= first.score ? 'good' : 'act'} />
        </View>
        <TrendLine values={scans.map((x) => x.score)} dots="all" height={80} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xs }}>
          <Txt variant="caption" color="muted">
            {dayMonth(first.date)}
          </Txt>
          <Txt variant="caption" color="muted">
            {dayMonth(last.date)}
          </Txt>
        </View>
      </Card>
      <Row title={`${scans.length} scans`} subtitle="See them all in Scan history" chevron onPress={() => router.push('/history')} />
    </Screen>
  );
}
