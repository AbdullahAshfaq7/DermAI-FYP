import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Button, IconTile, Screen, TopBar, Txt } from '@/components/ui/kit';
import { homeFor } from '@/lib/nav';
import { useActions, useStore } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', minHeight: 44 }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          borderWidth: 2,
          borderColor: value ? colors.brand : colors.border,
          backgroundColor: value ? colors.brand : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {value ? <Icon name="check" size={16} color={colors.onFill} /> : null}
      </View>
      <Txt variant="body" style={{ flex: 1 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

const POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'lock', title: 'Encrypted and private', body: 'Only you, and a dermatologist you share a case with, can see your photos.' },
  { icon: 'delete', title: 'Delete any time', body: 'Remove a scan or your whole account from Settings.' },
  { icon: 'medical-information', title: 'Guidance, not diagnosis', body: 'DermAI doesn\'t replace a doctor. We\'ll tell you when to see one.' },
];

/** A5 Consent: age and photo consent before any camera use. */
export default function Consent() {
  const { colors } = useTheme();
  const { state } = useStore();
  const { giveConsent } = useActions();
  const [adult, setAdult] = useState(false);
  const [train, setTrain] = useState(false);
  const derm = state.session?.role === 'dermatologist';

  return (
    <Screen
      header={<TopBar right={<Txt variant="small" color="secondary">3 of 3</Txt>} />}
      footer={
        <>
          <Button
            label="Agree and continue"
            disabled={!adult}
            onPress={() => {
              giveConsent(adult, train);
              router.replace(homeFor({ ...state, consent: { adult, train, at: '' } }));
            }}
          />
          <Txt variant="small" color="brand" align="center" onPress={() => router.push('/about')}>
            Read the privacy policy and terms
          </Txt>
        </>
      }>
      <Txt variant="display">Your photos stay yours</Txt>
      <View style={{ gap: space.lg }}>
        {POINTS.map((p) => (
          <View key={p.title} style={{ flexDirection: 'row', gap: space.md }}>
            <IconTile icon={p.icon} tone={derm ? 'clinician' : 'brand'} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="bodyStrong">{p.title}</Txt>
              <Txt variant="small" color="secondary">
                {p.body}
              </Txt>
            </View>
          </View>
        ))}
      </View>
      <View style={{ backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.lg, paddingVertical: space.sm }}>
        <Check label={derm ? 'I\'m 18 or older' : 'I\'m 18 or older, or have a parent\'s consent'} value={adult} onChange={setAdult} />
        <Check label="Let DermAI use my photos to improve the model (optional)" value={train} onChange={setTrain} />
      </View>
    </Screen>
  );
}
