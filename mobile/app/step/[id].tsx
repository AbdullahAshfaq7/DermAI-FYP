import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Button, Card, Chip, EmptyState, IconButton, Screen, TopBar, Txt } from '@/components/ui/kit';
import { stepNumber } from '@/lib/routine';
import { stepById, todayKey } from '@/lib/selectors';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** D3 Step detail: ingredients, not brands, so it works anywhere. */
export default function StepDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApp();
  const { toggleStep, toggleSaved } = useActions();
  const step = stepById(id);

  if (!step) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="checklist" title="Step not found" body="It may have been removed from your routine." />
      </Screen>
    );
  }

  const done = (s.routineLog[todayKey()] ?? []).includes(step.id);
  const saved = s.saved.some((x) => x.title === step.title);
  const n = stepNumber(step, s.profile, s.routinePrefs);

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
              onPress={() => toggleSaved({ id: `sv-${Date.now()}`, kind: 'ingredient', title: step.title, subtitle: step.subtitle, icon: 'spa', routineStepId: step.id, source: 'Routine' })}
            />
          }
        />
      }
      footer={
        <Button
          label={done ? 'Done today' : 'Mark as done'}
          icon={done ? 'check' : undefined}
          variant={done ? 'secondary' : 'primary'}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleStep(step.id);
          }}
        />
      }>
      <Txt variant="display">{step.title}</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {step.ingredients.map((i) => (
          <Chip key={i} label={i} tone="tag" />
        ))}
      </View>
      <Card tone="muted">
        <Txt variant="bodyStrong">Why it&apos;s here</Txt>
        <Txt variant="body" color="secondary" style={{ marginTop: 4 }}>
          {step.why}
        </Txt>
      </Card>
      <Txt variant="heading">How to use</Txt>
      <View style={{ gap: space.md }}>
        {step.how.map((h, i) => (
          <View key={h} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.brandWash, alignItems: 'center', justifyContent: 'center' }}>
              <Txt variant="smallStrong" color="brandDeep">
                {i + 1}
              </Txt>
            </View>
            <Txt variant="body" style={{ flex: 1 }}>
              {h}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm, backgroundColor: colors.actWash, borderRadius: radius.card, padding: space.lg }}>
        <Icon name="block" size={20} color={colors.actIcon} />
        <Txt variant="small" color="act" style={{ flex: 1 }}>
          {step.avoid}
        </Txt>
      </View>
    </Screen>
  );
}
