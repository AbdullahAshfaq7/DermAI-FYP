import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useApp } from '@/store/AppStore';

export default function PatientTabs() {
  const s = useApp();
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
