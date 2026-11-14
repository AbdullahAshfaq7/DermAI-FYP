import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { DEMO_DOCTOR_EMAIL, DEMO_PATIENT, DOCTORS } from '@/data/seed';
import type { Appointment, Assessment, Message, Role, SavedItem, Scan, ServiceType } from '@/data/types';
import { reply as aiReply } from '@/lib/ai';
import { analysePhoto } from '@/lib/analysis';
import { dayMonth, time, weekdayDayMonth } from '@/lib/format';
import { demoDoctorState, demoPatientState, initialState, STATE_VERSION, todayKey, type AppState } from '@/store/state';

const STORAGE_KEY = 'dermai-state-v2';

type Updater = (s: AppState) => AppState;

interface Store {
  state: AppState;
  ready: boolean;
  update: (fn: Updater) => void;
  actions: ReturnType<typeof makeActions>;
}

const StoreContext = createContext<Store | null>(null);

const uid = (p: string) => `${p}-${Date.now()}-${Math.round(Math.random() * 1e4)}`;

function makeActions(update: (fn: Updater) => void, get: () => AppState) {
  return {
    chooseRole(role: Role) {
      update((s) => ({ ...s, pendingRole: role }));
    },
    signUp(name: string, email: string) {
      update((s) => ({
        ...initialState,
        pendingRole: s.pendingRole,
        session: { role: s.pendingRole ?? 'patient', name: s.pendingRole === 'dermatologist' && !/^dr\.?\s/i.test(name) ? `Dr. ${name}` : name, email, demo: false },
      }));
    },
    /** No auth server yet: the two demo emails load seeded accounts, anything else signs in as a new patient. */
    logIn(email: string): Role {
      const e = email.trim().toLowerCase();
      if (e === DEMO_DOCTOR_EMAIL) {
        update(() => demoDoctorState());
        return 'dermatologist';
      }
      if (e === DEMO_PATIENT.email || e === '') {
        update(() => demoPatientState());
        return 'patient';
      }
      update(() => ({ ...demoPatientState(), session: { role: 'patient', name: e.split('@')[0] ?? 'You', email: e, demo: false } }));
      return 'patient';
    },
    logOut() {
      update(() => initialState);
    },
    giveConsent(adult: boolean, train: boolean) {
      update((s) => ({ ...s, consent: { adult, train, at: new Date().toISOString() }, settings: { ...s.settings, train } }));
    },
    runAnalysis(photoUri: string, dim: boolean): Scan {
      const s = get();
      const scan = analysePhoto(s.scans[0], s.profile, photoUri, dim);
      update((st) => ({
        ...st,
        scans: [scan, ...st.scans],
        guideSeen: st.guideSeen + 1,
        notifications: [
          { id: uid('n'), icon: 'insights', title: 'Your results are ready', body: `Scan from ${dayMonth(scan.date)} scored ${scan.score}`, at: scan.date, href: `/scan/results/${scan.id}`, read: false },
          ...st.notifications,
        ],
      }));
      return scan;
    },
    deleteScan(id: string) {
      update((s) => ({ ...s, scans: s.scans.filter((x) => x.id !== id) }));
    },
    toggleStep(stepId: string) {
      const key = todayKey();
      update((s) => {
        const done = s.routineLog[key] ?? [];
        return { ...s, routineLog: { ...s.routineLog, [key]: done.includes(stepId) ? done.filter((x) => x !== stepId) : [...done, stepId] } };
      });
    },
    toggleSaved(item: SavedItem) {
      update((s) => ({
        ...s,
        saved: s.saved.some((x) => x.title === item.title) ? s.saved.filter((x) => x.title !== item.title) : [item, ...s.saved],
      }));
    },
    toggleFavorite(doctorId: string) {
      update((s) => ({ ...s, favorites: s.favorites.includes(doctorId) ? s.favorites.filter((x) => x !== doctorId) : [...s.favorites, doctorId] }));
    },
    book(input: { doctorId: string; service: ServiceType; start: string; reason: string; shareScanIds: string[] }): Appointment {
      const s = get();
      const doctor = DOCTORS.find((d) => d.id === input.doctorId)!;
      const svc = doctor.services.find((x) => x.type === input.service)!;
      const appt: Appointment = {
        id: uid('appt'),
        doctorId: doctor.id,
        patientName: s.session?.name ?? 'You',
        service: input.service,
        start: input.start,
        minutes: input.service === 'video' ? 20 : input.service === 'clinic' ? 30 : 0,
        reason: input.reason,
        sharedScanIds: input.shareScanIds,
        status: 'upcoming',
        fee: svc.fee,
      };
      update((st) => {
        const existing = st.threads.find((t) => t.doctorId === doctor.id);
        const threads = existing
          ? st.threads.map((t) => (t.id === existing.id ? { ...t, sharedScans: Math.max(t.sharedScans, input.shareScanIds.length) } : t))
          : [
              {
                id: uid('thread'),
                doctorId: doctor.id,
                patientName: appt.patientName,
                caseTitle: input.reason || 'New case',
                sharedScans: input.shareScanIds.length,
                unreadForPatient: 0,
                unreadForDoctor: 1,
                messages: [],
              },
              ...st.threads,
            ];
        const until = new Date(input.start);
        until.setDate(until.getDate() + 30);
        const shares = input.shareScanIds.length
          ? [...st.shares.filter((x) => x.doctorId !== doctor.id), { doctorId: doctor.id, scanIds: input.shareScanIds, until: until.toISOString() }]
          : st.shares;
        return {
          ...st,
          appointments: [appt, ...st.appointments],
          threads,
          shares,
          notifications: [
            { id: uid('n'), icon: 'event-available', title: 'Visit booked', body: input.service === 'message' ? `Case review with ${doctor.name}` : `${weekdayDayMonth(input.start)}, ${time(input.start)}`, at: new Date().toISOString(), href: `/booked/${appt.id}`, read: false },
            ...st.notifications,
          ],
        };
      });
      return appt;
    },
    cancelAppointment(id: string) {
      update((s) => ({ ...s, appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)) }));
    },
    stopSharing(doctorId: string) {
      update((s) => ({ ...s, shares: s.shares.filter((x) => x.doctorId !== doctorId) }));
    },
    sendMessage(threadId: string, from: 'patient' | 'doctor', text: string, attachment?: string) {
      const msg: Message = { id: uid('m'), from, text, at: new Date().toISOString(), attachment };
      update((s) => ({
        ...s,
        threads: s.threads.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: [...t.messages, msg],
                unreadForDoctor: from === 'patient' ? t.unreadForDoctor + 1 : 0,
                unreadForPatient: from === 'doctor' ? t.unreadForPatient + 1 : 0,
              }
            : t,
        ),
        derm: from === 'doctor' ? { ...s.derm, readThreads: [...new Set([...s.derm.readThreads, threadId])] } : s.derm,
      }));
    },
    markThreadRead(threadId: string, by: 'patient' | 'doctor') {
      update((s) => ({
        ...s,
        threads: s.threads.map((t) => (t.id === threadId ? { ...t, [by === 'patient' ? 'unreadForPatient' : 'unreadForDoctor']: 0 } : t)),
        derm: by === 'doctor' ? { ...s.derm, readThreads: [...new Set([...s.derm.readThreads, threadId])] } : s.derm,
      }));
    },
    askAi(text: string) {
      const s = get();
      const user: Message = { id: uid('m'), from: 'patient', text, at: new Date().toISOString() };
      update((st) => ({ ...st, aiChat: [...st.aiChat, user] }));
      const r = aiReply(text, s.scans[0], s.profile);
      setTimeout(() => {
        update((st) => ({ ...st, aiChat: [...st.aiChat, { id: uid('m'), from: 'ai', text: r.text, at: new Date().toISOString(), referral: r.referral }] }));
      }, 900);
    },
    markNotificationRead(id: string) {
      update((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    },
    markAllNotificationsRead() {
      update((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    },
    saveDraft(caseId: string, draft: Assessment) {
      update((s) => ({ ...s, derm: { ...s.derm, cases: s.derm.cases.map((c) => (c.id === caseId ? { ...c, draft } : c)) } }));
    },
    /** Sends the doctor's assessment: closes the case for now, posts the note to the patient's thread, and applies "stop" changes. */
    sendAssessment(caseId: string, a: Assessment) {
      const sent = { ...a, sentAt: new Date().toISOString() };
      update((s) => {
        const c = s.derm.cases.find((x) => x.id === caseId);
        const threads = c?.threadId
          ? s.threads.map((t) =>
              t.id === c.threadId
                ? {
                    ...t,
                    unreadForPatient: t.unreadForPatient + 1,
                    messages: [...t.messages, { id: uid('m'), from: 'doctor' as const, text: a.note, at: sent.sentAt, note: { stop: a.stop, keep: a.keep } }],
                  }
                : t,
            )
          : s.threads;
        return {
          ...s,
          threads,
          derm: { ...s.derm, cases: s.derm.cases.map((x) => (x.id === caseId ? { ...x, status: 'replied', assessment: sent, draft: undefined } : x)) },
        };
      });
    },
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as AppState;
        if (parsed.version === STATE_VERSION) setState(parsed);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state, ready]);

  const update = useCallback((fn: Updater) => {
    setState((s) => {
      const next = fn(s);
      ref.current = next;
      return next;
    });
  }, []);

  const actions = useMemo(() => makeActions(update, () => ref.current), [update]);
  const value = useMemo(() => ({ state, ready, update, actions }), [state, ready, update, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}

export const useApp = () => useStore().state;
export const useActions = () => useStore().actions;
