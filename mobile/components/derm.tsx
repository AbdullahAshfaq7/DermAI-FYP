import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Avatar, StatusPill, Txt } from '@/components/ui/kit';
import type { Case, Urgency } from '@/data/types';
import { ageSince } from '@/lib/format';
import { concernScale } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

export const URGENCY_COLOR: Record<Urgency, string> = {
  urgent: concernScale.High,
  high: concernScale.Moderate,
  moderate: concernScale.Mild,
  mild: concernScale.Clear,
};

export const URGENCY_RANK: Record<Urgency, number> = { urgent: 0, high: 1, moderate: 2, mild: 3 };

export function shortPatient(name: string): string {
  const [first, last] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
}

/** Why a case is flagged, in one line: "Mole changed shape. Flagged: changed shape or colour." */
export function flagLine(c: Case): string {
  const flags = (c.flags ?? []).filter((f) => !f.startsWith('AI:'));
  const ai = (c.flags ?? []).find((f) => f.startsWith('AI:'));
  const parts = [c.complaint.replace(/\.$/, '')];
  if (flags.length) parts.push(`Flagged: ${flags.join(', ')}`);
  else if (ai) parts.push(ai.replace('AI:', 'AI:'));
  return `${parts.join('. ')}.`;
}

/** Case row: the bar shows urgency, and the row says why it was flagged (H2). */
export function CaseRow({ c, detail = 'complaint', avatar }: { c: Case; detail?: 'complaint' | 'summary'; avatar?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/case/[id]', params: { id: c.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${c.patient.name}${c.patient.age ? `, ${c.patient.age}` : ''}. ${flagLine(c)} ${c.urgency === 'urgent' ? 'Urgent.' : ''}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingRight: space.md + 2, paddingLeft: space.md, backgroundColor: pressed ? colors.surfaceMuted : 'transparent' })}>
      <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 9, backgroundColor: URGENCY_COLOR[c.urgency] }} />
      {avatar ? <Avatar name={c.patient.name} size={30} tone={c.patient.tone} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.sm }}>
          <Txt variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {detail === 'summary' ? c.patient.name : shortPatient(c.patient.name)}
            {c.patient.age && detail !== 'summary' ? `, ${c.patient.age}` : ''}
          </Txt>
          {c.urgency === 'urgent' && c.status === 'waiting' && detail === 'summary' ? null : (
            <Txt variant="caption" color="muted">
              {ageSince(c.receivedAt)}
            </Txt>
          )}
        </View>
        <Txt variant="small" color="secondary" numberOfLines={2}>
          {detail === 'complaint' ? flagLine(c) : c.complaint}
        </Txt>
      </View>
      {c.urgency === 'urgent' && c.status === 'waiting' && detail === 'summary' ? <StatusPill label="Urgent" tone="act" /> : null}
    </Pressable>
  );
}
