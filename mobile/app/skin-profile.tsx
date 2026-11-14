import { router } from 'expo-router';
import { View } from 'react-native';

import { List, Row, Screen, TopBar, Txt } from '@/components/ui/kit';
import { CONCERNS, FITZ_ROMAN, SKIN_TONES } from '@/data/seed';
import { fitzpatrick } from '@/theme/colors';
import { useApp } from '@/store/AppStore';

/** Skin profile summary (from Me). Each row reopens its onboarding step (B1 to B3) in edit mode. */
export default function SkinProfile() {
  const { profile } = useApp();
  return (
    <Screen header={<TopBar title="Skin profile" />}>
      <Txt variant="body" color="secondary">
        These shape every result and routine. Change them any time.
      </Txt>
      <List>
        <Row
          leading={<View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: profile.tone != null ? fitzpatrick[profile.tone] : 'transparent', borderWidth: profile.tone == null ? 1 : 0 }} />}
          title="Skin tone"
          subtitle={profile.tone != null ? `${SKIN_TONES[profile.tone]} · Fitzpatrick ${FITZ_ROMAN[profile.tone]}` : 'Not set'}
          chevron
          onPress={() => router.push({ pathname: '/setup/tone', params: { edit: '1' } })}
        />
        <Row
          icon="face"
          title="Skin type and concerns"
          subtitle={[profile.feel ?? 'Type not set', profile.concerns.map((c) => CONCERNS[c].label).join(', ')].filter(Boolean).join(' · ')}
          chevron
          onPress={() => router.push({ pathname: '/setup/type', params: { edit: '1' } })}
        />
        <Row
          icon="block"
          title="Allergies and current routine"
          subtitle={[profile.avoid.length ? `Avoids ${profile.avoid.join(', ').toLowerCase()}` : 'Nothing to avoid', profile.current].filter(Boolean).join(' · ')}
          chevron
          onPress={() => router.push({ pathname: '/setup/allergies', params: { edit: '1' } })}
        />
      </List>
    </Screen>
  );
}
