/**
 * App state, backed by the DermAI API. The server is the source of truth: every action calls the API
 * and replaces local state with the fresh `AppState` it returns. A copy is cached on the device so
 * the app opens instantly and still shows the last data when offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState as RNAppState } from 'react-native';

import type { Appointment, Assessment, Availability, PaymentMethod, Role, SavedItem, Scan, ServiceType } from '@/data/types';
import { api, ApiError, currentRefreshToken, del, get, loadTokens, patch, photoPart, post, put, setSignedOutHandler, setTokens, upload, type FilePart } from '@/lib/api';
import { localPhoto, purgeLocalPhotos, removeLocalPhoto, removeUserPhotos, saveLocalPhoto } from '@/lib/localPhotos';
import { syncReminders } from '@/lib/reminders';
import { initialState, STATE_VERSION, todayKey, type AppState, type Profile, type RoutinePrefs, type Settings } from '@/store/state';

const CACHE_KEY = 'dermai-cache-v3';
const POLL_MS = 15000;

type Updater = (s: AppState) => AppState;
type WithState<T = object> = T & { state: AppState };
type Tokens = { accessToken: string; refreshToken: string };

export interface QualityCheck {
  key: 'face' | 'focus' | 'light';
  label: string;
  ok: boolean;
  note?: string;
}

export interface PhotoCheck {
  uploadId: string;
  checks: QualityCheck[];
  dim: boolean;
}

export interface LiveCheck {
  checks: { key: 'light' | 'steady' | 'framing'; label: string; ok: boolean }[];
  ready: boolean;
  hint: string;
}

interface Store {
  state: AppState;
  ready: boolean;
  /** False when the last attempt to reach the server failed. */
  online: boolean;
  actions: ReturnType<typeof makeActions>;
}

const StoreContext = createContext<Store | null>(null);

let tempId = 0;
const localId = (p: string) => `${p}-local-${Date.now()}-${++tempId}`;

