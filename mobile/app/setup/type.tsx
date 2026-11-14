import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { SetupHeader } from '@/components/SetupHeader';
import { Button, Chip, OptionCard, Screen, Txt } from '@/components/ui/kit';
import { CONCERN_ORDER, CONCERNS } from '@/data/seed';
import type { ConcernKey, SkinType } from '@/data/types';
import { back } from '@/lib/nav';
import { useApp, useStore } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const FEELS: { type: SkinType; feel: string }[] = [
  { type: 'Oily', feel: 'Shiny all over' },
  { type: 'Combination', feel: 'Shiny forehead and nose, dry cheeks' },
  { type: 'Dry', feel: 'Tight or flaky' },
  { type: 'Normal', feel: 'Comfortable' },
];

/** Storyboard shows "Fine lines" too; it isn't one of the six scored concerns yet, so it's kept as a profile-only choice. */
const EXTRA = 'fineLines';

/** B2 Skin type and concerns: described by feel, labelled by type. */
export default function SkinTypeStep() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { profile } = useApp();
  const { update } = useStore();
  const [feel, setFeel] = useState<SkinType | null>(profile.feel);
  const [concerns, setConcerns] = useState<string[]>(profile.concerns);

  const toggle = (k: string) => setConcerns((c) => (c.includes(k) ? c.filter((x) => x !== k) : [...c, k]));
  const save = () => {
    update((s) => ({ ...s, profile: { ...s.profile, feel, concerns: concerns.filter((c) => c !== EXTRA) as ConcernKey[] } }));
    if (edit) back();
    else router.push('/setup/allergies');
  };

  return (
    <Screen
      header={<SetupHeader step={2} editing={!!edit} onSkip={() => router.push('/setup/allergies')} />}
      footer={<Button label={edit ? 'Save' : 'Next'} disabled={!feel} onPress={save} />}>
      <Txt variant="title">How does your skin feel by midday?</Txt>
      <View style={{ gap: space.sm }}>
        {FEELS.map((f) => (
          <OptionCard key={f.type} title={f.feel} subtitle={f.type} selected={feel === f.type} onPress={() => setFeel(f.type)} />
        ))}
      </View>
      <Txt variant="title" style={{ marginTop: space.sm }}>
        What bothers you most?
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {CONCERN_ORDER.filter((k) => k !== 'sensitivity').map((k) => (
          <Chip key={k} label={CONCERNS[k].label} selected={concerns.includes(k)} onPress={() => toggle(k)} />
        ))}
        <Chip label="Fine lines" selected={concerns.includes(EXTRA)} onPress={() => toggle(EXTRA)} />
      </View>
    </Screen>
  );
}
