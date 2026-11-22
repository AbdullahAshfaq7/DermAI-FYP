import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, View } from 'react-native';

import { Bubble, ChatLayout, Composer, Typing } from '@/components/chat';
import { Avatar, Button, Chip, Disclaimer, IconButton, TopBar, Txt } from '@/components/ui/kit';
import { aiSuggestions } from '@/lib/ai';
import { doctorById, slotLabel } from '@/lib/selectors';
import { dayMonth } from '@/lib/format';
import { alertError, attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** A red-flag reply ends with a real open slot (E2), or a way to find one. */
function Referral({ suggest, scanDate }: { suggest: { doctorId: string; doctorName: string; start: string; service: 'video' | 'clinic' | 'message' } | null; scanDate: string | null }) {
  const { colors } = useTheme();
  const state = useApp();
  const doc = suggest ? doctorById(state, suggest.doctorId) : undefined;
  if (!suggest) {
    return (
      <View style={{ alignSelf: 'flex-start', maxWidth: '90%', backgroundColor: colors.clinicianWash, borderRadius: radius.card, padding: space.md, gap: space.sm }}>
        <Txt variant="smallStrong" color="clinician">
          {scanDate ? `Send your ${scanDate} scan to a dermatologist?` : 'Talk to a dermatologist about this?'}
        </Txt>
        <Button label="Find a dermatologist" variant="clinician" compact onPress={() => router.push({ pathname: '/doctors', params: { share: '1' } })} />
      </View>
    );
  }
  return (
    <View style={{ alignSelf: 'flex-start', maxWidth: '90%', backgroundColor: colors.clinicianWash, borderRadius: radius.card, padding: space.md, gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Avatar name={suggest.doctorName} size={30} tone={doc?.tone ?? 3} uri={doc?.photoUrl} />
        <View style={{ flex: 1 }}>
          <Txt variant="smallStrong">{suggest.doctorName}</Txt>
          <Txt variant="caption" color="secondary">
            Free {slotLabel(suggest.start).replace(/^Today/, 'today').replace(/^Tomorrow/, 'tomorrow')}, {suggest.service}
          </Txt>
        </View>
      </View>
      <Button
        label="Book this slot"
        variant="clinician"
        compact
        onPress={() => router.push({ pathname: '/book/[id]', params: { id: suggest.doctorId, service: suggest.service, start: suggest.start } })}
      />
    </View>
  );
}

/** E2 AI chat: starts from questions about your latest scan; red flags end with a real slot. */
export default function AiChat() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const state = useApp();
  const { askAi, clearAi } = useActions();
  const asked = useRef(false);
  const chat = state.aiChat;
  const scan = state.scans[0];
  const waiting = chat.length > 0 && chat[chat.length - 1].from === 'patient' && !!chat[chat.length - 1].pending;

  useEffect(() => {
    if (q && !asked.current) {
      asked.current = true;
      askAi(q).catch((e) => alertError(e, "DermAI couldn't answer"));
      // Clear it so a remount (back navigation, reload) doesn't ask again.
      router.setParams({ q: undefined });
    }
  }, [q, askAi]);

  return (
    <ChatLayout
      header={
        <TopBar
          title={
            <View style={{ alignItems: 'center' }}>
              <Txt variant="heading">DermAI</Txt>
              <Txt variant="caption" color="muted">
                {scan ? `Using your ${dayMonth(scan.date)} scan` : 'No scan yet'}
              </Txt>
            </View>
          }
          right={
            <IconButton
              icon="more-horiz"
              label="Chat options"
              onPress={() =>
                Alert.alert('Ask DermAI', undefined, [
                  { text: 'Clear conversation', style: 'destructive', onPress: () => attempt(clearAi(), "Couldn't clear the chat") },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
            />
          }
        />
      }
      footer={
        <>
          <Composer placeholder="Ask about your skin" onSend={askAi} />
          <Disclaimer />
        </>
      }>
      {chat.length === 0 ? (
        <View style={{ gap: space.md, paddingVertical: space.lg }}>
          <Txt variant="title">How can I help?</Txt>
          <Txt variant="body" color="secondary">
            {scan ? `I can see your ${dayMonth(scan.date)} scan and skin profile.` : 'Take a scan and I can tailor answers to your skin.'} Ask about a concern, an ingredient or your routine.
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {aiSuggestions(scan).map((s) => (
              <Chip key={s} label={s} tone="tag" onPress={() => askAi(s).catch((e) => alertError(e, "DermAI couldn't answer"))} />
            ))}
          </View>
        </View>
      ) : null}
      {chat.map((m) => (
        <View key={m.id} style={{ gap: space.sm }}>
          <Bubble msg={m} mine={m.from === 'patient'} />
          {m.referral ? <Referral suggest={m.suggest ?? null} scanDate={scan ? dayMonth(scan.date) : null} /> : null}
        </View>
      ))}
      {waiting ? <Typing /> : null}
    </ChatLayout>
  );
}
