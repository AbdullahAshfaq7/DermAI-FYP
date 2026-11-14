import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { StatusPill, Txt } from '@/components/ui/kit';
import { FITZ_ROMAN } from '@/data/seed';
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

/** Case row with a 4 pt urgency bar (design.md section 7). */
export function CaseRow({ c, detail = 'complaint' }: { c: Case; detail?: 'complaint' | 'summary' }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/case/[id]', params: { id: c.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${c.patient.name}, ${c.patient.age}. ${c.complaint}. ${c.urgency === 'urgent' ? 'Urgent.' : ''}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingRight: space.lg, paddingLeft: space.md, backgroundColor: pressed ? colors.surfaceMuted : 'transparent' })}>
      <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: URGENCY_COLOR[c.urgency] }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="bodyStrong">
          {shortPatient(c.patient.name)}, {c.patient.age}
          {detail === 'complaint' ? <Txt variant="small" color="secondary"> · Fitz. {FITZ_ROMAN[c.patient.fitz - 1]}</Txt> : null}
        </Txt>
        <Txt variant="small" color="secondary">
          {detail === 'complaint' ? c.complaint : c.summary}
        </Txt>
      </View>
      {c.urgency === 'urgent' && c.status === 'waiting' ? (
        <StatusPill label="Urgent" tone="act" />
      ) : (
        <Txt variant="small" color="secondary">
          {ageSince(c.receivedAt)}
        </Txt>
      )}
    </Pressable>
  );
}
