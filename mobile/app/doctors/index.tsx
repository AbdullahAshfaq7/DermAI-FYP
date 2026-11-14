import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, Card, Chip, EmptyState, Field, IconButton, Screen, TopBar, Txt } from '@/components/ui/kit';
import { DOCTORS } from '@/data/seed';
import { pkr } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

type Filter = 'city' | 'video' | 'concern' | 'female';

/** E3 Find a dermatologist: only verified doctors are listed. */
export default function Doctors() {
  const { colors } = useTheme();
  const { share } = useLocalSearchParams<{ share?: string }>();
  const s = useApp();
  const city = s.profile.city || 'Lahore';
  const concern = s.profile.concerns.includes('acne') ? 'Acne' : s.profile.concerns.includes('redness') ? 'Redness' : 'Acne';
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sort, setSort] = useState<'fee' | 'rating'>('rating');
  const toggle = (f: Filter) => setFilters((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return DOCTORS.filter((d) => !filters.includes('city') || d.city === city)
      .filter((d) => !filters.includes('video') || d.services.some((x) => x.type === 'video'))
      .filter((d) => !filters.includes('concern') || d.specialties.includes(concern))
      .filter((d) => !filters.includes('female') || d.female)
      .filter((d) => !term || [d.name, d.clinic, d.focus, ...d.specialties].join(' ').toLowerCase().includes(term))
      .sort((a, b) => (sort === 'rating' ? b.rating - a.rating : Math.min(...a.services.map((x) => x.fee)) - Math.min(...b.services.map((x) => x.fee))));
  }, [q, filters, city, concern, sort]);

  return (
    <Screen
      header={
        <TopBar
          title="Dermatologists"
          right={
            <IconButton
              icon="tune"
              label="Sort"
              onPress={() =>
                Alert.alert('Sort by', undefined, [
                  { text: 'Highest rated', onPress: () => setSort('rating') },
                  { text: 'Lowest fee', onPress: () => setSort('fee') },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
            />
          }
        />
      }>
      <Field label="Search" value={q} onChangeText={setQ} placeholder="Name, clinic or concern" right={<Icon name="search" size={20} color={colors.textMuted} />} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        <Chip label={city} selected={filters.includes('city')} onPress={() => toggle('city')} />
        <Chip label="Video visit" selected={filters.includes('video')} onPress={() => toggle('video')} />
        <Chip label={concern} selected={filters.includes('concern')} onPress={() => toggle('concern')} />
        <Chip label="Female doctor" selected={filters.includes('female')} onPress={() => toggle('female')} />
      </ScrollView>
      {share ? (
        <Txt variant="small" color="secondary">
          Pick a doctor; you&apos;ll choose which scans to share when you book.
        </Txt>
      ) : null}
      {list.length === 0 ? (
        <EmptyState icon="search" title="No doctors match" body="Try removing a filter." action="Clear filters" onAction={() => setFilters([])} />
      ) : (
        list.map((d) => {
          const fee = d.services.find((x) => x.type === 'video') ?? d.services[0];
          const modes = d.services.filter((x) => x.type !== 'message').map((x) => x.type);
          const where = modes.length === 2 ? `Video or ${d.clinic.split(',')[0].replace(' Phase 5', '')} clinic` : modes[0] === 'video' ? 'Video only' : `${d.clinic.split(',')[0]} clinic only`;
          return (
            <Card key={d.id} onPress={() => router.push({ pathname: '/doctors/[id]', params: { id: d.id } })} label={`${d.name}, PMDC verified`}>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <Avatar name={d.name} size={52} tone={d.tone} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="bodyStrong">{d.name}</Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name="verified" size={14} color={colors.brand} />
                    <Txt variant="caption" color="brand">
                      PMDC verified
                    </Txt>
                  </View>
                  <Txt variant="small" color="secondary">
                    {d.focus} · {d.years} yrs
                  </Txt>
                  <Txt variant="small" color="secondary">
                    {where}
                  </Txt>
                  <Txt variant="smallStrong" style={{ marginTop: 2 }}>
                    {pkr(fee.fee)} · {d.nextFree}
                  </Txt>
                </View>
              </View>
            </Card>
          );
        })
      )}
    </Screen>
  );
}
