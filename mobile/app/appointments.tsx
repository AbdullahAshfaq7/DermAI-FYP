import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar, EmptyState, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { SERVICE_META } from '@/data/seed';
import { dayMonth, time, weekdayDayMonth } from '@/lib/format';
import { doctorById } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** Appointments (from Me and "Past visits and notes" on Care). */
export default function Appointments() {
  const s = useApp();
  const upcoming = s.appointments.filter((a) => a.status === 'upcoming').sort((a, b) => a.start.localeCompare(b.start));
  const past = s.appointments.filter((a) => a.status !== 'upcoming').sort((a, b) => b.start.localeCompare(a.start));

  const row = (a: (typeof s.appointments)[number]) => {
    const d = doctorById(s, a.doctorId) ?? { id: a.doctorId, name: 'Doctor no longer listed', tone: 2, photoUrl: null };
    const when = a.service === 'message' ? `Case review · ${dayMonth(a.start)}` : `${SERVICE_META[a.service].short} · ${weekdayDayMonth(a.start)}, ${time(a.start)}`;
    return (
      <Row
        key={a.id}
        leading={<Avatar name={d.name} size={40} tone={d.tone} uri={d.photoUrl} />}
        title={d.name}
        subtitle={a.reason ? `${when}\n${a.reason}` : when}
        right={a.status === 'cancelled' ? <StatusPill label="Cancelled" /> : a.status === 'done' ? <StatusPill label={a.rating ? `${a.rating}★` : 'Rate'} tone="good" /> : null}
        chevron
        onPress={() => router.push({ pathname: '/booked/[id]', params: { id: a.id } })}
      />
    );
  };

  return (
    <Screen header={<TopBar title="Appointments" />}>
      {s.appointments.length === 0 ? (
        <EmptyState icon="event" title="No visits yet" body="Book a video visit, a clinic visit or a case review with a verified dermatologist." action="Find a dermatologist" onAction={() => router.push('/doctors')} />
      ) : (
        <>
          {upcoming.length ? (
            <View style={{ gap: space.sm }}>
              <Txt variant="smallStrong" color="secondary">
                Upcoming
              </Txt>
              <List>{upcoming.map(row)}</List>
            </View>
          ) : null}
          {past.length ? (
            <View style={{ gap: space.sm }}>
              <Txt variant="smallStrong" color="secondary">
                Past visits and notes
              </Txt>
              <List>{past.map(row)}</List>
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}
