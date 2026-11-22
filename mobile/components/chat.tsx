import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { shadow, Txt } from '@/components/ui/kit';
import type { DoctorNote as DoctorNoteT, Message } from '@/data/types';
import { time } from '@/lib/format';
import { alertError } from '@/lib/useSubmit';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, type } from '@/theme/tokens';

/** Your bubbles are Lamp (Emerald for doctors) on the right; the other side is white, on the left. */
export function Bubble({ msg, mine, doctorName, clinician }: { msg: Message; mine: boolean; doctorName?: string; clinician?: boolean }) {
  const { colors } = useTheme();
  const fill = mine ? colors.brand : colors.surface;
  const fg = mine ? colors.onFill : colors.textPrimary;
  const noteOnly = msg.note && (msg.note.stop.length || msg.note.keep.length || msg.note.changes?.length);
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: space.xs + 2 }}>
      {noteOnly ? (
        <DoctorNote name={doctorName ?? 'your doctor'} title={mine ? 'Your note' : undefined} text={msg.text} note={msg.note!} at={msg.at} clinician={clinician} />
      ) : (
        <View
          style={[
            {
              maxWidth: '84%',
              backgroundColor: fill,
              borderRadius: 20,
              borderBottomRightRadius: mine ? 6 : 20,
              borderBottomLeftRadius: mine ? 20 : 6,
              paddingHorizontal: space.md + 1,
              paddingVertical: space.sm + 3,
              gap: 6,
            },
            !mine && shadow(colors),
          ]}>
          {msg.attachment && /^(https?|file|data|blob|content|ph):/.test(msg.attachment) ? (
            <Image source={{ uri: msg.attachment }} accessibilityLabel="Attached photo" style={{ width: 200, height: 240, borderRadius: 14, backgroundColor: colors.surfaceMuted }} contentFit="cover" />
          ) : msg.attachment ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="image" size={18} color={fg} />
              <Txt variant="smallStrong" style={{ color: fg }}>
                Photo attached
              </Txt>
            </View>
          ) : null}
          {msg.text && !(msg.attachment && /^Sent (1|a) photo$/.test(msg.text)) ? <Txt variant="body" style={{ color: fg }}>{msg.text}</Txt> : null}
        </View>
      )}
      {noteOnly ? null : (
        <Txt variant="caption" color="muted">
          {msg.pending ? 'Sending…' : time(msg.at)}
        </Txt>
      )}
    </View>
  );
}

/** A doctor's note stands apart from chat and can change the routine (E7). */
export function DoctorNote({ name, title, text, note, at, clinician, stop, keep }: { name: string; title?: string; text?: string; note?: DoctorNoteT; at?: string; clinician?: boolean; stop?: string[]; keep?: string[] }) {
  const { colors } = useTheme();
  const n: DoctorNoteT = note ?? { stop: stop ?? [], keep: keep ?? [] };
  const changes = n.changes ?? [];
  const changed = changes.length > 0 || n.stop.length > 0;
  const short = name.replace(/^Dr\.\s+(\S+)\s+/, 'Dr. ');
  return (
    <View style={[{ alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: 20, padding: space.md + 2, gap: 6, borderWidth: 1.5, borderColor: colors.clinicianWash }, shadow(colors)]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Icon name="assignment" size={18} color={colors.clinician} />
        <Txt variant="bodyStrong" style={{ flex: 1 }}>
          {title ?? `Note from ${short}`}
        </Txt>
        {at ? (
          <Txt variant="caption" color="muted">
            {time(at)}
          </Txt>
        ) : null}
      </View>
      {text ? (
        <Txt variant="small" color="secondary">
          {text}
        </Txt>
      ) : null}
      {changes.map((c, i) => (
        <View key={`${c.action}-${i}`} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <Icon name={c.action === 'add' ? 'add-circle-outline' : c.action === 'pause' ? 'pause-circle-outline' : 'remove-circle-outline'} size={16} color={c.action === 'add' ? colors.clinician : colors.actIcon} />
          <Txt variant="small" style={{ flex: 1 }}>
            <Txt variant="smallStrong">{c.action === 'add' ? 'Start' : c.action === 'pause' ? 'Pause' : 'Stop'} </Txt>
            {c.title}
            {c.action === 'add' && c.detail ? `, ${c.detail.toLowerCase()}` : c.action === 'pause' && c.weeks ? ` for ${c.weeks} week${c.weeks === 1 ? '' : 's'}` : ''}
          </Txt>
        </View>
      ))}
      {n.stop.length ? (
        <Txt variant="small">
          <Txt variant="smallStrong">Stop: </Txt>
          {n.stop.join(', ').toLowerCase()}.
        </Txt>
      ) : null}
      {n.keep.length ? (
        <Txt variant="small">
          <Txt variant="smallStrong">Keep: </Txt>
          {n.keep.join(', ')}.
        </Txt>
      ) : null}
      {n.rescanWeeks ? (
        <Txt variant="small" color="secondary">
          New scan in {n.rescanWeeks} week{n.rescanWeeks === 1 ? '' : 's'}.
        </Txt>
      ) : null}
      {changed && !clinician ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.clinicianWash, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Icon name="sync" size={13} color={colors.clinicianDeep} />
            <Txt variant="caption" color="clinician">
              Routine updated
            </Txt>
          </View>
          <View style={{ flex: 1 }} />
          <Txt variant="smallStrong" color="clinician" onPress={() => router.navigate('/routine')}>
            See changes
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

export function Composer({
  placeholder,
  onSend,
  onAttach,
  attachIcon = 'add-photo-alternate',
}: {
  placeholder: string;
  /** If the promise rejects, the text is put back so nothing is lost. */
  onSend: (text: string) => void | Promise<unknown>;
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
    setText('');
    const r = onSend(t);
    if (r instanceof Promise) {
      r.catch((e) => {
        setText((cur) => cur || t);
        alertError(e, "Couldn't send");
      });
    }
  };
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: space.xs, backgroundColor: colors.surface, borderRadius: 26, padding: 5, paddingLeft: onAttach ? 5 : space.lg }, shadow(colors)]}>
      {onAttach ? (
        <Pressable onPress={onAttach} accessibilityRole="button" accessibilityLabel="Attach a photo" style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={attachIcon} size={22} color={colors.textSecondary} />
        </Pressable>
      ) : null}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline
        accessibilityLabel={placeholder}
        style={[type.body, { flex: 1, maxHeight: 120, minHeight: 40, color: colors.textPrimary, paddingTop: 9, paddingBottom: 9 }]}
      />
      <Pressable
        onPress={send}
        disabled={!text.trim()}
        accessibilityRole="button"
        accessibilityLabel="Send"
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: text.trim() ? colors.brand : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="arrow-upward" size={21} color={text.trim() ? colors.onFill : colors.textMuted} />
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
        <View style={{ paddingHorizontal: space.screen, paddingTop: space.sm, paddingBottom: space.sm, gap: space.sm, backgroundColor: colors.bg }}>
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
