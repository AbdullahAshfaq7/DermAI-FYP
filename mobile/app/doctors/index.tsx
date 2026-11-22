import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { usePicker } from '@/components/PickerSheet';
import { Icon } from '@/components/ui/Icon';
import { Avatar, Card, Chip, EmptyState, Field, IconButton, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { pkr } from '@/lib/format';
import { slotLabel } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

type Filter = 'online' | 'city' | 'budget' | 'female';
const minFee = (d: { services: { fee: number }[] }) => Math.min(...d.services.map((x) => x.fee));

/** E3 Find a dermatologist: only PMDC-verified doctors; next slot and fee on every card. */
export default function Doctors() {
  const { colors } = useTheme();
  const { share } = useLocalSearchParams<{ share?: string }>();
  const s = useApp();
  const city = s.profile.city || 'Lahore';
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sort, setSort] = useState<'soonest' | 'rating' | 'fee'>('soonest');
  const [sheet, pick] = usePicker();
  const toggle = (f: Filter) => setFilters((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]));

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return s.doctors
      .filter((d) => !filters.includes('online') || d.services.some((x) => x.type === 'video'))
      .filter((d) => !filters.includes('city') || d.city === city)
      .filter((d) => !filters.includes('budget') || minFee(d) < 3000)
      .filter((d) => !filters.includes('female') || d.female)
      .filter((d) => !term || [d.name, d.clinic, d.focus, ...d.specialties].join(' ').toLowerCase().includes(term))
      .sort((a, b) =>
        sort === 'rating'
          ? b.rating - a.rating
          : sort === 'fee'
            ? minFee(a) - minFee(b)
            : (a.nextSlot?.iso ?? '9').localeCompare(b.nextSlot?.iso ?? '9'),
      );
  }, [s.doctors, q, filters, city, sort]);

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
                pick('Sort by', [
                  { label: 'Soonest free', selected: sort === 'soonest', onPress: () => setSort('soonest') },
                  { label: 'Highest rated', selected: sort === 'rating', onPress: () => setSort('rating') },
                  { label: 'Lowest fee', selected: sort === 'fee', onPress: () => setSort('fee') },
                ])
              }
            />
          }
        />
      }>
      <Field label="Search" value={q} onChangeText={setQ} placeholder="Name, clinic or concern" right={<Icon name="search" size={20} color={colors.textMuted} />} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
        <Chip label="Online" selected={filters.includes('online')} onPress={() => toggle('online')} />
        <Chip label={city} selected={filters.includes('city')} onPress={() => toggle('city')} />
        <Chip label="Under Rs 3,000" selected={filters.includes('budget')} onPress={() => toggle('budget')} />
        <Chip label="Female" selected={filters.includes('female')} onPress={() => toggle('female')} />
      </ScrollView>
      {share ? (
        <Txt variant="small" color="secondary">
          Pick a doctor; you&apos;ll choose which scans to share when you book.
        </Txt>
      ) : null}
      {list.length === 0 ? (
        <EmptyState icon="search" title="No doctors match" body="Try removing a filter." action="Clear filters" onAction={() => setFilters([])} />
      ) : (
        list.map((d) => (
          <Card key={d.id} onPress={() => router.push({ pathname: '/doctors/[id]', params: { id: d.id } })} label={`${d.name}, PMDC verified`}>
            <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
              <Avatar name={d.name} size={46} tone={d.tone} uri={d.photoUrl} />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="bodyStrong">{d.name}</Txt>
                <Txt variant="caption" color="muted">
                  {d.focus}
                </Txt>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Icon name="verified" size={14} color={colors.clinician} />
                    <Txt variant="caption" color="clinician">
                      PMDC
                    </Txt>
                  </View>
                  <Txt variant="caption" color="muted">
                    {d.reviews ? (
                      <>
                        <Txt variant="caption">{d.rating}</Txt> ({d.reviews})
                      </>
                    ) : (
                      'New'
                    )}
                  </Txt>
                </View>
              </View>
              <Txt variant="heading">{pkr(minFee(d)).replace('PKR', 'Rs')}</Txt>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.md }}>
              {d.nextSlot ? (
                <StatusPill label={slotLabel(d.nextSlot.iso)} tone={slotLabel(d.nextSlot.iso).startsWith('Today') ? 'good' : 'neutral'} />
              ) : (
                <StatusPill label={d.nextFree} tone="neutral" />
              )}
              <Txt variant="caption" color="muted">
                {d.years ? `${d.years} years` : d.city}
              </Txt>
            </View>
          </Card>
        ))
      )}
      {sheet}
    </Screen>
  );
}
