import Constants from 'expo-constants';
import { View } from 'react-native';

import { Card, Screen, TopBar, Txt } from '@/components/ui/kit';
import { LogoMark, Wordmark } from '@/components/visual';
import { space } from '@/theme/tokens';

/** Help and about, including the privacy summary and terms linked from A5. */
export default function About() {
  return (
    <Screen header={<TopBar title="Help and about" />}>
      <View style={{ alignItems: 'center', gap: space.sm, marginVertical: space.md }}>
        <LogoMark size={64} />
        <Wordmark size={30} tagline center />
        <Txt variant="small" color="secondary">
          Version {Constants.expoConfig?.version ?? '1.0.0'}
        </Txt>
      </View>
      <Card>
        <Txt variant="bodyStrong">Guidance, not diagnosis</Txt>
        <Txt variant="small" color="secondary" style={{ marginTop: 4 }}>
          DermAI explains what your photos show and suggests a routine. It is not a medical device and does not diagnose or treat skin conditions. For anything that hurts, bleeds, spreads or changes shape, see a dermatologist.
        </Txt>
      </Card>
      <Txt variant="heading">Privacy in short</Txt>
      <Card tone="muted">
        <Txt variant="small" color="secondary">
          Your photos are visible only to you and to a dermatologist you choose to share a case with. Photos are deleted after 30 days unless you choose to keep them; scores stay until you delete them. We never use your photos to train the model unless you opt in, and you can download or delete everything from Privacy and data.
        </Txt>
      </Card>
      <Txt variant="heading">Terms in short</Txt>
      <Card tone="muted">
        <Txt variant="small" color="secondary">
          You must be 18, or have a parent&apos;s consent. Doctor fees are set by each dermatologist and shown before you book. Free cancellation ends 2 hours before a visit. The full privacy policy and terms will be published before launch.
        </Txt>
      </Card>
      <Txt variant="caption" color="muted" align="center">
        Final Year Project, BS Computer Science, University of Management and Technology, Lahore.
      </Txt>
    </Screen>
  );
}
