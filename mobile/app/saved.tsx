import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Chip, EmptyState, IconTile, List, Row, Screen, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import type { SavedKind } from '@/data/types';
import { buildRoutine } from '@/lib/routine';
import { useActions, useStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** F7 Saved recommendations: ingredients, tips and doctor advice in one place. */
export default function Saved() {
  const { colors } = useTheme();
  const { state, update } = useStore();
  const { toggleSaved } = useActions();
  const [kind, setKind] = useState<SavedKind | 'all'>('all');
  const inRoutine = new Set([...buildRoutine('am', state.profile, state.routinePrefs), ...buildRoutine('pm', state.profile, state.routinePrefs)].map((x) => x.id));
  const list = state.saved.filter((x) => kind === 'all' || x.kind === kind);

  return (
    <Screen header={<TopBar title="Saved recommendations" />}>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        <Chip label="All" selected={kind === 'all'} onPress={() => setKind('all')} />
        <Chip label="Ingredients" selected={kind === 'ingredient'} onPress={() => setKind('ingredient')} />
        <Chip label="Tips" selected={kind === 'tip'} onPress={() => setKind('tip')} />
        <Chip label="From doctor" selected={kind === 'doctor'} onPress={() => setKind('doctor')} />
      </View>
      {list.length === 0 ? (
        <EmptyState icon="bookmark-border" title="Nothing saved yet" body="Bookmark anything from results, chat or a visit to find it here." />
      ) : (
        <List>
          {list.map((x) => {
            const stepIn = x.routineStepId ? inRoutine.has(x.routineStepId) : null;
            return (
              <Row
                key={x.id}
                leading={<IconTile icon={x.icon} tone={x.kind === 'doctor' ? 'clinician' : 'brand'} />}
                title={x.title}
                subtitle={x.subtitle}
                onPress={x.routineStepId ? () => router.push({ pathname: '/step/[id]', params: { id: x.routineStepId! } }) : undefined}
                right={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    {stepIn === true ? <StatusPill label="In routine" tone="good" /> : null}
                    {stepIn === false ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => update((s) => ({ ...s, routinePrefs: { ...s.routinePrefs, removed: s.routinePrefs.removed.filter((r) => r !== x.routineStepId), length: 6 } }))}>
                        <StatusPill label="Add to routine" tone="brand" />
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => toggleSaved(x)} accessibilityRole="button" accessibilityLabel={`Remove ${x.title} from saved`} hitSlop={10}>
                      <Icon name="bookmark" size={22} color={colors.brand} />
                    </Pressable>
                  </View>
                }
              />
            );
          })}
        </List>
      )}
      {list.length ? (
        <Txt variant="small" color="secondary" align="center">
          Bookmark anything from results, chat or a visit to find it here.
        </Txt>
      ) : null}
    </Screen>
  );
}