function makeActions(ctx: {
  set: (fn: Updater) => void;
  get: () => AppState;
  run: <T extends WithState>(call: () => Promise<T>, optimistic?: Updater) => Promise<T>;
  signedIn: (r: WithState<Tokens>) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const { set, get: read, run } = ctx;
  return {
    refresh: ctx.refresh,

    /* ───── Account ───── */
    chooseRole(role: Role) {
      set((s) => ({ ...s, pendingRole: role }));
    },
    async signUp(name: string, email: string, password: string) {
      const role = read().pendingRole ?? 'patient';
      const r = await api<WithState<Tokens>>('POST', '/auth/register', { json: { role, name, email, password } }, { auth: false });
      await ctx.signedIn(r);
    },
    async logIn(email: string, password: string): Promise<AppState> {
      const r = await api<WithState<Tokens>>('POST', '/auth/login', { json: { email, password } }, { auth: false });
      await ctx.signedIn(r);
      return r.state;
    },
    logOut: ctx.signOut,
    async forgotPassword(email: string): Promise<{ devCode?: string }> {
      return api('POST', '/auth/forgot', { json: { email } }, { auth: false });
    },
    async resetPassword(email: string, code: string, password: string) {
      await api('POST', '/auth/reset', { json: { email, code, password } }, { auth: false });
    },
    async changePassword(current: string, password: string) {
      const r = await run(() => post<WithState<Tokens>>('/auth/change-password', { current, password }));
      await setTokens({ accessToken: r.accessToken, refreshToken: r.refreshToken });
    },
    async deleteAccount(password: string) {
      const userId = read().session?.id;
      await del('/auth/account', { password });
      if (userId) await removeUserPhotos(userId);
      await setTokens(null);
      await ctx.signOut();
    },
    giveConsent: (adult: boolean, train: boolean) => run(() => post<WithState>('/me/consent', { adult, train })),
    exportData: () => api<unknown>('GET', '/me/export').then((j) => JSON.stringify(j, null, 2)),

    /* ───── Profile and settings ───── */
    updateProfile: (p: Partial<Profile>) => run(() => patch<WithState>('/me/profile', p), (s) => ({ ...s, profile: { ...s.profile, ...p } })),
    updatePersonal: (p: { name: string; email: string; phone: string; dob: string; gender: string; city: string }) => run(() => put<WithState>('/me/personal', p)),
    setAvatar: (uri: string) => run(() => upload<WithState>('/me/avatar', { photo: photoPart(uri, 'avatar.jpg') })),
    removeAvatar: () => run(() => del<WithState>('/me/avatar')),
    updateSettings: (p: Partial<Settings>) => run(() => patch<WithState>('/me/settings', p), (s) => ({ ...s, settings: { ...s.settings, ...p } })),
    updatePrefs: (p: Partial<RoutinePrefs>) => run(() => patch<WithState>('/me/routine-prefs', p), (s) => ({ ...s, routinePrefs: { ...s.routinePrefs, ...p } })),

    /* ───── Scans ───── */
    /** Uploads the photo and runs the quality checks. Throws ApiError (code photo_unusable, extra.checks) for unusable photos. */
    async checkPhoto(uri: string): Promise<PhotoCheck> {
      return upload<PhotoCheck>('/scans/check', { photo: photoPart(uri, 'scan.jpg') });
    },
    /** Live camera check on a small preview frame (nothing is stored). */
    precheck(uri: string): Promise<LiveCheck> {
      return api<LiveCheck>('POST', '/scans/precheck', { form: { photo: photoPart(uri, 'frame.jpg') } }, { timeoutMs: 8000 });
    },
    /** Scores the checked photo. The server drops its copy; this phone keeps `localUri` (phone-first). */
    async runAnalysis(uploadId: string, localUri?: string): Promise<Scan> {
      const r = await run(() => api<WithState<{ scanId: string }>>('POST', '/scans', { json: { uploadId } }, { timeoutMs: 60000 }));
      const userId = r.state.session?.id;
      if (localUri && userId) await saveLocalPhoto(r.scanId, localUri, userId).catch(() => {});
      return r.state.scans.find((x) => x.id === r.scanId)!;
    },
    async deleteScan(id: string) {
      const r = await run(() => del<WithState>(`/scans/${id}`), (s) => ({ ...s, scans: s.scans.filter((x) => x.id !== id) }));
      await removeLocalPhoto(id);
      return r;
    },
    /** Sends the phone's copy of shared scans so the doctor can see the photos. */
    async uploadSharedPhotos(scanIds: string[]) {
      let latest: AppState | null = null;
      for (const id of scanIds) {
        const p = localPhoto(id);
        if (!p) continue;
        try {
          latest = (await upload<WithState>(`/scans/${id}/photo`, { photo: photoPart(p.uri, `${id}.jpg`) })).state;
        } catch {
          // The booking stands; the doctor sees the scores and can ask for the photo.
        }
      }
      if (latest) set((s) => ({ ...latest!, pendingRole: s.pendingRole }));
    },

    /* ───── Routine and saved ───── */
    toggleStep(stepId: string) {
      const day = todayKey();
      return run(
        () => post<WithState>('/me/routine/toggle', { day, stepId }),
        (s) => {
          const done = s.routineLog[day] ?? [];
          return { ...s, routineLog: { ...s.routineLog, [day]: done.includes(stepId) ? done.filter((x) => x !== stepId) : [...done, stepId] } };
        },
      );
    },
    toggleSaved(item: SavedItem) {
      const { id: _id, ...body } = item;
      return run(
        () => post<WithState>('/me/saved/toggle', body),
        (s) => ({ ...s, saved: s.saved.some((x) => x.title === item.title) ? s.saved.filter((x) => x.title !== item.title) : [item, ...s.saved] }),
      );
    },
    toggleFavorite: (doctorId: string) =>
      run(
        () => post<WithState>(`/me/favorites/${doctorId}/toggle`),
        (s) => ({ ...s, favorites: s.favorites.includes(doctorId) ? s.favorites.filter((x) => x !== doctorId) : [...s.favorites, doctorId] }),
      ),
    /** Puts a step back into the routine (from Saved). */
    restoreStep: (stepId: string) => {
      const prefs = read().routinePrefs;
      return run(() => patch<WithState>('/me/routine-prefs', { removed: prefs.removed.filter((x) => x !== stepId), length: 6 }));
    },

    /* ───── Care ───── */
    async slots(doctorId: string, service: 'video' | 'clinic', days = 7) {
      return get<{ days: { date: string; slots: { iso: string; label: string; taken: boolean }[] }[] }>(`/doctors/${doctorId}/slots?service=${service}&days=${days}`);
    },
    async book(input: { doctorId: string; service: ServiceType; start?: string; reason: string; shareScanIds: string[]; paymentMethod: PaymentMethod }): Promise<Appointment> {
      const r = await run(() => post<WithState<{ appointmentId: string }>>('/appointments', input));
      // Phone-first: shared scans' photos go up now, only to this doctor.
      void (async () => {
        for (const id of input.shareScanIds) {
          const p = localPhoto(id);
          if (!p) continue;
          await upload(`/scans/${id}/photo`, { photo: photoPart(p.uri, `${id}.jpg`) }).catch(() => {});
        }
      })();
      return r.state.appointments.find((a) => a.id === r.appointmentId)!;
    },
    cancelAppointment: (id: string) => run(() => post<WithState>(`/appointments/${id}/cancel`)),
    rateAppointment: (id: string, stars: number) => run(() => post<WithState>(`/appointments/${id}/rate`, { stars })),
    stopSharing: (doctorId: string) => run(() => del<WithState>(`/me/shares/${doctorId}`), (s) => ({ ...s, shares: s.shares.filter((x) => x.doctorId !== doctorId) })),
    sendMessage(threadId: string, text: string, photoUri?: string) {
      const from = read().session?.role === 'dermatologist' ? ('doctor' as const) : ('patient' as const);
      const form: Record<string, string | FilePart> = { text };
      if (photoUri) form.photo = photoPart(photoUri, 'photo.jpg');
      return run(
        () => upload<WithState>(`/threads/${threadId}/messages`, form),
        (s) => ({
          ...s,
          threads: s.threads.map((t) =>
            t.id === threadId
              ? { ...t, messages: [...t.messages, { id: localId('m'), from, text: text || 'Sent a photo', at: new Date().toISOString(), attachment: photoUri, pending: true }] }
              : t,
          ),
        }),
      );
    },
    markThreadRead(threadId: string) {
      const s = read();
      const t = s.threads.find((x) => x.id === threadId);
      const doctor = s.session?.role === 'dermatologist';
      if (!t || (doctor ? t.unreadForDoctor === 0 : t.unreadForPatient === 0)) return Promise.resolve();
      return run(
        () => post<WithState>(`/threads/${threadId}/read`),
        (st) => ({
          ...st,
          threads: st.threads.map((x) => (x.id === threadId ? { ...x, [doctor ? 'unreadForDoctor' : 'unreadForPatient']: 0 } : x)),
          derm: doctor ? { ...st.derm, readThreads: [...new Set([...st.derm.readThreads, threadId])] } : st.derm,
        }),
      ).then(() => undefined);
    },
    askAi: (text: string) =>
      run(
        () => post<WithState>('/ai/chat', { text }),
        (s) => ({ ...s, aiChat: [...s.aiChat, { id: localId('m'), from: 'patient', text, at: new Date().toISOString(), pending: true }] }),
      ),
    clearAi: () => run(() => del<WithState>('/ai/chat'), (s) => ({ ...s, aiChat: [] })),
    markNotificationRead: (id: string) =>
      run(() => post<WithState>(`/me/notifications/${id}/read`), (s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
    markAllNotificationsRead: () =>
      run(() => post<WithState>('/me/notifications/read-all'), (s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

    /* ───── Dermatologist ───── */
    dermProfile: (input: { name: string; specialties: string[]; languages?: string[] }) => run(() => put<WithState>('/derm/profile', input)),
    dermCredentials: (input: { pmdc: string; qualification: string; clinic: string; since?: string; certificate?: FilePart | null; degree?: FilePart | null; cnic?: FilePart | null }) =>
      run(() =>
        upload<WithState>('/derm/credentials', {
          pmdc: input.pmdc,
          qualification: input.qualification,
          clinic: input.clinic,
          since: input.since ?? '',
          certificate: input.certificate,
          degree: input.degree,
          cnic: input.cnic,
        }),
      ),
    dermServices: (services: Record<ServiceType, { on: boolean; fee: number }>) => run(() => put<WithState>('/derm/services', { services })),
    setAvailability: (a: Availability) => run(() => put<WithState>('/derm/availability', a), (s) => ({ ...s, derm: { ...s.derm, availability: a } })),
    addBlock: (input: { start: string; minutes: number; label: string }) => run(() => post<WithState>('/derm/blocked', input)),
    removeBlock: (id: string) => run(() => del<WithState>(`/derm/blocked/${id}`)),
    saveDraft: (caseId: string, draft: Assessment) => run(() => put<WithState>(`/derm/cases/${caseId}/draft`, strip(draft))),
    sendAssessment: (caseId: string, a: Assessment) => run(() => post<WithState>(`/derm/cases/${caseId}/assessment`, strip(a))),
    setCaseStatus: (caseId: string, status: 'closed' | 'waiting') =>
      run(
        () => post<WithState>(`/derm/cases/${caseId}/status`, { status }),
        (s) => ({ ...s, derm: { ...s.derm, cases: s.derm.cases.map((c) => (c.id === caseId ? { ...c, status } : c)) } }),
      ),
  };
}

function strip(a: Assessment) {
  return {
    findings: a.findings,
    aiRating: a.aiRating,
    note: a.note,
    stop: a.stop,
    keep: a.keep,
    changes: (a.changes ?? []).map((c) => ({ action: c.action, stepId: c.stepId ?? null, title: c.title, detail: c.detail ?? '', period: c.period ?? 'pm', weeks: c.weeks ?? null })),
    rescanWeeks: a.rescanWeeks ?? null,
  };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  // Always the latest state: every change goes through `set`, which updates it.
  const ref = useRef(state);
  const getState = useCallback(() => ref.current, []);
  // Responses are applied in request order, so a slow poll never overwrites a newer change.
  const seq = useRef(0);
  const applied = useRef(0);

  const set = useCallback((fn: Updater) => {
    setState((s) => {
      const next = fn(s);
      ref.current = next;
      return next;
    });
  }, []);

  const apply = useCallback(
    (n: number, server: AppState) => {
      if (n < applied.current) return;
      applied.current = n;
      set((s) => ({ ...server, pendingRole: s.pendingRole }));
    },
    [set],
  );

  const refresh = useCallback(async () => {
    const n = ++seq.current;
    try {
      const r = await get<WithState>('/me/state');
      setOnline(true);
      apply(n, r.state);
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) setOnline(false);
    }
  }, [apply]);

  const run = useCallback(
    async <T extends WithState>(call: () => Promise<T>, optimistic?: Updater): Promise<T> => {
      const n = ++seq.current;
      const before = ref.current;
      if (optimistic) set(optimistic);
      try {
        const r = await call();
        setOnline(true);
        apply(n, r.state);
        return r;
      } catch (e) {
        if (e instanceof ApiError && e.status === 0) setOnline(false);
        if (optimistic) {
          // Undo the optimistic change unless newer server data has arrived since; then resync.
          if (applied.current < n && seq.current === n) set(() => before);
          void refresh();
        }
        throw e;
      }
    },
    [apply, set, refresh],
  );

  const signOut = useCallback(async () => {
    const token = currentRefreshToken();
    if (token) void api('POST', '/auth/logout', { json: { refreshToken: token } }, { auth: false }).catch(() => {});
    await setTokens(null);
    seq.current++;
    applied.current = seq.current;
    set(() => initialState);
    AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
    void syncReminders(null);
  }, [set]);

  const signedIn = useCallback(
    async (r: WithState<Tokens>) => {
      await setTokens({ accessToken: r.accessToken, refreshToken: r.refreshToken });
      apply(++seq.current, r.state);
    },
    [apply],
  );

  // Restore: cached state first (instant), then the server's.
  useEffect(() => {
    let cancelled = false;
    setSignedOutHandler(() => {
      seq.current++;
      applied.current = seq.current;
      set(() => initialState);
      AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
    });
    (async () => {
      const hasTokens = await loadTokens();
      if (hasTokens) {
        let cachedOk = false;
        try {
          const raw = await AsyncStorage.getItem(CACHE_KEY);
          const cached = raw ? (JSON.parse(raw) as AppState) : null;
          if (cached?.version === STATE_VERSION && !cancelled) {
            set(() => cached);
            cachedOk = true;
          }
        } catch {
          // A broken cache just means we wait for the server.
        }
        // With a cached copy the app opens straight away and refreshes in the background.
        if (cachedOk) {
          if (!cancelled) setReady(true);
          void refresh();
          return;
        }
        await refresh();
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
      setSignedOutHandler(null);
    };
  }, [refresh, set]);

  // Cache for the next launch.
  useEffect(() => {
    if (!ready || !state.session) return;
    const t = setTimeout(() => AsyncStorage.setItem(CACHE_KEY, JSON.stringify(state)).catch(() => {}), 400);
    return () => clearTimeout(t);
  }, [state, ready]);

  // Keep threads, cases and notifications fresh while the app is open.
  const signedInNow = !!state.session;
  useEffect(() => {
    if (!signedInNow) return;
    let timer: ReturnType<typeof setInterval> | null = setInterval(() => void refresh(), POLL_MS);
    const sub = RNAppState.addEventListener('change', (st) => {
      if (st === 'active') {
        void refresh();
        timer ??= setInterval(() => void refresh(), POLL_MS);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    return () => {
      if (timer) clearInterval(timer);
      sub.remove();
    };
  }, [signedInNow, refresh]);

  // Keep scan photos on this phone only as long as the person chose.
  const sessionId = state.session?.id;
  const retention = state.settings.photoRetention;
  useEffect(() => {
    if (ready && sessionId && retention) void purgeLocalPhotos(sessionId, retention);
  }, [ready, sessionId, retention]);

  // On-device reminders follow the person's settings.
  useEffect(() => {
    if (!ready) return;
    void syncReminders(state.session?.role === 'patient' ? state : null);
  }, [ready, state.session?.role, state.settings, state.routinePrefs, state.appointments, state.scans]); // eslint-disable-line react-hooks/exhaustive-deps

  // makeActions only calls `get` later, inside action handlers, never while rendering.
  // eslint-disable-next-line react-hooks/refs
  const actions = useMemo(() => makeActions({ set, get: getState, run, signedIn, signOut, refresh }), [set, getState, run, signedIn, signOut, refresh]);
  const value = useMemo(() => ({ state, ready, online, actions }), [state, ready, online, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside AppStoreProvider');
  return ctx;
}

export const useApp = () => useStore().state;
export const useActions = () => useStore().actions;
