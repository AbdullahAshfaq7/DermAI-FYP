import { useState } from 'react';

import { SettingsScreenHeader } from '@/components/settings/SettingsScreenHeader';
import { SettingsSection } from '@/components/settings/SettingsSection';
import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow';
import { AppCard } from '@/components/ui/AppCard';
import { AppScreen } from '@/components/ui/AppScreen';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/tokens';

export default function NotificationsSettingsScreen() {
  const [scanReminders, setScanReminders] = useState(true);
  const [routineReminders, setRoutineReminders] = useState(true);
  const [recommendationUpdates, setRecommendationUpdates] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  return (
    <AppScreen scroll edges={['top', 'bottom']} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <SettingsScreenHeader
        title="Notification Settings"
        subtitle="Manage reminders, alerts, and quiet hours."
      />

      <SettingsSection title="Reminders">
        <SettingsToggleRow
          title="Scan reminders"
          subtitle="Get nudges to repeat your skin scan on schedule"
          value={scanReminders}
          onValueChange={setScanReminders}
        />
        <SettingsToggleRow
          title="Routine reminders"
          subtitle="Morning and evening skincare step alerts"
          value={routineReminders}
          onValueChange={setRoutineReminders}
          isLast
        />
      </SettingsSection>

      <SettingsSection title="Updates">
        <SettingsToggleRow
          title="Recommendation updates"
          subtitle="When new personalized guidance is available"
          value={recommendationUpdates}
          onValueChange={setRecommendationUpdates}
        />
        <SettingsToggleRow
          title="Product and feature updates"
          subtitle="Occasional news about dermAI improvements"
          value={productUpdates}
          onValueChange={setProductUpdates}
          isLast
        />
      </SettingsSection>

      <AppCard muted>
        <AppText variant="caption" color="muted" weight="600" style={{ marginBottom: spacing.xs }}>
          QUIET HOURS
        </AppText>
        <AppText variant="body" weight="500">
          10:00 PM – 7:00 AM
        </AppText>
        <AppText variant="caption" color="secondary" style={{ marginTop: spacing.xs }}>
          Reminders are paused during quiet hours.
        </AppText>
      </AppCard>
    </AppScreen>
  );
}
