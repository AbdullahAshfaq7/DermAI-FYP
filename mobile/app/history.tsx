import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Chip, EmptyState, IconButton, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { ScanPhoto } from '@/components/visual';
import { CONCERNS, DOCTORS } from '@/data/seed';
import { rankedConcerns } from '@/lib/analysis';
import { dayMonth, drShort, monthName, time } from '@/lib/format';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

type Filter = 'all' | '30' | 'shared';

/** F6 Scan history: every scan with its score; tap one to reopen its results (C5). */
export default function History() {
  const s = useApp();
  const { deleteScan } = useActions();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<'new' | 'old'>('new');
  const [now] = useState(() => Date.now());

  const shared = new Set([...s.shares.flatMap((x) => x.scanIds), ...s.scans.filter((x) => x.sharedWith.length).map((x) => x.id)]);
  const list = s.scans
    .filter((x) => filter !== '30' || now - new Date(x.date).getTime() < 30 * 86400000)
    .filter((x) => filter !== 'shared' || shared.has(x.id));
  const ordered = sort === 'new' ? list : [...list].reverse();
  const groups: { month: string; items: typeof list }[] = [];
  for (const x of ordered) {
    const m = monthName(x.date);
    if (!groups.length || groups[groups.length - 1].month !== m) groups.push({ month: m, items: [] });
    groups[groups.length - 1].items.push(x);
  }

  const subtitle = (x: (typeof list)[number], i: number) => {
    if (x.quality === 'dim') return 'Dim light, scored with caution';
    if (i === s.scans.length - 1) return 'First scan';
    const share = s.shares.find((sh) => sh.scanIds.includes(x.id));
    if (share) return `Shared with ${drShort(DOCTORS.find((d) => d.id === share.doctorId)?.name ?? 'a doctor')}`;
    return rankedConcerns(x)
      .slice(0, 2)
      .map((k) => `${CONCERNS[k].label} ${x.concerns[k].level.toLowerCase()}`)
      .join(' · ');
  };

  return (
    <Screen
      header={
        <TopBar
          title="Scan history"
          right={<IconButton icon="tune" label="Sort" onPress={() => Alert.alert('Sort', undefined, [{ text: 'Newest first', onPress: () => setSort('new') }, { text: 'Oldest first', onPress: () => setSort('old') }, { text: 'Cancel', style: 'cancel' }])} />}
        />
      }>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Last 30 days" selected={filter === '30'} onPress={() => setFilter('30')} />
        <Chip label="Shared" selected={filter === 'shared'} onPress={() => setFilter('shared')} />
      </ScrollView>
      {s.scans.length === 0 ? (
        <EmptyState icon="photo-camera" title="No scans yet" body="Your first one takes about a minute." action="Scan now" onAction={() => router.push('/scan')} />
      ) : list.length === 0 ? (
        <EmptyState icon="filter-list" title="No scans here" body="Try another filter." />
      ) : (
        groups.map((g) => (
          <View key={g.month} style={{ gap: space.sm }}>
            <Txt variant="smallStrong" color="secondary">
              {g.month}
            </Txt>
            <List>
              {g.items.map((x) => {
                const i = s.scans.findIndex((y) => y.id === x.id);
                const prev = s.scans[i + 1];
                const d = prev ? x.score - prev.score : null;
                return (
                  <Row
                    key={x.id}
                    leading={<ScanPhoto uri={x.photoUri} tone={x.photoTone} style={{ width: 44, height: 44, borderRadius: 10 }} />}
                    title={`${dayMonth(x.date)} · ${time(x.date)}`}
                    subtitle={subtitle(x, i)}
                    right={
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Txt variant="heading">{x.score}</Txt>
                        {d != null ? <StatusPill label={`${d >= 0 ? '+' : ''}${d}`} tone={d >= 0 ? 'good' : 'act'} /> : null}
                      </View>
                    }
                    onPress={() => router.push({ pathname: '/scan/results/[id]', params: { id: x.id } })}
                  />
                );
              })}
            </List>
          </View>
        ))
      )}
      {s.scans.length ? (
        <Txt
          variant="small"
          color="act"
          align="center"
          onPress={() =>
            Alert.alert('Delete a scan', 'Choose which scan to delete. This removes the photo and its scores.', [
              ...s.scans.slice(0, 4).map((x) => ({ text: `${dayMonth(x.date)} (${x.score})`, style: 'destructive' as const, onPress: () => deleteScan(x.id) })),
              { text: 'Cancel', style: 'cancel' as const },
            ])
          }>
          Delete a scan
        </Txt>
      ) : null}
    </Screen>
  );
}
