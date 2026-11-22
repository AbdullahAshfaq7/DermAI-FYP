import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Alert, View } from 'react-native';

import { Bubble, ChatLayout, Composer } from '@/components/chat';
import { Icon } from '@/components/ui/Icon';
import { Avatar, EmptyState, IconButton, Screen, TopBar, Txt } from '@/components/ui/kit';
import { hrs } from '@/lib/format';
import { pickFromLibrary } from '@/lib/photos';
import { doctorById } from '@/lib/selectors';
import { alertError } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** E7 Doctor chat: tied to a case; doctor notes stand out. */
export default function DoctorThread() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApp();
  const { sendMessage, markThreadRead } = useActions();
  const t = s.threads.find((x) => x.id === id);
  const d = doctorById(s, t?.doctorId);
  const doctorName = d?.name ?? 'Your doctor';

  useEffect(() => {
    if (t?.unreadForPatient) markThreadRead(t.id).catch(() => {});
  }, [t?.id, t?.unreadForPatient, markThreadRead]);

  if (!t) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="forum" title="Conversation not found" body="Book a visit or case review to message a dermatologist." />
      </Screen>
    );
  }

  const appt = s.appointments.find((a) => a.doctorId === t.doctorId && a.status === 'upcoming' && a.service === 'video');
  const replyHours = d?.replyHours ?? 24;

  return (
    <ChatLayout
      header={
        <TopBar
          title={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'stretch' }}>
              <Avatar name={doctorName} size={30} tone={d?.tone ?? 3} uri={d?.photoUrl} />
              <View style={{ flex: 1 }}>
                <Txt variant="heading" numberOfLines={1}>
                  {doctorName}
                </Txt>
                <Txt variant="caption" color="muted" numberOfLines={1}>
                  {d ? `${t.caseTitle}${t.caseNumber ? `, case ${t.caseNumber}` : ''}` : 'No longer on DermAI'}
                </Txt>
              </View>
            </View>
          }
          right={
            d && d.services.some((x) => x.type === 'video') ? (
              <IconButton
                icon="videocam"
                label="Video visit"
                onPress={() =>
                  appt
                    ? Alert.alert('Video visit', 'In-app video calls are coming soon. Your visit is still booked; message your doctor here to arrange the call.')
                    : router.push({ pathname: '/book/[id]', params: { id: d.id, service: 'video' } })
                }
              />
            ) : null
          }
        />
      }
      footer={
        <Composer
          placeholder="Message"
          onSend={d ? (text) => sendMessage(t.id, text) : () => alertError(new Error(), "This doctor is no longer on DermAI")}
          onAttach={async () => {
            const uri = await pickFromLibrary().catch(() => null);
            if (uri) sendMessage(t.id, '', uri).catch((e) => alertError(e, "Couldn't send the photo"));
          }}
        />
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surfaceMuted, borderRadius: 99, paddingVertical: space.sm, paddingHorizontal: space.md }}>
        <Icon name="photo-library" size={18} color={colors.textSecondary} />
        <Txt variant="small" color="secondary">
          Case: {t.caseTitle.toLowerCase()} · {t.sharedScans} scan{t.sharedScans === 1 ? '' : 's'} shared
        </Txt>
      </View>
      {t.messages.length === 0 ? (
        <Txt variant="small" color="secondary" align="center">
          Say hello and describe what you&apos;re noticing. Replies usually come within {hrs(replyHours)}.
        </Txt>
      ) : null}
      {t.messages.map((m) => (
        <Bubble key={m.id} msg={m} mine={m.from === 'patient'} doctorName={doctorName} />
      ))}
    </ChatLayout>
  );
}
