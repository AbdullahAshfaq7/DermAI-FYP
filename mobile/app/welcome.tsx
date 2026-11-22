import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Screen, Txt } from '@/components/ui/kit';
import { FaceMap, LogoMark, MapTag } from '@/components/visual';
import { radius, space } from '@/theme/tokens';

const DEMO_ZONES = { forehead: 'Mild', nose: 'Moderate', leftCheek: 'Clear', rightCheek: 'Mild', chin: 'Moderate' } as const;

/** A2 Welcome: shows the face map up front so people see what they'll get. */
export default function Welcome() {
  const [w, setW] = useState(0);
  return (
    <Screen
      footer={
        <>
          <Button label="Get started" onPress={() => router.push('/role')} />
          <Button label="I already have an account" variant="secondary" onPress={() => router.push('/log-in')} />
        </>
      }>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
        <LogoMark size={30} />
      </View>
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ backgroundColor: '#150E26', borderRadius: radius.sheet, height: 300, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {w ? <FaceMap zones={DEMO_ZONES} width={w} height={300} density={26} /> : null}
        <MapTag label="T-zone, moderate" level="Moderate" style={{ left: 16, top: 70 }} />
        <MapTag label="Cheek, clear" level="Clear" style={{ right: 16, top: 160 }} />
        <MapTag label="Chin, moderate" level="Moderate" style={{ left: 24, bottom: 30 }} />
      </View>
      <Txt variant="display" style={{ marginTop: space.xs }}>
        Know your skin in a minute.
      </Txt>
      <Txt variant="body" color="secondary">
        Scan your face, get a routine built for your skin tone, and talk to a verified dermatologist when you need one.
      </Txt>
    </Screen>
  );
}
