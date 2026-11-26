import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Banner, Chip, EmptyState, List, Screen, Segmented, StatusPill, Tick, Txt } from '@/components/ui/kit';
import { CONCERNS } from '@/data/seed';
import { dayMonth } from '@/lib/format';
import { periodNow } from '@/lib/routine';
import { routineProgress, streak, todayKey, weekStrip } from '@/lib/selectors';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** D2 Routine: opens on the right half of the day; tap a circle to tick, a row for D3. */
export default function Routine() {
  const { colors } = useTheme();
  const s = useApp();
  const { toggleStep } = useActions();
  const auto = periodNow();
  const [period, setPeriod] = useState<'am' | 'pm'>(auto);
  const prog = routineProgress(s, period);
  const done = s.routineLog[todayKey()] ?? [];
  const days = streak(s);
  const week = weekStrip(s);
  const scan = s.scans[0];
  const tip = prog.steps.find((x) => x.wait && !done.includes(x.id))?.wait;

  return (
    <Screen dock>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm }}>
        <Txt variant="display">Routine</Txt>
        {days > 0 ? <Chip tone="butter" icon="local-fire-department" label={`${days} day${days === 1 ? '' : 's'}`} /> : null}
      </View>
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'am', label: 'Morning', icon: 'light-mode' },
          { value: 'pm', label: 'Evening', icon: 'dark-mode' },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`This week: ${week.filter((d) => d.done).length} days done`}>
        {week.map((d) => (
          <View key={d.key} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: d.done ? colors.butter : d.today ? colors.surface : colors.surfaceMuted,
                borderWidth: d.today && !d.done ? 2 : 0,
                borderColor: colors.brand,
                opacity: d.future ? 0.6 : 1,
              }}>
              {d.done ? <Icon name="check" size={16} color={colors.onFill} /> : null}
            </View>
            <Txt variant="caption" color="muted" style={{ fontSize: 11 }}>
              {d.letter}
            </Txt>
          </View>
        ))}
      </View>
      {prog.total === 0 ? (
        <EmptyState icon="checklist" title="No steps here" body="Your always-avoid list or budget rules out every step. Change it in Routine preferences." action="Routine preferences" onAction={() => router.push('/routine-preferences')} />
      ) : (
        <List>
          {prog.steps.map((step) => {
            const isDone = done.includes(step.id);
            const target = step.targets[0];
            return (
              <View key={step.id} style={{ flexDirection: 'row', alignItems: 'center', opacity: isDone ? 0.55 : 1, paddingLeft: space.xs }}>
                <Tick
                  on={isDone}
                  label={`${step.title}, ${isDone ? 'done' : 'not done'}`}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    attempt(toggleStep(step.id));
                  }}
                />
                <Pressable
                  onPress={() => router.push({ pathname: '/step/[id]', params: { id: step.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${step.title} details`}
                  style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md, paddingRight: space.md, opacity: pressed ? 0.7 : 1 })}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong" style={isDone ? { textDecorationLine: 'line-through' } : undefined}>
                      {step.title}
                    </Txt>
                    <Txt variant="small" color="secondary">
                      {step.doctor ? `${step.subtitle} · from ${step.by ?? 'your doctor'}` : step.subtitle}
                    </Txt>
                  </View>
                  {step.doctor ? (
                    <StatusPill label="Doctor" tone="clinician" icon="stethoscope" />
                  ) : target && scan && scan.concerns[target].level !== 'Clear' && !isDone ? (
                    <StatusPill label={`Targets ${CONCERNS[target].label.toLowerCase()}`} tone="brand" />
                  ) : (
                    <Icon name="chevron-right" size={22} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>
            );
          })}
        </List>
      )}
      {tip ? <Banner tone="butter" icon="timer" text={tip} /> : null}
      {Object.keys(s.routinePrefs.paused ?? {}).length ? (
        <Banner tone="clinician" icon="pause-circle-outline" text={`Your dermatologist paused ${Object.keys(s.routinePrefs.paused).length} step${Object.keys(s.routinePrefs.paused).length === 1 ? '' : 's'} for now. They come back on their own.`} />
      ) : null}
      <Txt variant="caption" color="muted" align="center">
        {period === auto ? `${period === 'pm' ? 'Evening' : 'Morning'} routine for now. ` : ''}
        {scan ? `Updated from your ${dayMonth(scan.date)} scan.` : 'Built from your skin profile.'}
        {(period === 'am' ? s.settings.remindAm : s.settings.remindPm) ? ` Reminder at ${period === 'am' ? s.routinePrefs.amTime : s.routinePrefs.pmTime}.` : ''}
      </Txt>
    </Screen>
  );
}
