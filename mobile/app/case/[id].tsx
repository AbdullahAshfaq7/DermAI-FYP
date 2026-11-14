import { router, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';

import { shortPatient } from '@/components/derm';
import { Bubble, DoctorNote } from '@/components/chat';
import { Button, Card, EmptyState, IconButton, IconTile, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { FaceMap, PhotoCompare } from '@/components/visual';
import { FITZ_ROMAN } from '@/data/seed';
import { dayMonth } from '@/lib/format';
import { useStore } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** H3 Case review: photos, AI reading and history in one view. */
export default function CaseReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, update } = useStore();
  const c = state.derm.cases.find((x) => x.id === id);

  if (!c) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="folder-open" title="Case not found" body="It may have been closed or transferred." />
      </Screen>
    );
  }

  const first = c.photos[0];
  const last = c.photos[c.photos.length - 1];
  const done = !!c.assessment;

  const more = () =>
    Alert.alert(`${shortPatient(c.patient.name)}, ${c.patient.age}`, undefined, [
      ...(c.threadId ? [{ text: 'Message patient', onPress: () => router.push({ pathname: '/inbox/[id]', params: { id: c.threadId! } }) }] : []),
      c.status === 'closed'
        ? { text: 'Reopen case', onPress: () => update((s) => ({ ...s, derm: { ...s.derm, cases: s.derm.cases.map((x) => (x.id === c.id ? { ...x, status: 'waiting' } : x)) } })) }
        : { text: 'Close case', style: 'destructive' as const, onPress: () => update((s) => ({ ...s, derm: { ...s.derm, cases: s.derm.cases.map((x) => (x.id === c.id ? { ...x, status: 'closed' } : x)) } })) },
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  return (
    <Screen
      header={<TopBar title={`${shortPatient(c.patient.name)}, ${c.patient.age}`} right={<IconButton icon="more-horiz" label="Case options" onPress={more} />} />}
      footer={
        done ? (
          <Button label="Edit assessment" variant="secondary" onPress={() => router.push({ pathname: '/assess/[id]', params: { id: c.id } })} />
        ) : (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Agree with AI" variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/assess/[id]', params: { id: c.id, agree: '1' } })} />
            <Button label="Write assessment" variant="clinician" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/assess/[id]', params: { id: c.id } })} />
          </View>
        )
      }>
      {c.photos.length > 1 ? (
        <PhotoCompare before={{ tone: first.tone, label: dayMonth(first.date) }} after={{ tone: last.tone + 1, label: dayMonth(last.date) }} />
      ) : null}
      <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <FaceMap zones={c.ai.zones} width={84} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt variant="caption" color="secondary">
            AI reading · {c.ai.confidence}% confident
          </Txt>
          <Txt variant="small">{c.ai.reading}</Txt>
          {c.urgency === 'urgent' ? <StatusPill label="Flagged urgent" tone="act" /> : null}
        </View>
      </Card>
      <List>
        <Row
          leading={<IconTile icon="assignment-ind" tone="clinician" />}
          title="Profile"
          subtitle={`${c.patient.type} · Fitz. ${FITZ_ROMAN[c.patient.fitz - 1]}${c.patient.avoids.length ? ` · avoids ${c.patient.avoids.join(', ').toLowerCase()}` : ''}`}
        />
        <Row leading={<IconTile icon="chat" tone="clinician" />} title="Patient says" subtitle={`"${c.complaint}"`} />
      </List>
      {c.assessment ? (
        <View style={{ gap: space.sm }}>
          <Txt variant="heading">Your assessment</Txt>
          <Bubble msg={{ id: 'a', from: 'doctor', text: c.assessment.note, at: c.assessment.sentAt ?? new Date().toISOString() }} mine clinician />
          <DoctorNote name={state.session?.name ?? 'Dr.'} stop={c.assessment.stop} keep={c.assessment.keep} />
        </View>
      ) : null}
    </Screen>
  );
}
