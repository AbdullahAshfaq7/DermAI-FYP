import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Chip, Field } from '@/components/ui/kit';
import { ALLERGEN_SUGGESTIONS } from '@/data/seed';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** Shared ingredient picker: B3 and F8 "Always avoid". */
export function AvoidPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const matches = q.trim()
    ? ALLERGEN_SUGGESTIONS.filter((a) => a.toLowerCase().includes(q.trim().toLowerCase()) && !value.includes(a))
    : [];
  const add = (a: string) => {
    if (!a.trim() || value.includes(a.trim())) return;
    onChange([...value, a.trim()]);
    setQ('');
  };
  return (
    <View style={{ gap: space.md }}>
      {value.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {value.map((a) => (
            <Chip key={a} label={a} tone="tag" onRemove={() => onChange(value.filter((x) => x !== a))} />
          ))}
        </View>
      ) : null}
      <Field
        label="Add an ingredient"
        value={q}
        onChangeText={setQ}
        placeholder="Search, e.g. retinol"
        right={<Icon name="search" size={20} color={colors.textMuted} />}
      />
      {matches.length || q.trim() ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {matches.slice(0, 5).map((m) => (
            <Chip key={m} label={m} icon="add" onPress={() => add(m)} />
          ))}
          {q.trim() && !ALLERGEN_SUGGESTIONS.some((a) => a.toLowerCase() === q.trim().toLowerCase()) ? (
            <Chip label={`Add "${q.trim()}"`} icon="add" onPress={() => add(q)} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
