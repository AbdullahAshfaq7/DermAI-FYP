import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Chip, EmptyState, IconButton, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { ScanPhoto } from '@/components/visual';
import { CONCERNS } from '@/data/seed';
import { usePicker } from '@/components/PickerSheet';
import { doctorName, photoFor } from '@/lib/selectors';
import { useLocalPhotos } from '@/lib/localPhotos';
import { attempt } from '@/lib/useSubmit';
import { rankedConcerns } from '@/lib/analysis';
import { dayMonth, drShort, monthName, shortDay } from '@/lib/format';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

type Filter = 'all' | '30' | 'shared';

/** F6 Scan history: every scan with its score; tap one to reopen its results (C5). */
export default function History() {
  const [sheet, pick] = usePicker();
  const s = useApp();
  const local = useLocalPhotos(s.session?.id);
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
    if (share) return `Shared with ${drShort(doctorName(s, share.doctorId, 'a doctor'))}`;
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
          right={
            <IconButton
              icon="compare"
              label="Sort"
              onPress={() =>
                pick('Scan history', [
                  { label: 'Compare scans', onPress: () => router.push('/progress') },
                  { label: 'Newest first', selected: sort === 'new', onPress: () => setSort('new') },
                  { label: 'Oldest first', selected: sort === 'old', onPress: () => setSort('old') },
                ])
              }
            />
          }
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
                    leading={<ScanPhoto uri={photoFor(x, local)} tone={x.photoTone} style={{ width: 44, height: 44, borderRadius: 13 }} />}
                    title={`${shortDay(x.date)} ${dayMonth(x.date)}`}
                    subtitle={subtitle(x, i)}
                    right={
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Txt variant="heading">{x.score}</Txt>
                        {d != null ? <StatusPill label={`${d >= 0 ? '+' : '−'}${Math.abs(d)}`} tone={d >= 0 ? 'good' : 'watch'} /> : <StatusPill label="Start" tone="neutral" />}
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
            pick(
              'Delete a scan',
              s.scans.map((x) => ({
                label: `${dayMonth(x.date)} · score ${x.score}`,
                destructive: true,
                onPress: () =>
                  Alert.alert(`Delete the ${dayMonth(x.date)} scan?`, "Its photo and scores are removed, and doctors you shared it with won't see it.", [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => attempt(deleteScan(x.id), "Couldn't delete the scan") },
                  ]),
              })),
              'This removes the photo and its scores.',
            )
          }>
          Delete a scan
        </Txt>
      ) : null}
      <Txt variant="caption" color="muted" align="center">
        {s.settings.photoRetention === 'always' ? 'Photos stay on this phone until you delete them.' : `Photos stay on this phone for ${s.settings.photoRetention === '3m' ? '3 months' : '1 year'}.`}{' '}
        <Txt variant="caption" color="brand" onPress={() => router.push('/privacy')}>
          Change in Privacy
        </Txt>
      </Txt>
      {sheet}
    </Screen>
  );
}
