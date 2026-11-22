import { router } from 'expo-router';
import { View } from 'react-native';

import { IconButton, StepBar, Txt } from '@/components/ui/kit';
import { back } from '@/lib/nav';
import { space } from '@/theme/tokens';

/** Progress bar, back and skip for the three skin-profile steps (B1 to B3) and doctor sign-up (G). */
export function SetupHeader({
  step,
  total = 3,
  onSkip,
  tone = 'brand',
  editing,
  label,
}: {
  step: number;
  total?: number;
  onSkip?: () => void;
  tone?: 'brand' | 'clinician';
  editing?: boolean;
  label?: string;
}) {
  return (
    <View style={{ paddingHorizontal: space.screen, paddingTop: space.sm, paddingBottom: space.xs, flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 52 }}>
      <IconButton icon="arrow-back" label="Go back" onPress={() => back()} />
      <View style={{ flex: 1 }}>{editing ? null : <StepBar total={total} current={step} tone={tone} />}</View>
      {editing ? null : onSkip ? (
        <Txt variant="small" color="secondary" onPress={onSkip} style={{ padding: space.xs }}>
          Skip
        </Txt>
      ) : (
        <Txt variant="small" color="muted">
          {label ?? `${step} of ${total}`}
        </Txt>
      )}
    </View>
  );
}

export function finishProfileSetup() {
  router.replace('/home');
  router.push('/scan');
}
