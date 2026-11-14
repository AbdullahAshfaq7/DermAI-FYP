import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar, Button, Card, Chip, Disclaimer, List, Row, Screen, StatusPill, Txt } from '@/components/ui/kit';
import { DOCTORS } from '@/data/seed';
import { AI_SUGGESTIONS } from '@/lib/ai';
import { pkr, shortDay, time } from '@/lib/format';
import { nextAppointment } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** E1 Care hub: AI chat, your current doctor, find a doctor. */
export default function Care() {
  const s = useApp();
  const appt = nextAppointment(s);
  const thread = s.threads[0];
  const doctor = DOCTORS.find((d) => d.id === (appt?.doctorId ?? thread?.doctorId));
  const city = s.profile.city || 'Lahore';
  const inCity = DOCTORS.filter((d) => d.city === city || d.clinic === 'Video only');
  const minFee = Math.min(...DOCTORS.flatMap((d) => d.services.map((x) => x.fee)));

  return (
    <Screen>
      <Txt variant="title" style={{ marginTop: space.sm }}>
        Care
      </Txt>
      <Card onPress={() => router.push('/ai-chat')} label="Ask DermAI">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md }}>
          <View style={{ flex: 1 }}>
            <Txt variant="heading">Ask DermAI</Txt>
            <Txt variant="small" color="secondary">
              Answers based on your latest scan
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {AI_SUGGESTIONS.map((q) => (
            <Chip key={q} label={q} tone="tag" onPress={() => router.push({ pathname: '/ai-chat', params: { q } })} />
          ))}
        </View>
      </Card>

      {doctor ? (
        <>
          <Txt variant="heading">Your dermatologist</Txt>
          <List>
            <Row
              leading={<Avatar name={doctor.name} tone={doctor.tone} />}
              title={doctor.name}
              subtitle={appt ? (appt.service === 'message' ? 'Case review by message' : `${appt.service === 'video' ? 'Video visit' : 'Clinic visit'} ${shortDay(appt.start)} ${time(appt.start)}`) : doctor.focus}
              right={thread?.unreadForPatient ? <StatusPill label={`${thread.unreadForPatient} new`} tone="brand" /> : null}
              chevron
              onPress={() => (thread ? router.push({ pathname: '/thread/[id]', params: { id: thread.id } }) : router.push({ pathname: '/doctors/[id]', params: { id: doctor.id } }))}
            />
            <Row icon="history" title="Past visits and notes" chevron onPress={() => router.push('/appointments')} />
          </List>
        </>
      ) : null}

      <Card tone="brand" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong" color="brandDeep">
            See a dermatologist
          </Txt>
          <Txt variant="small" color="brandDeep">
            {inCity.length} verified for {city}, from {pkr(minFee)}
          </Txt>
        </View>
        <Button label="Find" compact onPress={() => router.push('/doctors')} />
      </Card>
      <Disclaimer />
    </Screen>
  );
}
