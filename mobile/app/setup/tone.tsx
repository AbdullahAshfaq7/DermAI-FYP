import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { SetupHeader } from '@/components/SetupHeader';
import { Banner, Button, Screen, Txt } from '@/components/ui/kit';
import { SKIN_TONES } from '@/data/seed';
import { back } from '@/lib/nav';
import { useApp, useStore } from '@/store/AppStore';
import { fitzpatrick } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

/** B1 Skin tone: the Fitzpatrick scale in plain words. */
export default function SkinTone() {
  const { colors } = useTheme();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { profile } = useApp();
  const { update } = useStore();
  const [tone, setTone] = useState<number | null>(profile.tone);

  const save = () => {
    update((s) => ({ ...s, profile: { ...s.profile, tone } }));
    if (edit) back();
    else router.push('/setup/type');
  };

  return (
    <Screen
      edges={['top']}
      header={<SetupHeader step={1} editing={!!edit} onSkip={() => router.push('/setup/type')} />}
      footer={<Button label={edit ? 'Save' : 'Next'} disabled={tone === null} onPress={save} />}>
      <Txt variant="display">Which tone is closest to your skin?</Txt>
      <Txt variant="body" color="secondary">
        Pick the one nearest your inner arm, away from the sun.
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {SKIN_TONES.map((label, i) => {
          const selected = tone === i;
          return (
            <Pressable
              key={label}
              onPress={() => setTone(i)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${label}, Fitzpatrick type ${i + 1}`}
              style={{
                width: '31.6%',
                aspectRatio: 0.95,
                borderRadius: radius.card,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? colors.brand : colors.border,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                gap: space.sm,
              }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: fitzpatrick[i] }} />
              <Txt variant={selected ? 'smallStrong' : 'small'} color={selected ? 'primary' : 'secondary'}>
                {label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <Banner icon="info-outline" text="Pigmentation and redness look different on deeper skin. This helps us read your scan correctly." />
    </Screen>
  );
}
