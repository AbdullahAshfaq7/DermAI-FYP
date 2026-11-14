import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { Bubble, ChatLayout, Composer } from '@/components/chat';
import { shortPatient } from '@/components/derm';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, Screen, TopBar, Txt } from '@/components/ui/kit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** H7 thread: the doctor's side of E7, with a case panel. */
export default function DoctorInboxThread() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApp();
  const { sendMessage, markThreadRead } = useActions();
  const t = s.threads.find((x) => x.id === id);
  const c = s.derm.cases.find((x) => x.threadId === id);

  useEffect(() => {
    if (t?.unreadForDoctor) markThreadRead(t.id, 'doctor');
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
      header={<TopBar title={shortPatient(t.patientName)} />}
      footer={<Composer placeholder="Message" clinician onSend={(text) => sendMessage(t.id, 'doctor', text)} />}>
      <Pressable
        disabled={!c}
        onPress={() => c && router.push({ pathname: '/case/[id]', params: { id: c.id } })}
        accessibilityRole={c ? 'button' : undefined}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.clinicianWash, borderRadius: radius.control, padding: space.md }}>
        <Icon name="folder-shared" size={18} color={colors.clinician} />
        <View style={{ flex: 1 }}>
          <Txt variant="smallStrong" color="clinician">
            Case: {t.caseTitle.toLowerCase()} · {t.sharedScans} scans shared
          </Txt>
          {c ? (
            <Txt variant="caption" color="clinician">
              AI: {c.ai.reading.split('.')[0]}
            </Txt>
          ) : null}
        </View>
        {c ? <Icon name="chevron-right" size={20} color={colors.clinician} /> : null}
      </Pressable>
      {t.messages.map((m) => (
        <Bubble key={m.id} msg={m} mine={m.from === 'doctor'} clinician doctorName={s.session?.name} />
      ))}
    </ChatLayout>
  );
}
