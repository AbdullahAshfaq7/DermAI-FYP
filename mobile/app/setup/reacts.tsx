import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { QUIZ_STEPS, SetupHeader } from '@/components/SetupHeader';
import { Icon } from '@/components/ui/Icon';
import { Button, Chip, ErrorBanner, Field, Screen, Txt } from '@/components/ui/kit';
import { ALLERGEN_SUGGESTIONS } from '@/data/seed';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** B3 Quiz: ingredients to keep out of the routine. Quick chips, or add your own. */
export default function Reacts() {
  const { colors } = useTheme();
  const { profile } = useApp();
  const { updateProfile } = useActions();
  const { busy, error, run } = useSubmit();
  const [avoid, setAvoid] = useState<string[]>(profile.avoid);
  const [other, setOther] = useState('');

  const toggle = (a: string) => setAvoid((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]));
  const add = () => {
    const a = other.trim();
    if (a && !avoid.some((x) => x.toLowerCase() === a.toLowerCase())) setAvoid((x) => [...x, a]);
    setOther('');
  };
  const custom = avoid.filter((a) => !ALLERGEN_SUGGESTIONS.includes(a));

  const next = async () => {
    const pending = other.trim();
    const list = pending && !avoid.includes(pending) ? [...avoid, pending] : avoid;
    if ((await run(() => updateProfile({ avoid: list }))) === undefined) return;
    router.push('/setup/ready');
  };

  return (
    <Screen
      keyboard
      edges={['top']}
      header={<SetupHeader step={3} total={QUIZ_STEPS} />}
      footer={<Button label={avoid.length || other.trim() ? 'Continue' : 'None that I know of'} loading={busy} onPress={() => void next()} />}>
      <Txt variant="display">Anything your skin reacts to?</Txt>
      <Txt variant="body" color="secondary">
        We&apos;ll keep these out of your routine.
      </Txt>
      <ErrorBanner error={error} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {ALLERGEN_SUGGESTIONS.map((a) => (
          <Chip key={a} label={a} selected={avoid.includes(a)} onPress={() => toggle(a)} />
        ))}
        {custom.map((a) => (
          <Chip key={a} label={a} tone="tag" onRemove={() => toggle(a)} />
        ))}
      </View>
      <Field
        label="Something else?"
        value={other}
        onChangeText={setOther}
        placeholder="e.g. tea tree oil"
        onSubmitEditing={add}
        right={<Icon name="add" size={20} color={colors.textMuted} />}
      />
    </Screen>
  );
}
