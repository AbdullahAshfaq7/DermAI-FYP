/** Building blocks shared by the admin portal screens. */
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Button, Card, Chip, ErrorBanner, Field, StatusPill, Txt, shadow, type PillTone } from '@/components/ui/kit';
import type { ApptStatus, CaseStatus, DermStatus } from '@/lib/admin';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, type } from '@/theme/tokens';

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const { colors } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderRadius: radius.control, paddingHorizontal: space.md, height: 46, borderWidth: 1.5, borderColor: colors.border }]}>
      <Icon name="search" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={placeholder}
        style={[type.body, { flex: 1, color: colors.textPrimary, paddingVertical: 0 }]}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} accessibilityRole="button" accessibilityLabel="Clear search" hitSlop={10}>
          <Icon name="close" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Filters<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }} style={{ flexGrow: 0 }}>
      {options.map((o) => (
        <Chip key={o.value} label={o.label} selected={value === o.value} onPress={() => onChange(o.value)} />
      ))}
    </ScrollView>
  );
}

/** Loading, error and empty states for an admin list. */
export function Loader({ loading, error, empty, onRetry, children }: { loading: boolean; error: string | null; empty?: ReactNode; onRetry: () => void; children?: ReactNode }) {
  if (error && !children) {
    return (
      <View style={{ gap: space.sm }}>
        <ErrorBanner error={error} />
        <Button variant="secondary" compact label="Try again" onPress={onRetry} />
      </View>
    );
  }
  if (loading && !children) {
    return (
      <View style={{ paddingVertical: space.xxl, alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <>
      {error ? <ErrorBanner error={error} /> : null}
      {children ?? empty}
    </>
  );
}

export function Tile({ icon, value, label, tone = 'muted', onPress }: { icon: IconName; value: string | number; label: string; tone?: 'muted' | 'act' | 'watch' | 'good'; onPress?: () => void }) {
  const { colors } = useTheme();
  const fg = { muted: colors.textPrimary, act: colors.act, watch: colors.watch, good: colors.good }[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [{ flexBasis: '47%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.card, padding: space.md, gap: 4, opacity: pressed ? 0.85 : 1 }, shadow(colors)]}>
      <Icon name={icon} size={20} color={colors.textMuted} />
      <Txt variant="title" style={{ color: fg }}>
        {String(value)}
      </Txt>
      <Txt variant="caption" color="secondary">
        {label}
      </Txt>
    </Pressable>
  );
}

export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md, paddingVertical: 6 }}>
      <Txt variant="small" color="secondary">
        {label}
      </Txt>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Txt variant="smallStrong" style={{ flexShrink: 1, textAlign: 'right' }}>
          {String(value) || '—'}
        </Txt>
      ) : (
        value
      )}
    </View>
  );
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <Card style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xs }}>
        <Txt variant="heading">{title}</Txt>
        {right}
      </View>
      {children}
    </Card>
  );
}

export function confirm(title: string, message: string, action: string, onConfirm: () => void, destructive = true) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

/**
 * A dialog with one text box (Alert.prompt is iOS-only). `required` keeps the button off until
 * something is typed; `secure` hides the text for passwords.
 */
export function usePrompt() {
  const { colors } = useTheme();
  const [spec, setSpec] = useState<{
    title: string;
    message?: string;
    label: string;
    action: string;
    required?: boolean;
    secure?: boolean;
    destructive?: boolean;
    onSubmit: (v: string) => Promise<unknown>;
  } | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = (s: NonNullable<typeof spec>) => {
    setValue('');
    setError(null);
    setSpec(s);
  };
  const close = () => {
    if (!busy) setSpec(null);
  };
  const submit = async () => {
    if (!spec) return;
    setBusy(true);
    setError(null);
    try {
      await spec.onSubmit(value.trim());
      setSpec(null);
    } catch (e) {
      setError((e as Error).message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const node = (
    <Modal visible={!!spec} transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(5,10,20,0.72)', justifyContent: 'center', padding: space.screen }}>
        <Pressable onPress={() => {}} style={[{ backgroundColor: colors.surface, borderRadius: radius.sheet, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: colors.border }, shadow(colors, true)]}>
          <Txt variant="title">{spec?.title ?? ''}</Txt>
          {spec?.message ? (
            <Txt variant="small" color="secondary">
              {spec.message}
            </Txt>
          ) : null}
          <ErrorBanner error={error} />
          <Field label={spec?.label ?? ''} value={value} onChangeText={setValue} secure={spec?.secure} autoCapitalize={spec?.secure ? 'none' : 'sentences'} multiline={!spec?.secure} />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button variant="secondary" label="Cancel" onPress={close} style={{ flex: 1 }} disabled={busy} />
            <Button
              variant={spec?.destructive ? 'destructive' : 'ink'}
              label={spec?.action ?? 'OK'}
              onPress={() => void submit()}
              loading={busy}
              disabled={spec?.required && !value.trim()}
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
  return [node, open] as const;
}

export function dermTone(s: DermStatus): PillTone {
  return s === 'approved' ? 'good' : s === 'pending' ? 'watch' : s === 'rejected' ? 'act' : 'neutral';
}
export function apptTone(s: ApptStatus): PillTone {
  return s === 'upcoming' ? 'brand' : s === 'done' ? 'good' : 'neutral';
}
export function caseTone(s: CaseStatus): PillTone {
  return s === 'waiting' ? 'watch' : s === 'replied' ? 'good' : 'neutral';
}
export function urgencyTone(u: string): PillTone {
  return u === 'urgent' ? 'act' : u === 'moderate' ? 'watch' : 'neutral';
}
export function payTone(s: string): PillTone {
  return s === 'paid' ? 'good' : s === 'refunded' ? 'butter' : 'neutral';
}

export const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

export function Pill({ label, tone }: { label: string; tone: PillTone }) {
  return <StatusPill label={label} tone={tone} />;
}
