import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppTheme } from '@/theme/useAppTheme';
import { spacing } from '@/theme/tokens';

interface ProfileHeaderProps {
  title: string;
  onEditPress?: () => void;
}

export function ProfileHeader({ title, onEditPress }: ProfileHeaderProps) {
  const { colors } = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        },
        editButton: {
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
        },
        pressed: {
          opacity: 0.75,
        },
      }),
    [],
  );

  return (
    <View style={styles.header}>
      <AppText variant="title" weight="700" style={{ fontSize: 22 }}>
        {title}
      </AppText>
      {onEditPress ? (
        <Pressable
          onPress={onEditPress}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          hitSlop={8}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
          <Ionicons name="create-outline" size={22} color={colors.icon} />
        </Pressable>
      ) : (
        <View style={styles.editButton} />
      )}
    </View>
  );
}
