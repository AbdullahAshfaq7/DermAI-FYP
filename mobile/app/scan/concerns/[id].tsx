import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Chip, IconButton, IconTile, levelTone, Screen, Segmented, StatusPill, TopBar, Txt } from '@/components/ui/kit';
import { ConcernBar, FaceMap, LevelLegend } from '@/components/visual';
import { CONCERN_ORDER, CONCERNS } from '@/data/seed';
import type { ConcernKey } from '@/data/types';
import { scanById, zonesForConcern } from '@/lib/selectors';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** C7 All six concerns: grid or face map. */
export default function AllConcerns() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const state = useApp();
  const scan = scanById(state, id) ?? state.scans[0];
  const [mode, setMode] = useState<'grid' | 'map'>('grid');
  const [focus, setFocus] = useState<ConcernKey>('redness');
  if (!scan) return null;
  const open = (key: ConcernKey) => router.push({ pathname: '/scan/concern/[key]', params: { key, scan: scan.id } });

  return (
    <Screen
      header={
        <TopBar
          title="All six concerns"
          right={
            <IconButton
              icon="info-outline"
              label="How to read this"
              onPress={() => Alert.alert('How to read this', 'Each percentage is how visible a concern is in this photo, not how severe it is medically. Higher means more visible.')}
            />
          }
        />
      }>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'grid', label: 'Grid' },
          { value: 'map', label: 'Face map' },
        ]}
      />
      {mode === 'grid' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
          {CONCERN_ORDER.map((k) => {
            const r = scan.concerns[k];
            return (
              <Pressable
                key={k}
                onPress={() => open(k)}
                accessibilityRole="button"
                accessibilityLabel={`${CONCERNS[k].label}, ${r.pct} percent, ${r.level}`}
                style={({ pressed }) => ({
                  width: '47.8%',
                  backgroundColor: colors.surface,
                  borderRadius: radius.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: space.md,
                  gap: space.sm,
                  opacity: pressed ? 0.85 : 1,
                })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                  <IconTile icon={CONCERNS[k].icon} size={30} />
                  <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
                    {CONCERNS[k].label}
                  </Txt>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Txt variant="number">{r.pct}%</Txt>
                  <StatusPill label={r.level === 'Moderate' ? 'Mod.' : r.level} tone={levelTone(r.level)} />
                </View>
                <ConcernBar reading={r} />
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: space.lg }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {CONCERN_ORDER.map((k) => (
              <Chip key={k} label={CONCERNS[k].label} selected={focus === k} onPress={() => setFocus(k)} />
            ))}
          </View>
          <View style={{ alignItems: 'center', gap: space.sm }}>
            <FaceMap zones={zonesForConcern(scan, focus)} width={200} concernLabel={CONCERNS[focus].label.toLowerCase()} onZonePress={() => open(focus)} />
            <Txt variant="bodyStrong">
              {CONCERNS[focus].label} · {scan.concerns[focus].pct}% · {scan.concerns[focus].level}
            </Txt>
          </View>
        </View>
      )}
      <LevelLegend />
      <Txt variant="small" color="secondary" align="center">
        Higher % means more visible. Tap any {mode === 'grid' ? 'tile' : 'zone'} for its detail.
      </Txt>
    </Screen>
  );
}
