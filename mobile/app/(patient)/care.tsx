import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, Button, Card, Disclaimer, List, Row, Screen, StatusPill, Txt } from '@/components/ui/kit';
import { aiSuggestions } from '@/lib/ai';
import { dayMonth, time, weekdayDayMonth } from '@/lib/format';
import { doctorById, nextAppointment } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** E1 Care hub: AI chat, your doctor, and finding a new one. */
export default function Care() {
  const s = useApp();
  const appt = nextAppointment(s);
  // The doctor you're seeing next, else the one you messaged most recently (threads come newest first).
  const thread = (appt && s.threads.find((t) => t.doctorId === appt.doctorId)) ?? s.threads[0];
  const doctor = doctorById(s, appt?.doctorId ?? thread?.doctorId);
  const city = s.profile.city || 'Lahore';
  const local = s.doctors.filter((d) => d.city === city || d.services.some((x) => x.type === 'video')).length;
  const scan = s.scans[0];
  const noteThread = s.threads.find((t) => t.unreadForPatient > 0 && t.messages.some((m) => m.note));
  const lastCase = noteThread ?? s.threads[0];

  return (
    <Screen dock>
      <Txt variant="display" style={{ marginTop: space.sm }}>
        Care
      </Txt>
      <Card tone="brandFill" style={{ borderRadius: 26 }}>
        <Pressable onPress={() => router.push('/ai-chat')} accessibilityRole="button" accessibilityLabel="Ask DermAI" style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="auto-awesome" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="heading" color="onFill">
              Ask DermAI
            </Txt>
            <Txt variant="caption" color="onFill" style={{ opacity: 0.8 }}>
              {scan ? `Knows your scan from ${dayMonth(scan.date)}` : 'Answers about skin and ingredients'}
            </Txt>
          </View>
        </Pressable>
        <View style={{ gap: space.xs + 2, marginTop: space.md }}>
          {aiSuggestions(scan).slice(0, 2).map((q) => (
            <Pressable
              key={q}
              onPress={() => router.push({ pathname: '/ai-chat', params: { q } })}
              accessibilityRole="button"
              style={{ backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 99, paddingHorizontal: space.md + 2, paddingVertical: space.sm }}>
              <Txt variant="small" color="onFill">
                {q}
              </Txt>
            </Pressable>
          ))}
        </View>
      </Card>

      {doctor ? (
        <>
          <Txt variant="heading">Your dermatologist</Txt>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <Avatar name={doctor.name} tone={doctor.tone} uri={doctor.photoUrl} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{doctor.name}</Txt>
              <Txt variant="caption" color="muted">
                {appt ? (appt.service === 'message' ? 'Case review by message' : `${weekdayDayMonth(appt.start)}, ${time(appt.start)}, ${appt.service}`) : doctor.focus}
              </Txt>
            </View>
            <Button
              label="Message"
              variant="secondary"
              compact
              onPress={() => (thread ? router.push({ pathname: '/thread/[id]', params: { id: thread.id } }) : router.push({ pathname: '/doctors/[id]', params: { id: doctor.id } }))}
            />
          </Card>
        </>
      ) : null}

      <List>
        <Row icon="person-search" iconTone="clinician" title="Find a dermatologist" subtitle={`${local} verified in ${city} and online`} chevron onPress={() => router.push('/doctors')} />
        {lastCase ? (
          <Row
            icon="folder-shared"
            iconTone="muted"
            title="Your cases"
            subtitle={`${lastCase.caseTitle}${lastCase.messages.some((m) => m.note) ? ', replied' : ''}`}
            right={noteThread ? <StatusPill label="New note" tone="clinician" /> : null}
            chevron
            onPress={() => router.push({ pathname: '/thread/[id]', params: { id: lastCase.id } })}
          />
        ) : null}
        <Row icon="history" iconTone="muted" title="Visits and notes" chevron onPress={() => router.push('/appointments')} />
      </List>
      <Disclaimer />
    </Screen>
  );
}
