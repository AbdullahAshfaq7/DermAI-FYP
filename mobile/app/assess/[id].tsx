import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Switch, View } from 'react-native';

import { shortPatient } from '@/components/derm';
import { usePicker } from '@/components/PickerSheet';
import { Icon } from '@/components/ui/Icon';
import { Button, Chip, EmptyState, ErrorBanner, Field, IconButton, IconTile, List, Row, Screen, Segmented, TopBar, Txt } from '@/components/ui/kit';
import { FINDING_SUGGESTIONS } from '@/data/seed';
import type { Assessment, RxChange } from '@/data/types';
import { firstName } from '@/lib/format';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const RATING = { correct: 'Agree', partly: 'Partly', wrong: 'Disagree' } as const;

/** H4 Write assessment: finding, verdict on the AI (training data), note, and routine changes. */
export default function Assess() {
  const { colors } = useTheme();
  const { id, agree } = useLocalSearchParams<{ id: string; agree?: string }>();
  const state = useApp();
  const { saveDraft, sendAssessment } = useActions();
  const { busy, error, run } = useSubmit();
  const [sheet, pick] = usePicker();
  const c = state.derm.cases.find((x) => x.id === id);
  const start: Assessment = c?.draft ??
    c?.assessment ?? {
      findings: agree && c ? [c.ai.reading.split('.')[0]] : [],
      aiRating: agree ? 'correct' : 'partly',
      note: '',
      stop: [],
      keep: [],
      changes: [],
      rescanWeeks: null,
    };
  const [a, setA] = useState<Assessment>({ ...start, changes: start.changes ?? [], rescanWeeks: start.rescanWeeks ?? null });
  const [finding, setFinding] = useState(start.findings.join(', '));
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetail, setNewDetail] = useState('');
  const [newPeriod, setNewPeriod] = useState<'am' | 'pm'>('pm');
  const [draftState, setDraftState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const caseId = c?.id;
  const sent = useRef(false);
  const edited = useRef(false);

  const full = (): Assessment => ({ ...a, findings: finding.split(',').map((x) => x.trim()).filter(Boolean) });

  // Save a draft once the doctor stops typing. Only real edits trigger it (not server refreshes).
  useEffect(() => {
    if (!edited.current || !caseId) return;
    setDraftState('saving');
    const t = setTimeout(() => {
      if (sent.current) return;
      saveDraft(caseId, { ...a, findings: finding.split(',').map((x) => x.trim()).filter(Boolean) }).then(
        () => setDraftState('saved'),
        () => setDraftState('failed'),
      );
    }, 1200);
    return () => clearTimeout(t);
  }, [a, finding, caseId, saveDraft]);

  if (!c) {
    return (
      <Screen edges={[]} header={<TopBar left="close" />}>
        <EmptyState icon="folder-open" title="Case not found" body="It may have been closed." />
      </Screen>
    );
  }

  const change = (next: Assessment | ((x: Assessment) => Assessment)) => {
    edited.current = true;
    setA(next);
  };
  const setChanges = (fn: (x: RxChange[]) => RxChange[]) => change((x) => ({ ...x, changes: fn(x.changes ?? []) }));
  const patient = firstName(c.patient.name);
  const routine = (c.patient.routine ?? []).filter((r) => !(a.changes ?? []).some((x) => x.stepId === r.id));

  const addProduct = () => {
    if (newTitle.trim().length < 2) return;
    setChanges((x) => [...x, { action: 'add', title: newTitle.trim(), detail: newDetail.trim(), period: newPeriod }]);
    setNewTitle('');
    setNewDetail('');
    setAdding(false);
  };

  const pauseOrStop = () =>
    pick(
      `${patient}'s routine`,
      routine.map((r) => ({
        label: r.title,
        subtitle: `${r.period === 'am' ? 'Morning' : 'Evening'}${r.doctor ? ', added by you' : ''}`,
        onPress: () =>
          setTimeout(
            () =>
              pick(r.title, [
                ...(r.doctor ? [] : [1, 2, 4].map((w) => ({ label: `Pause for ${w} week${w === 1 ? '' : 's'}`, onPress: () => setChanges((x) => [...x, { action: 'pause' as const, stepId: r.id, title: r.title, weeks: w }]) }))),
                { label: 'Stop it', destructive: true, onPress: () => setChanges((x) => [...x, { action: 'stop' as const, stepId: r.id, title: r.title }]) },
              ]),
            350,
          ),
      })),
      routine.length ? undefined : 'No steps left to change.',
    );

  const send = async () => {
    sent.current = true;
    const r = await run(() => sendAssessment(c.id, full()));
    if (!r) {
      sent.current = false;
      return;
    }
    const n = (a.changes ?? []).length;
    router.back();
    Alert.alert('Sent', `${patient} will see your note in their app.${n ? ` Their routine changed (${n} step${n === 1 ? '' : 's'}).` : ''}${a.rescanWeeks ? ` They'll be asked for a new scan in ${a.rescanWeeks} weeks.` : ''}`);
  };

  return (
    <Screen
      edges={[]}
      keyboard
      header={
        <TopBar
          left="close"
          title="Assessment"
          right={
            draftState === 'idle' ? null : (
              <Txt variant="caption" color={draftState === 'failed' ? 'act' : 'muted'}>
                {draftState === 'saving' ? 'Saving…' : draftState === 'saved' ? 'Draft saved' : 'Not saved'}
              </Txt>
            )
          }
        />
      }
      footer={<Button label={`Send to ${patient}`} disabled={!a.note.trim() || !finding.trim()} loading={busy} onPress={() => void send()} />}>
      <ErrorBanner error={error} />
      <Field
        label="Your finding"
        value={finding}
        onChangeText={(v) => {
          edited.current = true;
          setFinding(v);
        }}
        placeholder="e.g. Inflamed acne, no cysts"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs + 2 }}>
        {FINDING_SUGGESTIONS.filter((f) => !finding.includes(f))
          .slice(0, 5)
          .map((f) => (
            <Chip
              key={f}
              label={f}
              icon="add"
              tone="clinician"
              onPress={() => {
                edited.current = true;
                setFinding((x) => (x.trim() ? `${x.trim()}, ${f}` : f));
              }}
            />
          ))}
      </View>
      <View style={{ gap: space.sm }}>
        <Txt variant="heading">Was the AI right?</Txt>
        <Txt variant="caption" color="muted">
          {c.ai.reading}
        </Txt>
        <Segmented
          value={a.aiRating}
          onChange={(v) => change((x) => ({ ...x, aiRating: v }))}
          options={(['correct', 'partly', 'wrong'] as const).map((v) => ({ value: v, label: RATING[v] }))}
        />
        <Txt variant="caption" color="muted">
          Your verdict goes back into training, only for patients who opted in.
        </Txt>
      </View>
      <Field label={`Note to ${patient}`} value={a.note} onChangeText={(v) => change((x) => ({ ...x, note: v }))} multiline placeholder="What you see, what to change, and what happens next." />
      <Txt variant="heading">Routine changes</Txt>
      {(a.changes ?? []).length ? (
        <List>
          {(a.changes ?? []).map((ch, i) => (
            <Row
              key={`${ch.action}-${ch.stepId ?? ch.title}-${i}`}
              leading={<IconTile icon={ch.action === 'add' ? 'add' : ch.action === 'pause' ? 'pause' : 'block'} tone={ch.action === 'add' ? 'clinician' : 'act'} size={34} />}
              title={ch.title}
              subtitle={ch.action === 'add' ? `${ch.detail || 'As directed'}, ${ch.period === 'am' ? 'morning' : 'evening'}` : ch.action === 'pause' ? `Pause for ${ch.weeks} week${ch.weeks === 1 ? '' : 's'}` : 'Stop'}
              right={<IconButton icon="close" label={`Remove change to ${ch.title}`} variant="plain" size={18} onPress={() => setChanges((x) => x.filter((_, j) => j !== i))} />}
            />
          ))}
        </List>
      ) : null}
      {adding ? (
        <View style={{ gap: space.sm }}>
          <Field label="Product or ingredient" value={newTitle} onChangeText={setNewTitle} placeholder="Adapalene 0.1%" />
          <Field label="How often" value={newDetail} onChangeText={setNewDetail} placeholder="Every other night" />
          <Segmented
            value={newPeriod}
            onChange={setNewPeriod}
            options={[
              { value: 'am', label: 'Morning' },
              { value: 'pm', label: 'Evening' },
            ]}
          />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Cancel" variant="secondary" compact style={{ flex: 1 }} onPress={() => setAdding(false)} />
            <Button label="Add to routine" compact style={{ flex: 1 }} disabled={newTitle.trim().length < 2} onPress={addProduct} />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="Add a product" icon="add" variant="soft" compact style={{ flex: 1 }} onPress={() => setAdding(true)} />
          <Button label="Pause or stop" icon="pause" variant="secondary" compact style={{ flex: 1 }} onPress={pauseOrStop} />
        </View>
      )}
      <Row
        icon="center-focus-strong"
        iconTone="clinician"
        title={a.rescanWeeks ? `Ask for a new scan in ${a.rescanWeeks} weeks` : 'Ask for a new scan'}
        subtitle={a.rescanWeeks ? 'Tap to change the timing' : 'Sets their scan reminder'}
        onPress={
          a.rescanWeeks
            ? () => pick('New scan in', [2, 4, 6, 8, 12].map((w) => ({ label: `${w} weeks`, selected: a.rescanWeeks === w, onPress: () => change((x) => ({ ...x, rescanWeeks: w })) })))
            : undefined
        }
        action={
          <Switch
            value={!!a.rescanWeeks}
            onValueChange={(v) => change((x) => ({ ...x, rescanWeeks: v ? 4 : null }))}
            accessibilityLabel="Ask for a new scan"
            trackColor={{ true: colors.brand, false: colors.border }}
            thumbColor="#FFFFFF"
          />
        }
      />
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
        <Icon name="info-outline" size={15} color={colors.textMuted} />
        <Txt variant="caption" color="muted" style={{ flex: 1 }}>
          Sent to {shortPatient(c.patient.name)} with your name. Changes appear in their routine straight away.
        </Txt>
      </View>
      {sheet}
    </Screen>
  );
}
