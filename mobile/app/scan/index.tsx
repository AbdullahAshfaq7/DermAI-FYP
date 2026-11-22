import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import type { IconName } from '@/components/ui/Icon';
import { Button, Card, IconTile, Screen, Tick, TopBar, Txt, type IconTone } from '@/components/ui/kit';
import { pickFromLibrary } from '@/lib/photos';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const TIPS: { icon: IconName; tone: IconTone; title: string; body: string }[] = [
  { icon: 'wb-sunny', tone: 'butter', title: 'Face a window', body: 'Daylight in front of you, no lamp behind.' },
  { icon: 'face-retouching-off', tone: 'peach', title: 'Bare skin', body: 'No makeup. Hair off your forehead.' },
  { icon: 'straighten', tone: 'brand', title: "Arm's length", body: "About 30 cm. We'll tell you if you're too close." },
];

/** C1 Scan guide: shown before every scan; can be hidden after the third. */
export default function ScanGuide() {
  const { guideSeen, scans, settings } = useApp();
  const { updateSettings } = useActions();
  const [busy, setBusy] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (settings.skipGuide) router.replace('/scan/camera');
  }, [settings.skipGuide]);

  const go = (to: () => void) => {
    if (hide) attempt(updateSettings({ skipGuide: true }));
    to();
  };

  const upload = async () => {
    setBusy(true);
    try {
      const uri = await pickFromLibrary();
      if (uri) go(() => router.push({ pathname: '/scan/review', params: { uri } }));
    } catch {
      Alert.alert("Couldn't open that photo", 'Try another one, or take a new photo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      edges={['top']}
      header={<TopBar left="close" onLeft={() => router.back()} right={<Txt variant="small" color="muted">Scan {scans.length + 1}</Txt>} />}
      footer={
        <>
          <Button label="Open camera" icon="photo-camera" onPress={() => go(() => router.push('/scan/camera'))} />
          <Button label="Upload a photo instead" variant="ghost" loading={busy} onPress={() => void upload()} />
        </>
      }>
      <Txt variant="display">Three things for a clear scan</Txt>
      {TIPS.map((t) => (
        <Card key={t.title} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <IconTile icon={t.icon} tone={t.tone} size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="bodyStrong">{t.title}</Txt>
            <Txt variant="small" color="secondary">
              {t.body}
            </Txt>
          </View>
        </Card>
      ))}
      {guideSeen >= 3 ? (
        <Pressable
          onPress={() => setHide((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: hide }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44 }}>
          <Tick on={hide} size={22} />
          <Txt variant="small" color="secondary">
            Don&apos;t show this again
          </Txt>
        </Pressable>
      ) : null}
    </Screen>
  );
}
