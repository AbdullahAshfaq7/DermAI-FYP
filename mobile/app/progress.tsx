import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Card, Chip, EmptyState, IconButton, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { PhotoCompare, TrendLine } from '@/components/visual';
import { CONCERNS } from '@/data/seed';
import type { ConcernKey } from '@/data/types';
import { dayMonth } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

type Metric = 'score' | ConcernKey;
const METRICS: Metric[] = ['score', 'redness', 'acne', 'darkSpots', 'dryness', 'pores', 'sensitivity'];

/** D4 Progress: drag the divider to compare photos; trend per concern. */
export default function Progress() {
  const s = useApp();
  const [metric, setMetric] = useState<Metric>('score');
  const [range, setRange] = useState<'all' | '30'>('all');
  const [now] = useState(() => Date.now());
  const scans = [...s.scans]
    .filter((x) => range === 'all' || now - new Date(x.date).getTime() < 30 * 86400000)
    .reverse();

  if (scans.length < 2) {
    return (
      <Screen header={<TopBar title="Progress" />}>
        <EmptyState icon="insights" title="Progress needs two scans" body="Scan again in the same light in about 10 days to see what's changing." action="Scan now" onAction={() => router.push('/scan')} />
      </Screen>
    );
  }

  const first = scans[0];
  const last = scans[scans.length - 1];
  const values = scans.map((x) => (metric === 'score' ? x.score : x.concerns[metric].pct));
  const a = values[0];
  const b = values[values.length - 1];
  const better = metric === 'score' ? b >= a : b <= a;
  const diff = b - a;
  const label = metric === 'score' ? 'Score' : CONCERNS[metric].label;
  const daylight = scans.every((x) => x.quality === 'good');
  const avgGap = Math.round((new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000 / (scans.length - 1));

  return (
    <Screen
      header={
        <TopBar
          title="Progress"
          right={
            <IconButton
              icon="tune"
              label="Choose range"
              onPress={() =>
                Alert.alert('Show scans from', undefined, [
                  { text: 'All time', onPress: () => setRange('all') },
                  { text: 'Last 30 days', onPress: () => setRange('30') },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
            />
          }
        />
      }>
      <PhotoCompare
        before={{ uri: first.photoUri, tone: first.photoTone, label: dayMonth(first.date) }}
        after={{ uri: last.photoUri, tone: last.photoTone + 1, label: dayMonth(last.date) }}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {METRICS.map((m) => (
          <Chip key={m} label={m === 'score' ? 'Score' : CONCERNS[m].label} selected={metric === m} onPress={() => setMetric(m)} />
        ))}
      </View>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="title">
            {metric === 'score' ? `${a} to ${b}` : `${a}% to ${b}%`}
          </Txt>
          <StatusPill label={`${diff > 0 ? '+' : ''}${diff}${metric === 'score' ? '' : '%'}`} tone={diff === 0 ? 'neutral' : better ? 'good' : 'act'} />
        </View>
        <Txt variant="small" color="secondary" style={{ marginBottom: space.sm }}>
          {label}
          {metric === 'score' ? ', higher is better' : ', lower is better'}
        </Txt>
        <TrendLine values={values} dots="all" height={90} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
          <Txt variant="small" color="secondary">
            {dayMonth(first.date)}
          </Txt>
          {scans.length > 2 ? (
            <Txt variant="small" color="secondary">
              {dayMonth(scans[Math.floor(scans.length / 2)].date)}
            </Txt>
          ) : null}
          <Txt variant="small" color="secondary">
            {dayMonth(last.date)}
          </Txt>
        </View>
      </Card>
      <List>
        <Row
          title={`${scans.length} scans`}
          subtitle={`Every ${avgGap} days${daylight ? ', all in daylight' : ', some in dim light'}`}
          chevron
          onPress={() => router.push('/history')}
        />
      </List>
    </Screen>
  );
}
