import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { shortPatient } from '@/components/derm';
import { DoctorNote } from '@/components/chat';
import { Avatar, Button, Card, EmptyState, IconButton, Screen, Segmented, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { FaceMap, MapTag, PhotoCompare, ScanPhoto } from '@/components/visual';
import { usePicker } from '@/components/PickerSheet';
import { FITZ_ROMAN } from '@/data/seed';
import { dayMonth } from '@/lib/format';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** H3 Case review: photos, AI reading and history in one view. */
export default function CaseReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useApp();
  const { setCaseStatus } = useActions();
  const { colors } = useTheme();
  const [view, setView] = useState<'photo' | 'map' | 'compare'>('photo');
  const [w, setW] = useState(0);
  const [sheet, pick] = usePicker();
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

  const title = c.patient.age ? `${shortPatient(c.patient.name)}, ${c.patient.age}` : shortPatient(c.patient.name);
  const more = () =>
    pick(title, [
      ...(c.threadId ? [{ label: 'Message patient', onPress: () => router.push({ pathname: '/inbox/[id]', params: { id: c.threadId! } }) }] : []),
      c.status === 'closed'
        ? { label: 'Reopen case', onPress: () => attempt(setCaseStatus(c.id, 'waiting')) }
        : { label: 'Close case', destructive: true, onPress: () => attempt(setCaseStatus(c.id, 'closed')) },
    ]);

  const views = [
    ...(c.photos.length ? [{ value: 'photo' as const, label: 'Photo' }] : []),
    { value: 'map' as const, label: 'AI map' },
    ...(c.photos.length > 1 ? [{ value: 'compare' as const, label: 'Compare' }] : []),
  ];
  const shown = views.some((v) => v.value === view) ? view : views[0].value;

  return (
    <Screen
      header={
        <TopBar
          title={c.number ? `Case ${c.number}` : title}
          right={
            <View style={{ flexDirection: 'row', gap: space.xs }}>
              {c.threadId ? <IconButton icon="chat-bubble-outline" label="Message patient" onPress={() => router.push({ pathname: '/inbox/[id]', params: { id: c.threadId! } })} /> : null}
              <IconButton icon="more-horiz" label="Case options" onPress={more} />
            </View>
          }
        />
      }
      footer={
        done ? (
          <Button label="Edit assessment" variant="secondary" onPress={() => router.push({ pathname: '/assess/[id]', params: { id: c.id } })} />
        ) : (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Agree with AI" variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/assess/[id]', params: { id: c.id, agree: '1' } })} />
            <Button label="Write assessment" style={{ flex: 1.3 }} onPress={() => router.push({ pathname: '/assess/[id]', params: { id: c.id } })} />
          </View>
        )
      }>
      {views.length > 1 ? <Segmented value={shown} onChange={setView} options={views} /> : null}
      <View style={{ height: 220, borderRadius: 24, overflow: 'hidden', backgroundColor: '#0E1A2E' }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {shown === 'map' ? (
          w ? <FaceMap zones={c.ai.zones} width={w} height={220} density={22} /> : null
        ) : shown === 'compare' ? (
          <PhotoCompare height={220} before={{ uri: first.uri, tone: first.tone, label: dayMonth(first.date) }} after={{ uri: last.uri, tone: last.tone, label: dayMonth(last.date) }} />
        ) : (
          <ScanPhoto uri={last.uri} tone={last.tone} label={dayMonth(last.date)} style={{ height: 220, borderRadius: 0 }} />
        )}
        {shown === 'map' && last ? <MapTag label={dayMonth(last.date)} level="Clear" style={{ left: 10, top: 10 }} /> : null}
      </View>
      {!c.photos.some((p) => p.uri) && c.photos.length ? (
        <Txt variant="caption" color="muted">
          No photo shared yet: photos stay on the patient&apos;s phone until they share one with you.
        </Txt>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Avatar name={c.patient.name} size={34} tone={c.patient.tone} />
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">
            {c.patient.name}
            {c.patient.age ? `, ${c.patient.age}` : ''}
            {c.patient.gender ? `, ${c.patient.gender.toLowerCase()}` : ''}
          </Txt>
          <Txt variant="caption" color="muted">
            {[c.patient.fitz ? `Type ${FITZ_ROMAN[c.patient.fitz - 1]}` : null, c.patient.type.toLowerCase(), c.patient.avoids.length ? `avoids ${c.patient.avoids.join(', ').toLowerCase()}` : null].filter(Boolean).join(', ')}
          </Txt>
        </View>
        {c.urgency === 'urgent' ? <StatusPill label="Urgent" tone="act" /> : null}
      </View>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt variant="bodyStrong">AI reading</Txt>
          <StatusPill label={`${c.ai.confidence}% confident`} tone="neutral" />
        </View>
        <Txt variant="small" color="secondary" style={{ marginTop: 4 }}>
          {c.ai.reading}
        </Txt>
        {c.flags?.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.sm }}>
            {c.flags.map((f) => (
              <StatusPill key={f} label={f} tone={c.urgency === 'urgent' ? 'act' : 'watch'} />
            ))}
          </View>
        ) : null}
      </Card>
      <View style={{ borderLeftWidth: 3, borderLeftColor: colors.clinicianWash, paddingLeft: space.md }}>
        <Txt variant="body" color="secondary" style={{ fontStyle: 'italic' }}>
          &ldquo;{c.complaint}&rdquo;
        </Txt>
      </View>
      {c.assessment ? (
        <View style={{ gap: space.sm }}>
          <Txt variant="heading">Your assessment</Txt>
          <DoctorNote name={state.session?.name ?? 'Dr.'} text={c.assessment.note} at={c.assessment.sentAt} clinician note={{ stop: c.assessment.stop, keep: c.assessment.keep, changes: c.assessment.changes, rescanWeeks: c.assessment.rescanWeeks }} />
        </View>
      ) : null}
      {sheet}
    </Screen>
  );
}
