import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { cap, caseTone, Filters, Loader, SearchField, urgencyTone } from '@/components/admin';
import { Button, EmptyState, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { adminApi, dateTime, useAdminQuery, usePageLimit, type CaseStatus } from '@/lib/admin';

const PAGE = 30;

/** Every case across all doctors. */
export default function AdminCases() {
  const params = useLocalSearchParams<{ urgency?: string }>();
  const [status, setStatus] = useState<CaseStatus | ''>('');
  const [urgency, setUrgency] = useState<string>(params.urgency ?? '');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const [limit, showMore] = usePageLimit([status, urgency, query].join('|'), PAGE);
  const { data, error, loading, reload } = useAdminQuery(() => adminApi.cases({ status, urgency, q: query, limit }), [status, urgency, query, limit]);

  return (
    <Screen header={<TopBar title="Cases" />}>
      <SearchField value={q} onChange={setQ} placeholder="Search DA-number, patient or complaint" />
      <Filters
        value={status}
        onChange={setStatus}
        options={[
          { value: '', label: 'Any status' },
          { value: 'waiting', label: 'Waiting' },
          { value: 'replied', label: 'Replied' },
          { value: 'closed', label: 'Closed' },
        ]}
      />
      <Filters
        value={urgency}
        onChange={setUrgency}
        options={[
          { value: '', label: 'Any urgency' },
          { value: 'urgent', label: 'Urgent' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'mild', label: 'Mild' },
        ]}
      />
      <Loader loading={loading} error={error} onRetry={() => void reload()} empty={<EmptyState icon="folder-open" title="No cases" body="Nothing matches these filters." />}>
        {data?.cases.length ? (
          <>
            <Txt variant="small" color="secondary">
              {data.total} case{data.total === 1 ? '' : 's'}
            </Txt>
            <List>
              {data.cases.map((c) => (
                <Row
                  key={c.id}
                  icon="folder-open"
                  iconTone={c.urgency === 'urgent' ? 'act' : c.urgency === 'moderate' ? 'watch' : 'muted'}
                  title={`${c.number ?? 'Case'} · ${c.patientName}`}
                  subtitle={
                    <View style={{ gap: 4 }}>
                      <Txt variant="small" color="secondary" numberOfLines={1}>
                        {c.doctorName} · {dateTime(c.receivedAt)}
                      </Txt>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <StatusPill label={cap(c.status)} tone={caseTone(c.status)} />
                        <StatusPill label={cap(c.urgency)} tone={urgencyTone(c.urgency)} />
                      </View>
                    </View>
                  }
                  chevron
                  onPress={() => router.push({ pathname: '/admin/case/[id]', params: { id: c.id } })}
                />
              ))}
            </List>
            {data.cases.length < data.total ? <Button variant="secondary" label="Show more" loading={loading} onPress={showMore} /> : null}
          </>
        ) : null}
      </Loader>
    </Screen>
  );
}
