import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { finishProfileSetup, SetupHeader } from '@/components/SetupHeader';
import { AvoidPicker } from '@/components/AvoidPicker';
import { Button, OptionCard, Screen, Txt } from '@/components/ui/kit';
import { back } from '@/lib/nav';
import { useApp, useStore } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const CURRENT = ['Nothing regular', 'Cleanser and moisturiser', 'Three or more products'];

/** B3 Allergies and routine, then straight to the first scan (C1). */
export default function Allergies() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { profile } = useApp();
  const { update } = useStore();
  const [avoid, setAvoid] = useState<string[]>(profile.avoid);
  const [current, setCurrent] = useState<string | null>(profile.current);

  const finish = () => {
    update((s) => ({ ...s, profile: { ...s.profile, avoid, current, done: true } }));
    if (edit) back();
    else finishProfileSetup();
  };

  return (
    <Screen
      keyboard
      header={
        <SetupHeader
          step={3}
          editing={!!edit}
          onSkip={() => {
            update((s) => ({ ...s, profile: { ...s.profile, done: true } }));
            finishProfileSetup();
          }}
        />
      }
      footer={<Button label={edit ? 'Save' : 'Finish profile'} onPress={finish} />}>
      <Txt variant="title">Anything your skin reacts to?</Txt>
      <Txt variant="body" color="secondary">
        We&apos;ll keep these out of every routine.
      </Txt>
      <AvoidPicker value={avoid} onChange={setAvoid} />
      <Txt variant="title" style={{ marginTop: space.sm }}>
        What do you use now?
      </Txt>
      <View style={{ gap: space.sm }}>
        {CURRENT.map((c) => (
          <OptionCard key={c} title={c} selected={current === c} onPress={() => setCurrent(c)} />
        ))}
      </View>
    </Screen>
  );
}
