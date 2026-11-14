import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, View } from 'react-native';

import { Bubble, ChatLayout, Composer, Typing } from '@/components/chat';
import { Icon } from '@/components/ui/Icon';
import { Button, Chip, Disclaimer, IconButton, TopBar, Txt } from '@/components/ui/kit';
import { AI_SUGGESTIONS } from '@/lib/ai';
import { dayMonth } from '@/lib/format';
import { useActions, useStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** E2 AI chat: knows the latest scan; flags red-flag symptoms. */
export default function AiChat() {
  const { colors } = useTheme();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { state, update } = useStore();
  const { askAi } = useActions();
  const asked = useRef(false);
  const chat = state.aiChat;
  const scan = state.scans[0];
  const waiting = chat.length > 0 && chat[chat.length - 1].from === 'patient';

  useEffect(() => {
    if (q && !asked.current) {
      asked.current = true;
      askAi(q);
      // Clear it so a remount (back navigation, reload) doesn't ask again.
      router.setParams({ q: undefined });
    }
  }, [q, askAi]);

  return (
    <ChatLayout
      header={
        <TopBar
          title="Ask DermAI"
          right={
            <IconButton
              icon="more-horiz"
              label="Chat options"
              onPress={() =>
                Alert.alert('Ask DermAI', undefined, [
                  { text: 'Clear conversation', style: 'destructive', onPress: () => update((s) => ({ ...s, aiChat: [] })) },
                  { text: 'Cancel', style: 'cancel' },
                ])
              }
            />
          }
        />
      }
      footer={
        <>
          <Composer placeholder="Message DermAI" onSend={askAi} />
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
            {AI_SUGGESTIONS.map((s) => (
              <Chip key={s} label={s} tone="tag" onPress={() => askAi(s)} />
            ))}
          </View>
        </View>
      ) : null}
      {chat.map((m) => (
        <View key={m.id} style={{ gap: space.sm }}>
          <Bubble msg={m} mine={m.from === 'patient'} />
          {m.referral ? (
            <View style={{ backgroundColor: colors.brandWash, borderRadius: radius.card, padding: space.lg, gap: space.md }}>
              <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
                <Icon name="stethoscope" size={22} color={colors.brandDeep} />
                <Txt variant="smallStrong" color="brandDeep" style={{ flex: 1 }}>
                  {scan ? `Send your ${dayMonth(scan.date)} scan to a dermatologist?` : 'Talk to a dermatologist about this?'}
                </Txt>
              </View>
              <Button label="Yes, find a dermatologist" compact onPress={() => router.push({ pathname: '/doctors', params: { share: '1' } })} />
            </View>
          ) : null}
        </View>
      ))}
      {waiting ? <Typing /> : null}
    </ChatLayout>
  );
}
