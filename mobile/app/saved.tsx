import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Segmented, EmptyState, IconTile, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import type { SavedKind } from '@/data/types';
import { buildRoutine, pausedIds } from '@/lib/routine';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** F7 Saved recommendations: ingredients, tips and doctor advice in one place. */
export default function Saved() {
  const { colors } = useTheme();
  const state = useApp();
  const { toggleSaved, restoreStep, toggleFavorite } = useActions();
  const [kind, setKind] = useState<SavedKind>('ingredient');
  const scan = state.scans[0];
  // Steps a dermatologist paused come back by themselves; the patient can't add them back early.
  const paused = pausedIds(state.routinePrefs);
  const inRoutine = new Set([...buildRoutine('am', state.profile, state.routinePrefs, scan), ...buildRoutine('pm', state.profile, state.routinePrefs, scan)].map((x) => x.id));
  const favourites = state.favorites.map((id) => state.doctors.find((d) => d.id === id)).filter((d) => !!d);
  const list = state.saved.filter((x) => x.kind === kind);

  return (
    <Screen header={<TopBar title="Saved" />}>
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: 'ingredient', label: 'Ingredients' },
          { value: 'tip', label: 'Tips' },
          { value: 'doctor', label: 'Doctor' },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState icon="bookmark-border" title={kind === 'doctor' ? 'No doctor advice saved' : kind === 'tip' ? 'No tips saved' : 'No ingredients saved'} body="Tap the bookmark on results, a routine step or a doctor's note to keep it here." />
      ) : (
        <List>
          {list.map((x) => {
            const stepIn = x.routineStepId ? (paused.has(x.routineStepId) ? 'paused' : inRoutine.has(x.routineStepId)) : null;
            return (
              <Row
                key={x.id}
                leading={<IconTile icon={x.icon} tone={x.kind === 'doctor' ? 'clinician' : 'brand'} />}
                title={x.title}
                subtitle={x.subtitle}
                onPress={x.routineStepId ? () => router.push({ pathname: '/step/[id]', params: { id: x.routineStepId! } }) : undefined}
                right={stepIn === true ? <StatusPill label="In routine" tone="good" /> : stepIn === 'paused' ? <StatusPill label="Paused by doctor" tone="clinician" /> : null}
                action={
                  <>
                    {stepIn === false ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => attempt(restoreStep(x.routineStepId!), "Couldn't add it to your routine")}>
                        <StatusPill label="Add to routine" tone="brand" />
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => attempt(toggleSaved(x))} accessibilityRole="button" accessibilityLabel={`Remove ${x.title} from saved`} hitSlop={10}>
                      <Icon name="bookmark" size={22} color={colors.brand} />
                    </Pressable>
                  </>
                }
              />
            );
          })}
        </List>
      )}
      {favourites.length && kind === 'doctor' ? (
        <View style={{ gap: space.sm }}>
          <Txt variant="smallStrong" color="secondary">
            Favourite dermatologists
          </Txt>
          <List>
            {favourites.map((d) => (
              <Row
                key={d.id}
                icon="favorite"
                title={d.name}
                subtitle={`${d.focus} · ${d.city}`}
                chevron
                onPress={() => router.push({ pathname: '/doctors/[id]', params: { id: d.id } })}
                action={
                  <Pressable onPress={() => attempt(toggleFavorite(d.id))} accessibilityRole="button" accessibilityLabel={`Remove ${d.name} from favourites`} hitSlop={10}>
                    <Icon name="favorite" size={22} color={colors.actIcon} />
                  </Pressable>
                }
              />
            ))}
          </List>
        </View>
      ) : null}
      {list.length ? (
        <Txt variant="small" color="secondary" align="center">
          Bookmark anything from results, chat or a visit to find it here.
        </Txt>
      ) : null}
    </Screen>
  );
}
