import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Card, EmptyState, List, Screen, Segmented, Txt } from '@/components/ui/kit';
import { dayMonth } from '@/lib/format';
import { routineProgress, streak, todayKey } from '@/lib/selectors';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** D2 Routine: tap a circle to tick; tap a row for D3. */
export default function Routine() {
  const { colors } = useTheme();
  const s = useApp();
  const { toggleStep } = useActions();
  const [period, setPeriod] = useState<'am' | 'pm'>(new Date().getHours() >= 15 ? 'pm' : 'am');
  const prog = routineProgress(s, period);
  const done = s.routineLog[todayKey()] ?? [];
  const days = streak(s);
  const scan = s.scans[0];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm }}>
        <Txt variant="title">Routine</Txt>
        {days > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.watchWash, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 }} accessibilityLabel={`${days} day streak`}>
            <Icon name="local-fire-department" size={16} color={colors.watchIcon} />
            <Txt variant="smallStrong" color="watch">
              {days} day{days === 1 ? '' : 's'}
            </Txt>
          </View>
        ) : null}
      </View>
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'am', label: 'Morning' },
          { value: 'pm', label: 'Evening' },
        ]}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Icon name="notifications-active" size={18} color={colors.textSecondary} />
        <Txt variant="small" color="secondary" style={{ flex: 1 }} onPress={() => router.push('/routine-preferences')}>
          {(period === 'am' ? s.settings.remindAm : s.settings.remindPm) ? `Reminder at ${period === 'am' ? s.routinePrefs.amTime : s.routinePrefs.pmTime}` : 'Reminder off'}
        </Txt>
        <Txt variant="smallStrong">
          {prog.done}/{prog.total}
        </Txt>
      </View>
      {prog.total === 0 ? (
        <EmptyState icon="checklist" title="No steps here" body="Your always-avoid list rules out every step. Change it in Routine preferences." action="Routine preferences" onAction={() => router.push('/routine-preferences')} />
      ) : (
        <List>
          {prog.steps.map((step) => {
            const isDone = done.includes(step.id);
            return (
              <View key={step.id} style={{ flexDirection: 'row', alignItems: 'center', opacity: isDone ? 0.55 : 1 }}>
                <Pressable
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    toggleStep(step.id);
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isDone }}
                  accessibilityLabel={`${step.title}, ${isDone ? 'done' : 'not done'}`}
                  style={{ width: 56, minHeight: 64, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={isDone ? 'check-circle' : 'radio-button-unchecked'} size={26} color={isDone ? colors.brand : colors.textMuted} />
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: '/step/[id]', params: { id: step.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${step.title} details`}
                  style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: space.md, paddingRight: space.md, opacity: pressed ? 0.7 : 1 })}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{step.title}</Txt>
                    <Txt variant="small" color="secondary">
                      {step.subtitle}
                    </Txt>
                  </View>
                  <Icon name="chevron-right" size={22} color={colors.textMuted} />
                </Pressable>
              </View>
            );
          })}
        </List>
      )}
      <Card tone="muted" style={{ flexDirection: 'row', gap: space.sm }}>
        <Icon name="auto-awesome" size={18} color={colors.brand} />
        <Txt variant="small" color="secondary" style={{ flex: 1 }}>
          Built from {scan ? `your ${dayMonth(scan.date)} scan and ` : 'your '}skin profile.
          {s.profile.avoid.length ? ` Avoids ${s.profile.avoid.map((a) => a.toLowerCase()).join(' and ')}.` : ''}
        </Txt>
      </Card>
    </Screen>
  );
}
