import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { ImageWithFallback } from '@/components/home/ImageWithFallback';
import { IMAGES } from '@/constants/images';
import { useAppTheme } from '@/theme/useAppTheme';
import { radius, spacing } from '@/theme/tokens';

interface ProfileIdentityCardProps {
  name: string;
  email: string;
  status: string;
  onEditProfile?: () => void;
}

export function ProfileIdentityCard({
  name,
  email,
  status,
  onEditProfile,
}: ProfileIdentityCardProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          alignItems: 'center',
          marginBottom: spacing.lg,
        },
        avatar: {
          width: 88,
          height: 88,
          borderRadius: 44,
          marginBottom: spacing.md,
          borderWidth: 3,
          borderColor: colors.primarySoft,
        },
        statusBadge: {
          marginTop: spacing.sm,
          backgroundColor: colors.successSoft,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          borderRadius: radius.full,
        },
        buttonWrap: {
          width: '100%',
          marginTop: spacing.lg,
        },
      }),
    [colors],
  );

  return (
    <AppCard style={styles.card}>
      <ImageWithFallback
        source={IMAGES.avatar}
        style={styles.avatar}
        fallbackColors={[colors.primarySoft, colors.infoSoft]}
        accessibilityLabel="User avatar"
      />
      <AppText variant="title" weight="700">
        {name}
      </AppText>
      <AppText variant="caption" color="secondary">
        {email}
      </AppText>
      <View style={styles.statusBadge}>
        <AppText variant="tiny" color="success" weight="600">
          {status}
        </AppText>
      </View>
      <View style={styles.buttonWrap}>
        <AppButton label="Edit Profile" variant="secondary" onPress={onEditProfile} icon="person-outline" />
      </View>
    </AppCard>
  );
}
