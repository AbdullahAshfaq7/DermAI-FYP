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
    <View style={{ paddingHorizontal: space.screen, paddingTop: space.sm, gap: space.md }}>
      {editing ? null : <StepBar total={total} current={step} tone={tone} />}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 }}>
        <IconButton icon="arrow-back" label="Go back" onPress={() => back()} />
        {label ? (
          <Txt variant="small" color="secondary">
            {label}
          </Txt>
        ) : onSkip && !editing ? (
          <Txt variant="small" color="secondary" onPress={onSkip} style={{ padding: space.sm }}>
            Skip
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

export function finishProfileSetup() {
  router.replace('/home');
  router.push('/scan');
}
