import * as Haptics from 'expo-haptics';
import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Txt } from '@/components/ui/kit';
import type { Message } from '@/data/types';
import { time } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, type } from '@/theme/tokens';

/** Patient bubbles are Ink on the right; AI and doctor are white with a border, on the left. */
export function Bubble({ msg, mine, doctorName, clinician }: { msg: Message; mine: boolean; doctorName?: string; clinician?: boolean }) {
  const { colors } = useTheme();
  const fill = mine ? (clinician ? colors.clinician : colors.ink) : colors.surface;
  const fg = mine ? (clinician ? colors.onFill : colors.onInk) : colors.textPrimary;
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: space.sm }}>
      <View
        style={{
          maxWidth: '86%',
          backgroundColor: fill,
          borderWidth: mine ? 0 : 1,
          borderColor: colors.border,
          borderRadius: radius.card,
          borderBottomRightRadius: mine ? 4 : radius.card,
          borderBottomLeftRadius: mine ? radius.card : 4,
          paddingHorizontal: space.md,
          paddingVertical: space.sm + 2,
          gap: 6,
        }}>
        {msg.attachment ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="image" size={18} color={fg} />
            <Txt variant="smallStrong" style={{ color: fg }}>
              Photo attached
            </Txt>
          </View>
        ) : null}
        {msg.text && !(msg.attachment && msg.text === 'Sent 1 photo') ? <Txt variant="body" style={{ color: fg }}>{msg.text}</Txt> : null}
      </View>
      {msg.note && (msg.note.stop.length || msg.note.keep.length) ? <DoctorNote name={doctorName ?? 'your doctor'} stop={msg.note.stop} keep={msg.note.keep} /> : null}
      <Txt variant="caption" color="muted">
        {time(msg.at)}
      </Txt>
    </View>
  );
}

export function DoctorNote({ name, stop, keep }: { name: string; stop: string[]; keep: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignSelf: 'stretch', backgroundColor: colors.clinicianWash, borderRadius: radius.card, padding: space.lg, gap: 4 }}>
      <Txt variant="smallStrong" color="clinician">
        Note from {name.replace(/^Dr\.\s+(\S+)\s+/, 'Dr. ')}
      </Txt>
      {stop.length ? (
        <Txt variant="small">
          <Txt variant="smallStrong">Stop: </Txt>
          {stop.join(', ').toLowerCase()}.
        </Txt>
      ) : null}
      {keep.length ? (
        <Txt variant="small">
          <Txt variant="smallStrong">Continue: </Txt>
          {keep.join(', ')}.
        </Txt>
      ) : null}
    </View>
  );
}

export function Composer({
  placeholder,
  onSend,
  onAttach,
  attachIcon = 'add-photo-alternate',
  clinician,
}: {
  placeholder: string;
  onSend: (text: string) => void;
  onAttach?: () => void;
  attachIcon?: IconName;
  clinician?: boolean;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const send = () => {
    const t = text.trim();
    if (!t) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(t);
    setText('');
  };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.sm }}>
      {onAttach ? (
        <Pressable onPress={onAttach} accessibilityRole="button" accessibilityLabel="Attach a photo" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={attachIcon} size={24} color={colors.textSecondary} />
        </Pressable>
      ) : null}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        accessibilityLabel={placeholder}
        style={[
          type.body,
          {
            flex: 1,
            maxHeight: 120,
            minHeight: 44,
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 22,
            paddingHorizontal: space.lg,
            paddingTop: 11,
            paddingBottom: 11,
          },
        ]}
      />
      <Pressable
        onPress={send}
        disabled={!text.trim()}
        accessibilityRole="button"
        accessibilityLabel="Send"
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: text.trim() ? (clinician ? colors.clinician : colors.ink) : colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon name="arrow-upward" size={22} color={text.trim() ? (clinician ? colors.onFill : colors.onInk) : colors.textMuted} />
      </Pressable>
    </View>
  );
}

/** Message list that sticks to the bottom, with a composer that rides above the keyboard. */
export function ChatLayout({ header, footer, children }: { header: ReactNode; footer: ReactNode; children: ReactNode }) {
  const { colors } = useTheme();
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {header}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ScrollView
          ref={ref}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: space.screen, gap: space.md }}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => ref.current?.scrollToEnd({ animated: true })}>
          {children}
        </ScrollView>
        <View style={{ paddingHorizontal: space.screen, paddingTop: space.sm, paddingBottom: space.sm, gap: space.sm, borderTopWidth: 1, borderTopColor: colors.hairline, backgroundColor: colors.bg }}>
          {footer}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export function Typing() {
  const { colors } = useTheme();
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingHorizontal: space.md, paddingVertical: space.sm }}>
      <Txt variant="small" color="muted">
        DermAI is typing…
      </Txt>
    </View>
  );
}
