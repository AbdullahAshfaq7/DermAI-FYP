import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, IconTile, Screen, TopBar, Txt } from '@/components/ui/kit';
import type { IconName } from '@/components/ui/Icon';
import { pickFromLibrary } from '@/lib/photos';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

const TIPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'light-mode', title: 'Face a window', body: 'Daylight, no lamp behind you' },
  { icon: 'face-retouching-off', title: 'Bare skin', body: 'No makeup, glasses pushed up' },
  { icon: 'straighten', title: 'Arm\'s length', body: 'Hold still for two seconds' },
];

/** C1 Scan guide: shown before every scan, skippable after the third. */
export default function ScanGuide() {
  const { guideSeen } = useApp();
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    setBusy(true);
    try {
      const uri = await pickFromLibrary();
      if (uri) router.push({ pathname: '/scan/review', params: { uri } });
    } catch {
      Alert.alert('Couldn\'t open that photo', 'Try another one, or take a new photo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      edges={['top']}
      header={
        <TopBar
          left="close"
          onLeft={() => router.back()}
          title="Before you scan"
          right={guideSeen >= 3 ? <Txt variant="small" color="secondary" onPress={() => router.replace('/scan/camera')}>Skip</Txt> : null}
        />
      }
      footer={
        <>
          <Button label="Open camera" variant="brand" icon="photo-camera" onPress={() => router.push('/scan/camera')} />
          <Button label="Upload a photo instead" variant="ghost" loading={busy} onPress={upload} />
        </>
      }>
      <View style={{ gap: space.xl, marginTop: space.lg }}>
        {TIPS.map((t) => (
          <View key={t.title} style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}>
            <IconTile icon={t.icon} size={52} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="heading">{t.title}</Txt>
              <Txt variant="body" color="secondary">
                {t.body}
              </Txt>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}
