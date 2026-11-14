import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Avatar, EmptyState, Field, List, Row, Screen, Txt } from '@/components/ui/kit';
import { shortPatient } from '@/components/derm';
import { relativeStamp } from '@/lib/format';
import { useApp } from '@/store/AppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

/** H7 Messages: thread view mirrors E7 with a case panel. */
export default function Messages() {
  const { colors } = useTheme();
  const s = useApp();
  const [q, setQ] = useState('');
  const threads = s.threads
    .filter((t) => !q.trim() || t.patientName.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (b.messages.at(-1)?.at ?? '').localeCompare(a.messages.at(-1)?.at ?? ''));

  return (
    <Screen>
      <Txt variant="title" style={{ marginTop: space.sm }}>
        Messages
      </Txt>
      <Field label="Search patients" value={q} onChangeText={setQ} right={<Icon name="search" size={20} color={colors.textMuted} />} />
      {threads.length === 0 ? (
        <EmptyState icon="chat" title="No messages" body="Patients you're seeing can message you here." />
      ) : (
        <List>
          {threads.map((t) => {
            const last = t.messages.at(-1);
            const unread = t.unreadForDoctor > 0;
            const preview = last ? `${last.from === 'doctor' ? 'You: ' : ''}${last.attachment ? 'Sent 1 photo' : last.text}` : 'New case';
            return (
              <Row
                key={t.id}
                leading={<Avatar name={t.patientName} size={44} />}
                title={<Txt variant={unread ? 'bodyStrong' : 'body'}>{shortPatient(t.patientName)}</Txt>}
                subtitle={
                  <Txt variant={unread ? 'smallStrong' : 'small'} color={unread ? 'primary' : 'secondary'} numberOfLines={1}>
                    {preview}
                  </Txt>
                }
                right={
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Txt variant="caption" color="muted">
                      {last ? relativeStamp(last.at) : ''}
                    </Txt>
                    {unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.clinician }} /> : null}
                  </View>
                }
                onPress={() => router.push({ pathname: '/inbox/[id]', params: { id: t.id } })}
              />
            );
          })}
        </List>
      )}
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Icon name="schedule" size={18} color={colors.textMuted} />
        <Txt variant="small" color="secondary" style={{ flex: 1 }}>
          Patients see &quot;Usually replies in 2 hrs&quot;. Set your hours in Me.
        </Txt>
      </View>
    </Screen>
  );
}
