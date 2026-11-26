import { Redirect, Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { homeFor } from '@/lib/nav';
import { useStore } from '@/store/AppStore';

/** Only a signed-in patient sees these tabs; anyone else (signed out, other role) goes to their own start screen. */
export default function PatientTabs() {
  const { state: s, ready } = useStore();
  if (!ready) return null;
  if (s.session?.role !== 'patient') return <Redirect href={homeFor(s)} />;
  const unread = s.threads.reduce((n, t) => n + t.unreadForPatient, 0);
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar
          {...props}
          role="patient"
          tabs={[
            { name: 'home', label: 'Home', icon: 'home' },
            { name: 'routine', label: 'Routine', icon: 'spa' },
            { name: 'care', label: 'Care', icon: 'stethoscope', badge: unread },
            { name: 'me', label: 'Me', icon: 'person-outline', iconOn: 'person' },
          ]}
        />
      )}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="routine" />
      <Tabs.Screen name="care" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
