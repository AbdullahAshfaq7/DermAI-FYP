import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

import { TabBar } from '@/components/TabBar';
import { adminApi } from '@/lib/admin';

export default function AdminTabs() {
  // The pending-doctor badge refreshes when the tabs mount; the Doctors screen reloads on focus.
  const [pending, setPending] = useState(0);
  useEffect(() => {
    adminApi
      .overview()
      .then((o) => setPending(o.doctors.pending))
      .catch(() => {});
  }, []);
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar
          {...props}
          role="admin"
          tabs={[
            { name: 'index', label: 'Overview', icon: 'dashboard' },
            { name: 'users', label: 'Users', icon: 'people-outline', iconOn: 'people' },
            { name: 'doctors', label: 'Doctors', icon: 'verified-user', badge: pending },
            { name: 'bookings', label: 'Bookings', icon: 'event' },
            { name: 'more', label: 'More', icon: 'menu' },
          ]}
        />
      )}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="users" />
      <Tabs.Screen name="doctors" />
      <Tabs.Screen name="bookings" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
