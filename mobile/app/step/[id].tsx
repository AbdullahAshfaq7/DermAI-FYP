import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Card, EmptyState, IconButton, Screen, TopBar, Txt } from '@/components/ui/kit';
import { findStep, stepNumber } from '@/lib/routine';
import { todayKey } from '@/lib/selectors';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** D3 Step detail: ingredients rather than brands, so it works with any shop. */
export default function StepDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApp();
  const { toggleStep, toggleSaved } = useActions();
  const step = findStep(id, s.routinePrefs);

  if (!step) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="checklist" title="Step not found" body="It may have been removed from your routine." />
      </Screen>
    );
  }

  const done = (s.routineLog[todayKey()] ?? []).includes(step.id);
  const saved = s.saved.some((x) => x.title === step.title);
  const n = stepNumber(step, s.profile, s.routinePrefs, s.scans[0]);
  const paused = s.routinePrefs.paused?.[step.id];

  return (
    <Screen
      header={
        <TopBar
          title={`${step.period === 'am' ? 'Morning' : 'Evening'}${n > 0 ? ` · step ${n}` : ''}`}
          right={
            <IconButton
              icon={saved ? 'bookmark' : 'bookmark-border'}
              label={saved ? 'Remove from saved' : 'Save'}
              color={saved ? colors.brand : undefined}
              onPress={() =>
                attempt(toggleSaved({ id: `sv-${Date.now()}`, kind: step.doctor ? 'doctor' : 'ingredient', title: step.title, subtitle: step.subtitle, icon: step.doctor ? 'stethoscope' : 'science', routineStepId: step.id, source: step.doctor ? 'Doctor' : 'Routine' }))
              }
            />
          }
        />
      }
      footer={
        n > 0 ? (
          <Button
            label={done ? 'Done today' : 'Mark as done'}
            icon="check"
            variant={done ? 'soft' : 'primary'}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              attempt(toggleStep(step.id));
            }}
          />
        ) : null
      }>
      <Card tone={step.doctor ? 'clinicianFill' : 'brandFill'} style={{ padding: space.lg + 2, borderRadius: 26 }}>
        <Icon name={step.doctor ? 'stethoscope' : 'science'} size={30} color="#FFFFFF" />
        <Txt variant="title" color="onFill" style={{ marginTop: space.md }}>
          {step.title}
        </Txt>
        <Txt variant="body" color="onFill" style={{ opacity: 0.85 }}>
          {step.subtitle}
        </Txt>
      </Card>
      {paused ? <Card tone="clinician"><Txt variant="small" color="clinician">Paused by your dermatologist until {paused}. It comes back on its own.</Txt></Card> : null}
      <View style={{ gap: 4 }}>
        <Txt variant="bodyStrong">Why it&apos;s here</Txt>
        <Txt variant="body" color="secondary">
          {step.why}
        </Txt>
      </View>
      {step.how.length ? (
        <>
          <Txt variant="heading">How to use it</Txt>
          <View style={{ gap: space.sm + 2 }}>
            {step.how.map((h, i) => (
              <View key={h} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brandWash, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt variant="caption" color="brandDeep">
                    {i + 1}
                  </Txt>
                </View>
                <Txt variant="body" style={{ flex: 1 }}>
                  {h}
                </Txt>
              </View>
            ))}
          </View>
        </>
      ) : null}
      {step.conflict || step.avoid || step.lookFor?.length ? (
        <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
          <Icon name="block" size={20} color={colors.actIcon} />
          <View style={{ flex: 1, gap: 3 }}>
            {step.conflict ? <Txt variant="bodyStrong">{step.conflict}</Txt> : null}
            {step.avoid ? (
              <Txt variant="small" color="secondary">
                {step.avoid}
              </Txt>
            ) : null}
            {step.lookFor?.length ? (
              <Txt variant="caption" color="muted">
                Look for: {step.lookFor.join(', ')}
              </Txt>
            ) : null}
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
