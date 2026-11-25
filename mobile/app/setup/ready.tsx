import { router } from 'expo-router';
import { View } from 'react-native';

import { finishProfileSetup, QUIZ_STEPS, SetupHeader } from '@/components/SetupHeader';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Button, Card, ErrorBanner, Screen, Txt } from '@/components/ui/kit';
import { FITZ_ROMAN } from '@/data/seed';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { fitzpatrick } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

import { TONE_NOTE } from './tone';

const FEEL_LINE: Record<string, string> = {
  Dry: 'Tight, sometimes flaky',
  Oily: 'Shiny all over',
  Combination: 'Shiny T-zone, normal cheeks',
  Normal: 'Comfortable',
};

function Line({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
      <Icon name={icon} size={20} color={colors.brandDeep} />
      <Txt variant="small" color="secondary" style={{ width: 92 }}>
        {label}
      </Txt>
      <Txt variant="bodyStrong" style={{ flex: 1 }}>
        {value}
      </Txt>
    </View>
  );
}

/** B4 Quiz end: the skin profile in one card, how the scan uses it, then the first scan. */
export default function Ready() {
  const { colors } = useTheme();
  const { profile } = useApp();
  const { updateProfile } = useActions();
  const { busy, error, run } = useSubmit();
  const tone = profile.tone;

  const finish = async (scan: boolean) => {
    if ((await run(() => updateProfile({ done: true }))) === undefined) return;
    if (scan) finishProfileSetup();
    else router.replace('/home');
  };

  return (
    <Screen
      edges={['top']}
      header={<SetupHeader step={QUIZ_STEPS} total={QUIZ_STEPS} label="Done" />}
      footer={
        <>
          <Button label="Start my first scan" icon="center-focus-strong" loading={busy} onPress={() => void finish(true)} />
          <Button label="I'll scan later" variant="secondary" disabled={busy} onPress={() => void finish(false)} />
        </>
      }>
      <Txt variant="display">Your skin profile</Txt>
      <ErrorBanner error={error} />
      <Card style={{ gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: tone == null ? colors.brandWash : fitzpatrick[tone] }} />
          <View style={{ flex: 1 }}>
            <Txt variant="heading">{tone == null ? 'Tone not set' : `Type ${FITZ_ROMAN[tone]} skin`}</Txt>
            <Txt variant="small" color="secondary">
              {profile.feel ? `${profile.feel} · ${FEEL_LINE[profile.feel] ?? ''}` : 'Skin type not set'}
            </Txt>
          </View>
        </View>
        <Line icon="block" label="Keep out" value={profile.avoid.length ? profile.avoid.join(', ') : 'Nothing so far'} />
        <Line icon="center-focus-strong" label="Scan reads" value="Acne, redness, pores, dark spots, dryness, sensitivity" />
      </Card>
      {tone != null ? (
        <Card tone="peach" style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
          <Icon name="tune" size={20} color={colors.textPrimary} />
          <Txt variant="small" style={{ flex: 1 }}>
            {TONE_NOTE[tone]}
          </Txt>
        </Card>
      ) : null}
      <Card tone="brand" style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
        <Icon name="lock" size={20} color={colors.brandDeep} />
        <Txt variant="small" color="brandDeep" style={{ flex: 1 }}>
          <Txt variant="smallStrong" color="brandDeep">
            Your photos stay on your phone.
          </Txt>{' '}
          We read each one to score it, then delete our copy.
        </Txt>
      </Card>
    </Screen>
  );
}
