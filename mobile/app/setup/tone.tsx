import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { SetupHeader } from '@/components/SetupHeader';
import { Icon } from '@/components/ui/Icon';
import { Banner, Button, ErrorBanner, Screen, Txt } from '@/components/ui/kit';
import { FITZ_ROMAN } from '@/data/seed';
import { back } from '@/lib/nav';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { fitzpatrick } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const BURN = ['Always burns', 'Burns easily', 'Sometimes burns', 'Rarely burns', 'Very rarely', 'Never burns'];
const NOTE = [
  'On type I skin, redness shows clearly as pink. The scan reads small changes.',
  'On type II skin, redness shows as pink and sun marks appear quickly.',
  'On type III skin, healed spots can leave brown marks. The scan watches for them.',
  'On type IV skin, redness can look brown rather than pink. The scan reads it that way.',
  'On type V skin, redness looks darker rather than pink, and marks last longer. The scan reads it that way.',
  'On type VI skin, redness and irritation look darker, not pink. The scan reads it that way.',
];

/** B1 Skin tone: the Fitzpatrick scale in plain words, with how it changes the reading. */
export default function SkinTone() {
  const { colors } = useTheme();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { profile } = useApp();
  const { updateProfile } = useActions();
  const { busy, error, run } = useSubmit();
  const [tone, setTone] = useState<number | null>(profile.tone);

  const save = async () => {
    if ((await run(() => updateProfile({ tone }))) === undefined) return;
    if (edit) back();
    else router.push('/setup/type');
  };

  return (
    <Screen
      edges={['top']}
      header={<SetupHeader step={1} editing={!!edit} />}
      footer={<Button label={edit ? 'Save' : 'Continue'} disabled={tone === null} loading={busy} onPress={() => void save()} />}>
      <Txt variant="display">Which looks most like your skin?</Txt>
      <ErrorBanner error={error} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.md, columnGap: space.sm }}>
        {BURN.map((burn, i) => {
          const selected = tone === i;
          return (
            <Pressable
              key={burn}
              onPress={() => setTone(i)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`Type ${FITZ_ROMAN[i]}, ${burn}`}
              style={{ width: '31.6%', alignItems: 'center', gap: 4 }}>
              <View
                style={[
                  { alignSelf: 'stretch', height: 72, borderRadius: 22, backgroundColor: fitzpatrick[i], alignItems: 'center', justifyContent: 'center' },
                  selected ? ({ boxShadow: `0 0 0 3px ${colors.bg}, 0 0 0 5.5px ${colors.brand}` } as object) : null,
                ]}>
                {selected ? <Icon name="check-circle" size={26} color={i >= 2 ? '#FFFFFF' : '#6B4632'} /> : null}
              </View>
              <Txt variant="heading" color={selected ? 'brand' : 'primary'}>
                {FITZ_ROMAN[i]}
              </Txt>
              <Txt variant="caption" color="muted" align="center">
                {burn}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <Banner tone="peach" icon="info-outline" text={tone == null ? 'Pick the tone nearest your inner arm, away from the sun. Redness and marks look different on deeper skin, so the scan needs to know.' : NOTE[tone]} />
    </Screen>
  );
}
