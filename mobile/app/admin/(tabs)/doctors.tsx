import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { dermTone, Filters, Loader, SearchField } from '@/components/admin';
import { Avatar, EmptyState, List, Row, Screen, StatusPill, Txt } from '@/components/ui/kit';
import { adminApi, dateTime, DERM_STATUS_LABEL, useAdminQuery, type DermStatus } from '@/lib/admin';
import { space } from '@/theme/tokens';

type F = DermStatus | 'all';

/** Doctor verification queue (oldest first) and every dermatologist on the platform. */
export default function Doctors() {
  const [status, setStatus] = useState<F>('pending');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, error, loading, reload } = useAdminQuery(() => adminApi.derms(status, query), [status, query]);

  return (
    <Screen dock>
      <Txt variant="display" style={{ marginTop: space.sm }}>
        Doctors
      </Txt>
      <SearchField value={q} onChange={setQ} placeholder="Search name, email, PMDC or city" />
      <Filters
        value={status}
        onChange={setStatus}
        options={[
          { value: 'pending', label: 'To review' },
          { value: 'approved', label: 'Verified' },
          { value: 'rejected', label: 'Needs changes' },
          { value: 'draft', label: 'Onboarding' },
          { value: 'all', label: 'All' },
        ]}
      />
      <Loader
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        empty={
          <EmptyState
            icon={status === 'pending' ? 'task-alt' : 'person-search'}
            title={status === 'pending' ? 'Queue is clear' : 'No doctors here'}
            body={status === 'pending' ? 'New PMDC submissions show up here, oldest first.' : 'Try another filter or search.'}
          />
        }>
        {data?.derms.length ? (
          <List>
            {data.derms.map((d) => (
              <Row
                key={d.id}
                leading={<Avatar name={d.name} size={40} clinician />}
                title={d.name}
                subtitle={
                  <View style={{ gap: 4 }}>
                    <Txt variant="small" color="secondary" numberOfLines={1}>
                      {[d.pmdc && `PMDC ${d.pmdc}`, d.city, d.submittedAt && `sent ${dateTime(d.submittedAt)}`].filter(Boolean).join(' · ') || d.email}
                    </Txt>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <StatusPill label={DERM_STATUS_LABEL[d.status]} tone={dermTone(d.status)} />
                      {d.suspended ? <StatusPill label="Suspended" tone="act" icon="block" /> : null}
                    </View>
                  </View>
                }
                chevron
                onPress={() => router.push({ pathname: '/admin/doctor/[id]', params: { id: d.id } })}
              />
            ))}
          </List>
        ) : null}
      </Loader>
    </Screen>
  );
}
