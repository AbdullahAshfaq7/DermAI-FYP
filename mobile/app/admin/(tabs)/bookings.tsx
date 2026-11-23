import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { apptTone, cap, Filters, Loader, payTone, SearchField } from '@/components/admin';
import { Button, EmptyState, List, Row, Screen, StatusPill, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { adminApi, dateTime, useAdminQuery, usePageLimit, type ApptStatus, type Service } from '@/lib/admin';
import { pkr } from '@/lib/format';
import { space } from '@/theme/tokens';

const PAGE = 30;

/** Every booking across all doctors. */
export default function Bookings() {
  const [status, setStatus] = useState<ApptStatus | ''>('upcoming');
  const [service, setService] = useState<Service | ''>('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const [limit, showMore] = usePageLimit([status, service, query].join('|'), PAGE);
  const { data, error, loading, reload } = useAdminQuery(() => adminApi.appointments({ status, service, q: query, limit }), [status, service, query, limit]);

  return (
    <Screen dock>
      <Txt variant="display" style={{ marginTop: space.sm }}>
        Bookings
      </Txt>
      <SearchField value={q} onChange={setQ} placeholder="Search patient, doctor or booking id" />
      <Filters
        value={status}
        onChange={setStatus}
        options={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'done', label: 'Done' },
          { value: 'cancelled', label: 'Cancelled' },
          { value: '', label: 'All' },
        ]}
      />
      <Filters
        value={service}
        onChange={setService}
        options={[
          { value: '', label: 'Any kind' },
          { value: 'video', label: 'Video' },
          { value: 'clinic', label: 'Clinic' },
          { value: 'message', label: 'Message' },
        ]}
      />
      <Loader loading={loading} error={error} onRetry={() => void reload()} empty={<EmptyState icon="event-available" title="No bookings" body="Nothing matches these filters." />}>
        {data?.appointments.length ? (
          <>
            <Txt variant="small" color="secondary">
              {data.total} booking{data.total === 1 ? '' : 's'}
            </Txt>
            <List>
              {data.appointments.map((a) => (
                <Row
                  key={a.id}
                  icon={SERVICE_META[a.service].icon}
                  iconTone={a.status === 'cancelled' ? 'muted' : 'brand'}
                  title={`${a.patientName} → ${a.doctorName}`}
                  subtitle={
                    <View style={{ gap: 4 }}>
                      <Txt variant="small" color="secondary">
                        {SERVICE_META[a.service].short} · {a.service === 'message' ? `sent ${dateTime(a.createdAt)}` : dateTime(a.start)} · {pkr(a.fee)}
                      </Txt>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <StatusPill label={cap(a.status)} tone={apptTone(a.status)} />
                        <StatusPill label={cap(a.paymentStatus)} tone={payTone(a.paymentStatus)} />
                      </View>
                    </View>
                  }
                  chevron
                  onPress={() => router.push({ pathname: '/admin/booking/[id]', params: { id: a.id } })}
                />
              ))}
            </List>
            {data.appointments.length < data.total ? <Button variant="secondary" label="Show more" loading={loading} onPress={showMore} /> : null}
          </>
        ) : null}
      </Loader>
    </Screen>
  );
}
