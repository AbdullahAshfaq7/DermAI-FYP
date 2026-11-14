import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, Button, EmptyState, IconButton, IconTile, List, Row, Screen, Stat, TopBar, Txt } from '@/components/ui/kit';
import { DOCTORS, SERVICE_META } from '@/data/seed';
import type { ServiceType } from '@/data/types';
import { pkr } from '@/lib/format';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** E4 Doctor profile: three ways to get care, priced up front. Also the dermatologist's public-profile preview. */
export default function DoctorProfile() {
  const { colors } = useTheme();
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const s = useApp();
  const { toggleFavorite } = useActions();
  const d = DOCTORS.find((x) => x.id === id);
  const [service, setService] = useState<ServiceType | null>(d?.services[0]?.type ?? null);

  if (!d) {
    return (
      <Screen header={<TopBar />}>
        <EmptyState icon="person-search" title="Doctor not found" body="They may no longer be taking patients." />
      </Screen>
    );
  }
  const fav = s.favorites.includes(d.id);

  return (
    <Screen
      header={
        <TopBar
          title={preview ? 'What patients see' : undefined}
          right={
            preview ? null : (
              <IconButton icon={fav ? 'favorite' : 'favorite-border'} label={fav ? 'Remove from favourites' : 'Add to favourites'} color={fav ? colors.actIcon : undefined} onPress={() => toggleFavorite(d.id)} />
            )
          }
        />
      }
      footer={preview ? null : <Button label="Book a visit" disabled={!service} onPress={() => router.push({ pathname: '/book/[id]', params: { id: d.id, service: service ?? 'video' } })} />}>
      <View style={{ flexDirection: 'row', gap: space.lg, alignItems: 'center' }}>
        <Avatar name={d.name} size={72} tone={d.tone} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="title">{d.name}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="verified" size={16} color={colors.brand} />
            <Txt variant="smallStrong" color="brand">
              PMDC {d.pmdc}
            </Txt>
          </View>
          <Txt variant="small" color="secondary">
            {d.qualifications}
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={`${d.years} yrs`} label="Practice" />
        <Stat value={String(d.rating)} label={`${d.reviews} reviews`} />
        <Stat value={`${d.replyHours} hrs`} label="Replies in" />
      </View>
      <Txt variant="body" color="secondary">
        {d.bio}
      </Txt>
      <List>
        {d.services.map((x) => {
          const selected = service === x.type;
          return (
            <Row
              key={x.type}
              leading={<IconTile icon={SERVICE_META[x.type].icon} />}
              title={SERVICE_META[x.type].title}
              subtitle={x.detail}
              onPress={preview ? undefined : () => setService(x.type)}
              label={`${SERVICE_META[x.type].title}, ${pkr(x.fee)}${selected ? ', selected' : ''}`}
              right={
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Txt variant="bodyStrong">{pkr(x.fee)}</Txt>
                  {!preview ? <Icon name={selected ? 'radio-button-checked' : 'radio-button-unchecked'} size={18} color={selected ? colors.brand : colors.textMuted} /> : null}
                </View>
              }
            />
          );
        })}
      </List>
    </Screen>
  );
}
