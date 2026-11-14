import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';

import { shortPatient } from '@/components/derm';
import { Button, Chip, EmptyState, Field, Screen, Segmented, TopBar, Txt } from '@/components/ui/kit';
import { FINDING_SUGGESTIONS } from '@/data/seed';
import type { Assessment } from '@/data/types';
import { firstName } from '@/lib/format';
import { useActions, useStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space, type } from '@/theme/tokens';

function ChangeList({ label, items, onChange }: { label: 'Stop' | 'Keep'; items: string[]; onChange: (v: string[]) => void }) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');
  const add = () => {
    if (draft.trim()) onChange([...items, draft.trim()]);
    setDraft('');
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' }}>
      <Txt variant="smallStrong" color={label === 'Stop' ? 'act' : 'good'} style={{ width: 40 }}>
        {label}
      </Txt>
      {items.map((x) => (
        <Chip key={x} label={x} tone="clinician" onRemove={() => onChange(items.filter((y) => y !== x))} />
      ))}
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        onBlur={add}
        placeholder="+ Add"
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={`Add to ${label.toLowerCase()} list`}
        returnKeyType="done"
        style={[type.small, { minWidth: 70, color: colors.textPrimary, paddingVertical: 6 }]}
      />
    </View>
  );
}

/** H4 Write assessment: the doctor's verdict on the AI improves the model. */
export default function Assess() {
  const { colors } = useTheme();
  const { id, agree } = useLocalSearchParams<{ id: string; agree?: string }>();
  const { state } = useStore();
  const { saveDraft, sendAssessment } = useActions();
  const c = state.derm.cases.find((x) => x.id === id);
  const start: Assessment = c?.assessment ??
    c?.draft ?? {
      findings: agree && c ? [c.ai.reading.split('.')[0]] : [],
      aiRating: agree ? 'correct' : 'partly',
      note: '',
      stop: [],
      keep: [],
    };
  const [a, setA] = useState<Assessment>(start);
  const [saved, setSaved] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (c) saveDraft(c.id, a);
      setSaved(true);
    }, 600);
    setSaved(false);
    return () => clearTimeout(t);
  }, [a, c, saveDraft]);

  if (!c) {
    return (
      <Screen edges={[]} header={<TopBar left="close" />}>
        <EmptyState icon="folder-open" title="Case not found" body="It may have been closed." />
      </Screen>
    );
  }

  const patient = firstName(c.patient.name);
  const unused = FINDING_SUGGESTIONS.filter((f) => !a.findings.includes(f));

  return (
    <Screen
      edges={[]}
      keyboard
      header={
        <TopBar
          left="close"
          title="Assessment"
          right={
            saved ? (
              <Txt variant="caption" color="muted">
                Draft saved
              </Txt>
            ) : null
          }
        />
      }
      footer={
        <Button
          label={`Send to ${patient}`}
          variant="clinician"
          disabled={!a.note.trim() || a.findings.length === 0}
          onPress={() => {
            sendAssessment(c.id, a);
            router.back();
            Alert.alert('Sent', `${patient} will see your note and any routine changes in their app.`);
          }}
        />
      }>
      <Txt variant="heading">Your finding</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {a.findings.map((f) => (
          <Chip key={f} label={f} tone="clinician" selected onRemove={() => setA({ ...a, findings: a.findings.filter((x) => x !== f) })} />
        ))}
        <Chip
          label="Add"
          icon="add"
          tone="clinician"
          onPress={() =>
            Alert.alert('Add a finding', undefined, [
              ...unused.slice(0, 6).map((f) => ({ text: f, onPress: () => setA((x) => ({ ...x, findings: [...x.findings, f] })) })),
              { text: 'Cancel', style: 'cancel' as const },
            ])
          }
        />
      </View>
      <Txt variant="heading">AI reading</Txt>
      <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.control, padding: space.md }}>
        <Txt variant="small" color="secondary">
          {c.ai.reading}
        </Txt>
      </View>
      <Segmented
        value={a.aiRating}
        onChange={(v) => setA({ ...a, aiRating: v })}
        options={[
          { value: 'correct', label: 'Correct' },
          { value: 'partly', label: 'Partly' },
          { value: 'wrong', label: 'Wrong' },
        ]}
      />
      <Txt variant="caption" color="muted">
        Your rating is stored as a label for retraining, only for patients who opted in.
      </Txt>
      <Field label={`Note to ${patient}`} value={a.note} onChangeText={(v) => setA({ ...a, note: v })} multiline placeholder="What you see, what to change, and what happens next." />
      <Txt variant="heading">Routine changes</Txt>
      <View style={{ gap: space.md }}>
        <ChangeList label="Stop" items={a.stop} onChange={(stop) => setA({ ...a, stop })} />
        <ChangeList label="Keep" items={a.keep} onChange={(keep) => setA({ ...a, keep })} />
      </View>
      <Txt variant="caption" color="muted">
        Sent to {shortPatient(c.patient.name)} with your name. They can reply in Messages.
      </Txt>
    </Screen>
  );
}
