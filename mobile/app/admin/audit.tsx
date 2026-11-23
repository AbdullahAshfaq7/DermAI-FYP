import { useState } from 'react';

import { Loader } from '@/components/admin';
import { Button, EmptyState, List, Row, Screen, TopBar, Txt } from '@/components/ui/kit';
import { ACTION_LABEL, adminApi, dateTime, useAdminQuery } from '@/lib/admin';

const PAGE = 50;

/** Every change an admin has made, newest first. */
export default function AdminAudit() {
  const [limit, setLimit] = useState(PAGE);
  const { data, error, loading, reload } = useAdminQuery(() => adminApi.audit({ limit }), [limit]);
  return (
    <Screen header={<TopBar title="Audit log" />}>
      <Loader loading={loading} error={error} onRetry={() => void reload()} empty={<EmptyState icon="history" title="Nothing yet" body="Admin changes and case views are recorded here." />}>
        {data?.entries.length ? (
          <>
            <Txt variant="small" color="secondary">
              {data.total} entr{data.total === 1 ? 'y' : 'ies'}
            </Txt>
            <List>
              {data.entries.map((e) => (
                <Row
                  key={e.id}
                  icon="history"
                  iconTone={e.action.endsWith('delete') || e.action.endsWith('suspend') || e.action.endsWith('revoke') ? 'act' : 'muted'}
                  title={ACTION_LABEL[e.action] ?? e.action}
                  subtitle={`${e.adminName} · ${dateTime(e.at)}${e.targetId ? ` · ${e.targetId}` : ''}${e.detail ? `\n${e.detail}` : ''}`}
                />
              ))}
            </List>
            {data.entries.length < data.total ? <Button variant="secondary" label="Show more" loading={loading} onPress={() => setLimit((n) => n + PAGE)} /> : null}
          </>
        ) : null}
      </Loader>
    </Screen>
  );
}
