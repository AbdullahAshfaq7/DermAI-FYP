import { useState } from 'react';
import { View } from 'react-native';

import { CaseRow, URGENCY_RANK } from '@/components/derm';
import { Chip, EmptyState, List, Screen, Segmented, Txt } from '@/components/ui/kit';
import type { Case } from '@/data/types';
import { useApp } from '@/store/AppStore';
import { space } from '@/theme/tokens';

/** H2 Case inbox: colour bar shows urgency from referral rules. */
export default function Cases() {
  const s = useApp();
  const [tab, setTab] = useState<Case['status']>('waiting');
  const [channel, setChannel] = useState<'all' | 'video' | 'message'>('all');
  const count = (st: Case['status']) => s.derm.cases.filter((c) => c.status === st).length;
  const list = s.derm.cases
    .filter((c) => c.status === tab)
    .filter((c) => channel === 'all' || c.channel === channel)
    .sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || a.receivedAt.localeCompare(b.receivedAt));

  return (
    <Screen dock>
      <Txt variant="display" style={{ marginTop: space.sm }}>
        Cases
      </Txt>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'waiting', label: `Waiting ${count('waiting') || ''}`.trim() },
          { value: 'replied', label: 'Replied' },
          { value: 'closed', label: 'Closed' },
        ]}
      />
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        <Chip label="By urgency" icon="sort" selected={channel === 'all'} onPress={() => setChannel('all')} />
        <Chip label="Video" selected={channel === 'video'} onPress={() => setChannel(channel === 'video' ? 'all' : 'video')} />
        <Chip label="Message" selected={channel === 'message'} onPress={() => setChannel(channel === 'message' ? 'all' : 'message')} />
      </View>
      {list.length ? (
        <List>
          {list.map((c) => (
            <CaseRow key={c.id} c={c} />
          ))}
        </List>
      ) : (
        <EmptyState icon="folder-open" title={tab === 'waiting' ? 'No cases waiting' : `No ${tab} cases`} body={tab === 'waiting' ? 'When a patient books or shares scans with you, the case lands here.' : 'Cases move here after you send an assessment.'} />
      )}
      {tab === 'waiting' ? (
        <Txt variant="small" color="secondary">
          Message reviews are due within 24 hours of the patient sending them.
        </Txt>
      ) : null}
    </Screen>
  );
}
