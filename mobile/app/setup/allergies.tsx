import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { AvoidPicker } from '@/components/AvoidPicker';
import { finishProfileSetup, SetupHeader } from '@/components/SetupHeader';
import { type IconName } from '@/components/ui/Icon';
import { Button, ErrorBanner, List, Screen, ToggleRow, Txt, type IconTone } from '@/components/ui/kit';
import { back } from '@/lib/nav';
import { useSubmit } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const PRODUCTS: { name: string; icon: IconName; tone: IconTone }[] = [
  { name: 'Cleanser', icon: 'soap', tone: 'brand' },
  { name: 'Moisturiser', icon: 'water-drop', tone: 'brand' },
  { name: 'Sunscreen', icon: 'light-mode', tone: 'peach' },
  { name: 'Serum or treatment', icon: 'science', tone: 'muted' },
];

function summary(products: string[]): string {
  if (!products.length) return 'Nothing regular';
  if (products.length >= 3) return 'Three or more products';
  return products.join(' and ').replace('Moisturiser', 'moisturiser').replace('Sunscreen', 'sunscreen');
}

/** B3 Allergies and routine, then straight to the scan guide (C1). */
export default function Allergies() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { profile } = useApp();
  const { updateProfile } = useActions();
  const { busy, error, run } = useSubmit();
  const [avoid, setAvoid] = useState<string[]>(profile.avoid);
  const [products, setProducts] = useState<string[]>(profile.currentProducts ?? []);
  const toggle = (p: string) => setProducts((x) => (x.includes(p) ? x.filter((y) => y !== p) : [...x, p]));

  const save = async (done: boolean) => {
    const patch = done ? { avoid, currentProducts: products, current: summary(products), done: true } : { done: true };
    return (await run(() => updateProfile(patch))) !== undefined;
  };
  const finish = async () => {
    if (!(await save(true))) return;
    if (edit) back();
    else finishProfileSetup();
  };

  return (
    <Screen
      keyboard
      header={<SetupHeader step={3} editing={!!edit} />}
      footer={
        edit ? (
          <Button label="Save" loading={busy} onPress={() => void finish()} />
        ) : (
          <>
            <Button label="Start my first scan" icon="center-focus-strong" loading={busy} onPress={() => void finish()} />
            <Button
              label="Skip for now"
              variant="secondary"
              onPress={() => void save(false).then((ok) => ok && router.replace('/home'))}
            />
          </>
        )
      }>
      <Txt variant="title" style={{ fontSize: 25, lineHeight: 28 }}>
        Anything your skin reacts to?
      </Txt>
      <ErrorBanner error={error} />
      <AvoidPicker value={avoid} onChange={setAvoid} />
      <Txt variant="heading" style={{ marginTop: space.sm }}>
        What do you use now?
      </Txt>
      <List>
        {PRODUCTS.map((p) => (
          <ToggleRow key={p.name} icon={p.icon} iconTone={p.tone} title={p.name} value={products.includes(p.name)} onChange={() => toggle(p.name)} />
        ))}
      </List>
    </Screen>
  );
}
