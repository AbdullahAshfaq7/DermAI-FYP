import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { Bubble, ChatLayout, Composer } from '@/components/chat';
import { URGENCY_COLOR } from '@/components/derm';
import { Icon } from '@/components/ui/Icon';
import { Avatar, EmptyState, Screen, TopBar, Txt } from '@/components/ui/kit';
import { daysBetween, time, weekdayDayMonth } from '@/lib/format';
import { pickFromLibrary } from '@/lib/photos';
import { alertError } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** H7 thread: the doctor's side of E7, with a case panel. */
export default function DoctorInboxThread() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApp();
  const { sendMessage, markThreadRead } = useActions();
  const t = s.threads.find((x) => x.id === id);
  const c = s.derm.cases.find((x) => x.threadId === id);
  const visit = s.derm.visits.find((v) => v.kind === 'visit' && v.caseId === c?.id && v.status === 'upcoming');

  useEffect(() => {
    if (t?.unreadForDoctor) markThreadRead(t.id).catch(() => {});
  }, [t?.id, t?.unreadForDoctor, markThreadRead]);

  if (!t) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="chat" title="Conversation not found" body="It may have been archived." />
      </Screen>
    );
  }

  return (
    <ChatLayout
      header={
        <TopBar
          title={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'stretch' }}>
              <Avatar name={t.patientName} size={30} tone={c?.patient.tone ?? 3} />
              <View style={{ flex: 1 }}>
                <Txt variant="heading" numberOfLines={1}>
                  {t.patientName}
                </Txt>
                <Txt variant="caption" color="muted" numberOfLines={1}>
                  {c ? `${c.patient.age ? `${c.patient.age}, ` : ''}${c.patient.type.toLowerCase()} skin` : 'Patient'}
                </Txt>
              </View>
            </View>
          }
        />
      }
      footer={
        <Composer
          placeholder={`Message ${t.patientName.split(' ')[0]}`}
          clinician
          onSend={(text) => sendMessage(t.id, text)}
          onAttach={async () => {
            const uri = await pickFromLibrary().catch(() => null);
            if (uri) sendMessage(t.id, '', uri).catch((e) => alertError(e, "Couldn't send the photo"));
          }}
        />
      }>
      <Pressable
        disabled={!c}
        onPress={() => c && router.push({ pathname: '/case/[id]', params: { id: c.id } })}
        accessibilityRole={c ? 'button' : undefined}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.clinicianWash, borderRadius: 18, padding: space.md }}>
        <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 9, backgroundColor: c ? URGENCY_COLOR[c.urgency] : colors.clinician }} />
        <View style={{ flex: 1 }}>
          <Txt variant="smallStrong">
            {c?.number ? `Case ${c.number}, ` : 'Case: '}
            {t.caseTitle.toLowerCase()}
          </Txt>
          <Txt variant="caption" color="secondary">
            {t.sharedScans ? `${t.sharedScans} scan${t.sharedScans === 1 ? '' : 's'} shared` : 'No scans shared'}
            {visit ? `. Visit ${daysBetween(new Date(), visit.start) === 0 ? 'today' : weekdayDayMonth(visit.start)} ${time(visit.start)}.` : '.'}
          </Txt>
        </View>
        {c ? <Icon name="chevron-right" size={20} color={colors.clinicianDeep} /> : null}
      </Pressable>
      {t.messages.map((m) => (
        <Bubble key={m.id} msg={m} mine={m.from === 'doctor'} clinician doctorName={s.session?.name} />
      ))}
    </ChatLayout>
  );
}
