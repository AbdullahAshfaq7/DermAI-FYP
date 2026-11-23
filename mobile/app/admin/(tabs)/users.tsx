import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Filters, Loader, SearchField } from '@/components/admin';
import { Avatar, Button, EmptyState, IconButton, List, Row, Screen, StatusPill, Txt } from '@/components/ui/kit';
import { adminApi, DERM_STATUS_LABEL, ROLE_LABEL, useAdminQuery, usePageLimit, type UserRow } from '@/lib/admin';
import { space } from '@/theme/tokens';

const PAGE = 30;
type RoleFilter = '' | 'patient' | 'dermatologist' | 'admin';
type StatusFilter = '' | 'active' | 'suspended';

/** Every account on DermAI, searchable by name, email or id. */
export default function Users() {
  const params = useLocalSearchParams<{ role?: RoleFilter; status?: StatusFilter }>();
  const [role, setRole] = useState<RoleFilter>(params.role ?? '');
  const [status, setStatus] = useState<StatusFilter>(params.status ?? '');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');

  // Links from Overview set the filters (this tab stays mounted, so follow new params).
  const paramKey = `${params.role ?? ''}|${params.status ?? ''}`;
  const [seenParams, setSeenParams] = useState(paramKey);
  if (paramKey !== seenParams) {
    setSeenParams(paramKey);
    setRole(params.role ?? '');
    setStatus(params.status ?? '');
  }

  // Search after typing stops, so each key press doesn't hit the server.
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);
  const [limit, showMore] = usePageLimit([role, status, query].join('|'), PAGE);

  const { data, error, loading, reload } = useAdminQuery(() => adminApi.users({ role, status, q: query, limit }), [role, status, query, limit]);

  return (
    <Screen dock>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm }}>
        <Txt variant="display">Users</Txt>
        <IconButton icon="person-add" label="Add an account" onPress={() => router.push('/admin/new-user')} />
      </View>
      <SearchField value={q} onChange={setQ} placeholder="Search name, email or id" />
      <Filters
        value={role}
        onChange={setRole}
        options={[
          { value: '', label: 'Everyone' },
          { value: 'patient', label: 'Patients' },
          { value: 'dermatologist', label: 'Dermatologists' },
          { value: 'admin', label: 'Admins' },
        ]}
      />
      <Filters
        value={status}
        onChange={setStatus}
        options={[
          { value: '', label: 'Any status' },
          { value: 'active', label: 'Active' },
          { value: 'suspended', label: 'Suspended' },
        ]}
      />
      <Loader
        loading={loading}
        error={error}
        onRetry={() => void reload()}
        empty={<EmptyState icon="person-search" title="No accounts match" body="Try another name or clear the filters." />}>
        {data?.users.length ? (
          <>
            <Txt variant="small" color="secondary">
              {data.total} account{data.total === 1 ? '' : 's'}
            </Txt>
            <List>
              {data.users.map((u) => (
                <UserItem key={u.id} u={u} />
              ))}
            </List>
            {data.users.length < data.total ? <Button variant="secondary" label="Show more" loading={loading} onPress={showMore} /> : null}
          </>
        ) : null}
      </Loader>
    </Screen>
  );
}

function UserItem({ u }: { u: UserRow }) {
  return (
    <Row
      leading={<Avatar name={u.name} size={40} clinician={u.role === 'dermatologist'} />}
      title={u.name}
      subtitle={
        <View style={{ gap: 4 }}>
          <Txt variant="small" color="secondary" numberOfLines={1}>
            {u.email}
          </Txt>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <StatusPill label={ROLE_LABEL[u.role]} tone={u.role === 'admin' ? 'butter' : u.role === 'dermatologist' ? 'clinician' : 'brand'} />
            {u.dermStatus ? <StatusPill label={DERM_STATUS_LABEL[u.dermStatus]} tone={u.dermStatus === 'approved' ? 'good' : u.dermStatus === 'pending' ? 'watch' : 'neutral'} /> : null}
            {u.suspended ? <StatusPill label="Suspended" tone="act" icon="block" /> : null}
            {u.demo ? <StatusPill label="Demo" /> : null}
          </View>
        </View>
      }
      chevron
      label={`${u.name}, ${ROLE_LABEL[u.role]}${u.suspended ? ', suspended' : ''}`}
      onPress={() => router.push({ pathname: '/admin/user/[id]', params: { id: u.id } })}
    />
  );
}
