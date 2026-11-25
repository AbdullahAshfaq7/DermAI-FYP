import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ADVANCE_MS, QUIZ_STEPS, SetupHeader } from '@/components/SetupHeader';
import type { IconName } from '@/components/ui/Icon';
import { ErrorBanner, OptionCard, Screen, Txt } from '@/components/ui/kit';
import type { SkinType } from '@/data/types';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const FEELS: { type: SkinType; feel: string; icon: IconName }[] = [
  { type: 'Dry', feel: 'Tight, sometimes flaky', icon: 'water-drop' },
  { type: 'Oily', feel: 'Shiny all over', icon: 'auto-awesome' },
  { type: 'Combination', feel: 'Shiny T-zone, normal cheeks', icon: 'contrast' },
  { type: 'Normal', feel: 'Comfortable', icon: 'sentiment-satisfied' },
];

/** B2 Quiz: skin type, described by feel. One tap saves and moves on. Concerns come from the scan. */
export default function SkinFeel() {
  const { profile } = useApp();
  const { updateProfile } = useActions();
  const { busy, error, run } = useSubmit();
  const [feel, setFeel] = useState<SkinType | null>(profile.feel);

  const pick = (type: SkinType) => {
    setFeel(type);
    if (busy) return;
    setTimeout(async () => {
      if ((await run(() => updateProfile({ feel: type }))) === undefined) return;
      router.push('/setup/reacts');
    }, ADVANCE_MS);
  };

  return (
    <Screen edges={['top']} header={<SetupHeader step={2} total={QUIZ_STEPS} />}>
      <Txt variant="display">How does your skin feel by midday?</Txt>
      <Txt variant="body" color="secondary">
        Pick the closest. You can change it later.
      </Txt>
      <ErrorBanner error={error} />
      <View style={{ gap: space.sm }}>
        {FEELS.map((f) => (
          <OptionCard key={f.type} icon={f.icon} title={f.feel} subtitle={f.type} selected={feel === f.type} onPress={() => pick(f.type)} />
        ))}
      </View>
    </Screen>
  );
}
