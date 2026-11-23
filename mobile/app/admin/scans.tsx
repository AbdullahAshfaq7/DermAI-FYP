import { router } from 'expo-router';
import { useState } from 'react';

import { cap, confirm, Loader } from '@/components/admin';
import { Banner, Button, Chip, EmptyState, ErrorBanner, List, Row, Screen, TopBar, Txt } from '@/components/ui/kit';
import { adminApi, dateTime, useAdminQuery } from '@/lib/admin';
import { useSubmit } from '@/lib/useSubmit';

const PAGE = 30;

/** Scan scores across all patients. Photos stay on patients' phones and are never shown here. */
export default function AdminScans() {
  const [limit, setLimit] = useState(PAGE);
  const { data, error, loading, reload } = useAdminQuery(() => adminApi.scans({ limit }), [limit]);
  const act = useSubmit();

  return (
    <Screen header={<TopBar title="Scans" />}>
      <Banner icon="lock" tone="brand" text="Only scores are shown. Scan photos stay on each patient's phone." />
      <ErrorBanner error={act.error} />
      <Loader loading={loading} error={error} onRetry={() => void reload()} empty={<EmptyState icon="camera-alt" title="No scans yet" body="Scans appear here once patients take them." />}>
        {data?.scans.length ? (
          <>
            <Txt variant="small" color="secondary">
              {data.total} scan{data.total === 1 ? '' : 's'}
            </Txt>
            <List>
              {data.scans.map((s) => (
                <Row
                  key={s.id}
                  icon="camera-alt"
                  iconTone="muted"
                  title={`${s.patientName} · score ${s.score}`}
                  subtitle={`${dateTime(s.date)} · ${cap(s.quality)} quality`}
                  onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: s.userId } })}
                  action={
                    <Chip
                      label="Delete"
                      onPress={() =>
                        confirm('Delete this scan?', 'Its scores are removed for the patient and any doctor it was shared with.', 'Delete', () =>
                          void act.run(async () => {
                            await adminApi.deleteScan(s.id);
                            await reload();
                          }),
                        )
                      }
                    />
                  }
                />
              ))}
            </List>
            {data.scans.length < data.total ? <Button variant="secondary" label="Show more" loading={loading} onPress={() => setLimit((n) => n + PAGE)} /> : null}
          </>
        ) : null}
      </Loader>
    </Screen>
  );
}
