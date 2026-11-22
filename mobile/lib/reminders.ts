/**
 * On-device reminders (FR-9): morning and evening routine, rescan, and one hour before a visit.
 * They follow the person's settings and quiet hours. Remote push (EAS) is a later step; see docs/NEXT.md.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { AppState } from '@/store/state';

let lastSignature = '';
let handlerSet = false;

function clock(s: string): { hour: number; minute: number } | null {
  const m = /^\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*$/i.exec(s);
  if (!m) return null;
  const h = (Number(m[1]) % 12) + (m[3].toLowerCase() === 'pm' ? 12 : 0);
  return { hour: h, minute: Number(m[2] ?? 0) };
}

/** Moves a time out of quiet hours to the minute quiet hours end. */
export function outsideQuiet(t: { hour: number; minute: number }, quiet: boolean, from: string, to: string) {
  if (!quiet) return t;
  const f = clock(from);
  const e = clock(to);
  if (!f || !e) return t;
  const m = t.hour * 60 + t.minute;
  const fm = f.hour * 60 + f.minute;
  const em = e.hour * 60 + e.minute;
  const inside = fm <= em ? m >= fm && m < em : m >= fm || m < em;
  return inside ? e : t;
}

export async function syncReminders(s: AppState | null): Promise<void> {
  if (Platform.OS === 'web') return;
  const st = s?.settings;
  const prefs = s?.routinePrefs;
  const visits = (s?.appointments ?? []).filter((a) => a.status === 'upcoming' && a.service !== 'message').map((a) => a.start);
  const sig = JSON.stringify(s ? [st, prefs?.amTime, prefs?.pmTime, visits, s.scans[0]?.date] : null);
  if (sig === lastSignature) return;
  lastSignature = sig;
  try {
    if (!handlerSet) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
      });
      handlerSet = true;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!s || !st || !prefs) return;
    const wanted = st.remindAm || st.remindPm || st.remindRescan || visits.length > 0;
    if (!wanted) return;
    let perm = await Notifications.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return;

    const daily = async (time: string, title: string, body: string, url: string) => {
      const t = clock(time);
      if (!t) return;
      const { hour, minute } = outsideQuiet(t, st.quiet, st.quietFrom, st.quietTo);
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data: { url } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    };
    const at = async (date: Date, title: string, body: string, url: string) => {
      if (date.getTime() <= Date.now() + 60000) return;
      await Notifications.scheduleNotificationAsync({ content: { title, body, data: { url } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date } });
    };

    if (st.remindAm) await daily(prefs.amTime, 'Morning routine', 'Your morning steps are ready. SPF before you leave.', '/routine');
    if (st.remindPm) await daily(prefs.pmTime, 'Evening routine', 'Time for your evening steps.', '/routine');
    const last = s.scans[0];
    if (st.remindRescan && last) {
      const due = new Date(last.date);
      due.setDate(due.getDate() + st.rescanDays);
      const t = outsideQuiet({ hour: 9, minute: 0 }, st.quiet, st.quietFrom, st.quietTo);
      due.setHours(t.hour, t.minute, 0, 0);
      await at(due, 'Time to rescan', `It's been ${st.rescanDays} days since your last scan.`, '/scan');
    }
    for (const a of s.appointments.filter((x) => x.status === 'upcoming' && x.service !== 'message')) {
      const d = new Date(a.start);
      d.setHours(d.getHours() - 1);
      await at(d, 'Visit in 1 hour', a.service === 'video' ? 'Your video visit starts in an hour.' : 'Your clinic visit is in an hour.', `/booked/${a.id}`);
    }
  } catch {
    // Reminders are best-effort; Expo Go and simulators may not support every trigger.
    lastSignature = '';
  }
}
