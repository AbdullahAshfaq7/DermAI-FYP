import { View } from 'react-native';

import { EmptyState, IconTile, List, Row, Screen, TopBar, Txt, type IconTone } from '@/components/ui/kit';
import { daysBetween, relativeStamp } from '@/lib/format';
import { go } from '@/lib/nav';
import { attempt } from '@/lib/useSubmit';
import { useActions, useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

function toneFor(icon: string): IconTone {
  if (/event|stethoscope|assignment|verified/.test(icon)) return 'clinician';
  if (/sunny|light-mode|fire/.test(icon)) return 'peach';
  if (/dark-mode/.test(icon)) return 'butter';
  if (/camera|calendar/.test(icon)) return 'muted';
  if (/error|busy/.test(icon)) return 'act';
  return 'brand';
}

/** F2 Notifications: grouped by day; each opens the screen it's about. */
export default function Notifications() {
  const { colors } = useTheme();
  const s = useApp();
  const { markNotificationRead, markAllNotificationsRead } = useActions();
  const list = [...s.notifications].sort((a, b) => b.at.localeCompare(a.at));
  const today = list.filter((n) => daysBetween(n.at, new Date()) <= 0);
  const week = list.filter((n) => daysBetween(n.at, new Date()) > 0 && daysBetween(n.at, new Date()) < 7);
  const earlier = list.filter((n) => daysBetween(n.at, new Date()) >= 7);
  const anyUnread = list.some((n) => !n.read);

  const section = (title: string, items: typeof list) =>
    items.length ? (
      <View style={{ gap: space.sm }}>
        <Txt variant="smallStrong" color="secondary">
          {title}
        </Txt>
        <List>
          {items.map((n) => (
            <Row
              key={n.id}
              leading={<IconTile icon={n.icon} size={36} tone={toneFor(n.icon)} />}
              title={n.title}
              subtitle={n.body}
              right={
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Txt variant="caption" color="muted">
                    {relativeStamp(n.at)}
                  </Txt>
                  {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand }} accessibilityLabel="Unread" /> : null}
                </View>
              }
              onPress={() => {
                if (!n.read) markNotificationRead(n.id).catch(() => {});
                go(n.href);
              }}
            />
          ))}
        </List>
      </View>
    ) : null;

  return (
    <Screen
      header={
        <TopBar
          right={
            anyUnread ? (
              <Txt variant="smallStrong" color="brand" onPress={() => attempt(markAllNotificationsRead())} style={{ padding: space.sm }}>
                Mark all read
              </Txt>
            ) : null
          }
        />
      }>
      <Txt variant="display">Notifications</Txt>
      {list.length === 0 ? (
        <EmptyState icon="notifications-none" title="Nothing yet" body="Scan results, routine reminders and doctor replies will show up here." />
      ) : (
        <>
          {section('Today', today)}
          {section('This week', week)}
          {section('Earlier', earlier)}
        </>
      )}
    </Screen>
  );
}
