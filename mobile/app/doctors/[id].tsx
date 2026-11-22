import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/Icon';
import { Avatar, Button, EmptyState, IconButton, IconTile, OptionCard, Screen, Stat, TopBar, Txt, type IconTone } from '@/components/ui/kit';
import type { ServiceType } from '@/data/types';
import { pkr } from '@/lib/format';
import { doctorById } from '@/lib/selectors';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

const WAY: Record<ServiceType, { title: string; icon: IconName; tone: IconTone }> = {
  message: { title: 'Photo review', icon: 'chat', tone: 'clinician' },
  video: { title: 'Video visit', icon: 'videocam', tone: 'brand' },
  clinic: { title: 'Clinic visit', icon: 'location-on', tone: 'peach' },
};
const ORDER: ServiceType[] = ['message', 'video', 'clinic'];

/** E4 Doctor profile: three ways to get care, priced up front. Also the dermatologist's own preview. */
export default function DoctorProfile() {
  const { colors } = useTheme();
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const s = useApp();
  const { toggleFavorite } = useActions();
  const d = doctorById(s, id);
  const [service, setService] = useState<ServiceType | null>(d?.services.find((x) => x.type === 'video')?.type ?? d?.services[0]?.type ?? null);

  if (!d) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="person-search" title="Doctor not found" body="They may no longer be taking patients." />
      </Screen>
    );
  }
  const fav = s.favorites.includes(d.id);
  const services = [...d.services].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
  const patients = d.patients ?? 0;

  return (
    <Screen
      header={
        <TopBar
          title={preview ? 'What patients see' : undefined}
          right={
            preview ? null : (
              <IconButton icon={fav ? 'favorite' : 'favorite-border'} label={fav ? 'Remove from favourites' : 'Add to favourites'} color={fav ? colors.actIcon : undefined} onPress={() => attempt(toggleFavorite(d.id))} />
            )
          }
        />
      }
      footer={
        preview ? null : (
          <Button
            label={service === 'message' ? 'Send my case' : `Pick a time for ${service === 'clinic' ? 'the clinic' : 'video'}`}
            disabled={!service}
            onPress={() => router.push({ pathname: '/book/[id]', params: { id: d.id, service: service ?? 'video' } })}
          />
        )
      }>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <Avatar name={d.name} size={68} tone={d.tone} uri={d.photoUrl} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title">{d.name}</Txt>
          <Txt variant="small" color="secondary">
            {d.qualifications}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Icon name="verified" size={15} color={colors.clinician} />
            <Txt variant="smallStrong" color="clinician">
              PMDC {d.pmdc}
            </Txt>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={d.reviews ? String(d.rating) : 'New'} label={d.reviews ? `${d.reviews} reviews` : 'No reviews yet'} />
        <Stat value={d.years ? String(d.years) : '–'} label="years" />
        <Stat value={patients >= 1000 ? `${(patients / 1000).toFixed(1)}k` : String(patients)} label="patients" />
      </View>
      <Txt variant="small" color="secondary">
        {d.languages?.length ? `Speaks ${d.languages.join(' and ').replace(/ and (?=.* and )/g, ', ')}. ` : ''}
        {d.bio}
      </Txt>
      <Txt variant="heading">Ways to get care</Txt>
      {services.map((x) => (
        <OptionCard
          key={x.type}
          title={WAY[x.type].title}
          subtitle={x.type === 'message' ? 'Written reply within 24 h' : x.detail}
          selected={service === x.type}
          onPress={() => (preview ? undefined : setService(x.type))}
          right={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <IconTile icon={WAY[x.type].icon} tone={WAY[x.type].tone} size={30} />
              <Txt variant="heading">{pkr(x.fee).replace('PKR', 'Rs')}</Txt>
            </View>
          }
        />
      ))}
    </Screen>
  );
}
