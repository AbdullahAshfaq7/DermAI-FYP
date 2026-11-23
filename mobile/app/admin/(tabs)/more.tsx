import { router } from 'expo-router';
import { Alert } from 'react-native';

import { Avatar, Card, List, Row, Screen, Txt } from '@/components/ui/kit';
import { resetTo } from '@/lib/nav';
import { useActions, useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** Cases, scans, announcements, the audit log and the admin's own account. */
export default function More() {
  const s = useApp();
  const { logOut } = useActions();
  return (
    <Screen dock>
      <Txt variant="display" style={{ marginTop: space.sm }}>
        More
      </Txt>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <Avatar name={s.session?.name ?? 'Admin'} size={48} />
        <Txt variant="heading" style={{ flex: 1 }}>
          {s.session?.name}
          {'\n'}
          <Txt variant="small" color="secondary">
            {s.session?.email} · Admin
          </Txt>
        </Txt>
      </Card>
      <List>
        <Row icon="inbox" title="Cases" subtitle="Every patient case and its messages" chevron onPress={() => router.push('/admin/cases')} />
        <Row icon="camera-alt" title="Scans" subtitle="Scan scores across all patients" chevron onPress={() => router.push('/admin/scans')} />
        <Row icon="campaign" title="Send an announcement" subtitle="Notify patients, doctors or everyone" chevron onPress={() => router.push('/admin/broadcast')} />
        <Row icon="history" title="Audit log" subtitle="Every change made by an admin" chevron onPress={() => router.push('/admin/audit')} />
        <Row icon="person-add" title="Add an account" subtitle="Patient, dermatologist or admin" chevron onPress={() => router.push('/admin/new-user')} />
      </List>
      <List>
        <Row icon="lock" iconTone="muted" title="Change my password" chevron onPress={() => router.push('/change-password')} />
        <Row
          icon="logout"
          destructive
          title="Log out"
          onPress={() =>
            Alert.alert('Log out?', 'You will need your admin password to come back.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Log out',
                style: 'destructive',
                onPress: async () => {
                  await logOut();
                  resetTo('/welcome');
                },
              },
            ])
          }
        />
      </List>
    </Screen>
  );
}
