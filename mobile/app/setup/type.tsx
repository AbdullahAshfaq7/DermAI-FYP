import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { SetupHeader } from '@/components/SetupHeader';
import { Button, Chip, ErrorBanner, OptionCard, Screen, Txt } from '@/components/ui/kit';
import { CONCERN_ORDER, CONCERNS } from '@/data/seed';
import type { ConcernKey, SkinType } from '@/data/types';
import { back } from '@/lib/nav';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const FEELS: { type: SkinType; feel: string }[] = [
  { type: 'Dry', feel: 'Tight, sometimes flaky' },
  { type: 'Oily', feel: 'Shiny all over' },
  { type: 'Combination', feel: 'Shiny T-zone, normal cheeks' },
  { type: 'Normal', feel: 'Comfortable' },
];
const LABEL: Record<string, string> = { pores: 'Large pores' };

/** Storyboard shows "Fine lines" too; it isn't one of the six scored concerns yet, so it's kept in profile.otherConcerns. */
const EXTRA = 'Fine lines';

/** B2 Skin type and concerns: described by feel, labelled by type. */
export default function SkinTypeStep() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { profile } = useApp();
  const { updateProfile } = useActions();
  const { busy, error, run } = useSubmit();
  const [feel, setFeel] = useState<SkinType | null>(profile.feel);
  const [concerns, setConcerns] = useState<string[]>([...profile.concerns, ...(profile.otherConcerns ?? [])]);

  const toggle = (k: string) => setConcerns((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));
  const save = async () => {
    const scored = concerns.filter((c): c is ConcernKey => (CONCERN_ORDER as string[]).includes(c));
    const other = concerns.filter((c) => !(CONCERN_ORDER as string[]).includes(c));
    if ((await run(() => updateProfile({ feel, concerns: scored, otherConcerns: other }))) === undefined) return;
    if (edit) back();
    else router.push('/setup/allergies');
  };

  return (
    <Screen
      header={<SetupHeader step={2} editing={!!edit} />}
      footer={<Button label={edit ? 'Save' : 'Continue'} disabled={!feel} loading={busy} onPress={() => void save()} />}>
      <Txt variant="title" style={{ fontSize: 25, lineHeight: 28 }}>How does your skin feel by midday?</Txt>
      <ErrorBanner error={error} />
      <View style={{ gap: space.sm }}>
        {FEELS.map((f) => (
          <OptionCard key={f.type} title={f.feel} subtitle={f.type} selected={feel === f.type} onPress={() => setFeel(f.type)} />
        ))}
      </View>
      <Txt variant="heading" style={{ marginTop: space.sm }}>
        What bothers you most?
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {CONCERN_ORDER.map((k) => (
          <Chip key={k} label={LABEL[k] ?? CONCERNS[k].label} selected={concerns.includes(k)} onPress={() => toggle(k)} />
        ))}
        <Chip label="Fine lines" selected={concerns.includes(EXTRA)} onPress={() => toggle(EXTRA)} />
      </View>
    </Screen>
  );
}
