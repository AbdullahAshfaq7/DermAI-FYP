import { Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useApp } from '@/store/AppStore';

export default function DermTabs() {
  const s = useApp();
  const unread = s.threads.filter((t) => t.unreadForDoctor > 0).length;
  const waiting = s.derm.cases.filter((c) => c.status === 'waiting').length;
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar
          {...props}
          role="dermatologist"
          tabs={[
            { name: 'today', label: 'Today', icon: 'today' },
            { name: 'cases', label: 'Cases', icon: 'folder-shared', badge: waiting },
            { name: 'schedule', label: 'Schedule', icon: 'calendar-month' },
            { name: 'messages', label: 'Messages', icon: 'chat', badge: unread },
            { name: 'account', label: 'Me', icon: 'person' },
          ]}
        />
      )}>
      <Tabs.Screen name="today" />
      <Tabs.Screen name="cases" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
