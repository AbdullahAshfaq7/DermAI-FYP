import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, View } from 'react-native';

import { Bubble, ChatLayout, Composer } from '@/components/chat';
import { Icon } from '@/components/ui/Icon';
import { EmptyState, IconButton, Screen, TopBar, Txt } from '@/components/ui/kit';
import { DOCTORS } from '@/data/seed';
import { pickFromLibrary } from '@/lib/photos';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** E7 Doctor chat: tied to a case; doctor notes stand out. */
export default function DoctorThread() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApp();
  const { sendMessage, markThreadRead } = useActions();
  const t = s.threads.find((x) => x.id === id);
  const d = DOCTORS.find((x) => x.id === t?.doctorId);

  useEffect(() => {
    if (t?.unreadForPatient) markThreadRead(t.id, 'patient');
  }, [t?.id, t?.unreadForPatient, markThreadRead]);

  if (!t || !d) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="forum" title="Conversation not found" body="Book a visit or case review to message a dermatologist." />
      </Screen>
    );
  }

  const appt = s.appointments.find((a) => a.doctorId === d.id && a.status === 'upcoming' && a.service === 'video');

  return (
    <ChatLayout
      header={
        <TopBar
          title={
            <View style={{ alignItems: 'center' }}>
              <Txt variant="heading">{d.name}</Txt>
              <Txt variant="caption" color="secondary">
                Usually replies in {d.replyHours} hrs
              </Txt>
            </View>
          }
          right={
            <IconButton
              icon="videocam"
              label="Video visit"
              onPress={() =>
                appt
                  ? Alert.alert('Video visit', 'The call opens here at the visit time. Video isn\'t connected in this build yet.')
                  : router.push({ pathname: '/book/[id]', params: { id: d.id, service: 'video' } })
              }
            />
          }
        />
      }
      footer={
        <Composer
          placeholder="Message"
          onSend={(text) => sendMessage(t.id, 'patient', text)}
          onAttach={async () => {
            const uri = await pickFromLibrary().catch(() => null);
            if (uri) sendMessage(t.id, 'patient', 'Sent 1 photo', uri);
          }}
        />
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surfaceMuted, borderRadius: radius.control, padding: space.md }}>
        <Icon name="photo-library" size={18} color={colors.textSecondary} />
        <Txt variant="small" color="secondary">
          Case: {t.caseTitle.toLowerCase()} · {t.sharedScans} scan{t.sharedScans === 1 ? '' : 's'} shared
        </Txt>
      </View>
      {t.messages.length === 0 ? (
        <Txt variant="small" color="secondary" align="center">
          Say hello and describe what you&apos;re noticing. {d.female ? 'She' : 'He'} usually replies within {d.replyHours} hours.
        </Txt>
      ) : null}
      {t.messages.map((m) => (
        <Bubble key={m.id} msg={m} mine={m.from === 'patient'} doctorName={d.name} />
      ))}
    </ChatLayout>
  );
}
