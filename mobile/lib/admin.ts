/**
 * Admin portal client: typed calls for backend/app/routers/admin.py and a small loader hook.
 * Admin data isn't part of AppState (it's everyone's data), so screens fetch it directly.
 */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { del, errorMessage, get, patch, post } from '@/lib/api';

export type Role = 'patient' | 'dermatologist' | 'admin';
export type DermStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type ApptStatus = 'upcoming' | 'done' | 'cancelled';
export type PaymentStatus = 'due' | 'paid' | 'refunded';
export type CaseStatus = 'waiting' | 'replied' | 'closed';
export type Service = 'video' | 'clinic' | 'message';

export interface Paged {
  total: number;
  limit: number;
  offset: number;
}

export interface LogEntry {
  id: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  at: string;
}

export interface UserRow {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  city: string;
  demo: boolean;
  suspended: boolean;
  dermStatus: DermStatus | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface Overview {
  today: string;
  users: { total: number; patients: number; dermatologists: number; admins: number; suspended: number; newThisWeek: number };
  doctors: Record<DermStatus, number>;
  appointments: Record<ApptStatus, number> & { today: number };
  cases: Record<CaseStatus, number> & { urgentOpen: number };
  scans: { total: number; thisWeek: number; averageScore: number | null };
  revenue: { gross: number; paid: number; commissionPct: number; commission: number };
  recentUsers: UserRow[];
  activity: LogEntry[];
}

export interface DermDetail {
  id: string;
  userId: string;
  name: string;
  email: string;
  suspended: boolean;
  step: string;
  status: DermStatus;
  reviewNote: string;
  pmdc: string;
  qualification: string;
  clinic: string;
  city: string;
  bio: string;
  focus: string;
  specialties: string[];
  languages: string[];
  years: number;
  practisingSince: number | null;
  female: boolean | null;
  services: Record<Service, { on: boolean; fee: number }>;
  availability: Record<string, unknown>;
  rating: number;
  reviews: number;
  submittedAt: string | null;
  approvedAt: string | null;
  certificate: string | null;
  certificateName: string | null;
  degree: string | null;
  degreeName: string | null;
  cnic: string | null;
  cnicName: string | null;
  stats: { appointments: number; upcoming: number; cases: number; earned: number };
}

export interface ApptRow {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  service: Service;
  start: string;
  minutes: number;
  reason: string;
  status: ApptStatus;
  fee: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus | string;
  cancelledBy: string | null;
  rating: number | null;
  caseId: string | null;
  sharedScans: number;
  createdAt: string;
}

export interface CaseRow {
  id: string;
  number: string | null;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  complaint: string;
  summary: string;
  urgency: 'mild' | 'moderate' | 'urgent';
  flags: string[];
  status: CaseStatus;
  channel: string;
  receivedAt: string;
  assessed: boolean;
}

export interface CaseDetail extends CaseRow {
  ai: Record<string, unknown>;
  assessment: { note?: string; findings?: string[]; sentAt?: string } | null;
  photos: number;
  messages: { id: string; from: 'patient' | 'doctor'; text: string; at: string; hasPhoto: boolean; hasNote: boolean }[];
}

export interface ScanRow {
  id: string;
  userId: string;
  patientName: string;
  date: string;
  score: number;
  quality: string;
  confidence: number;
  concerns: Record<string, unknown>;
}

export interface UserDetail extends UserRow {
  avatarUrl: string | null;
  suspendedReason: string;
  consent: { adult?: boolean; train?: boolean; at?: string } | null;
  profile: Record<string, unknown> & { phone?: string; dob?: string; gender?: string; city?: string };
  settings: Record<string, unknown>;
  routinePrefs: Record<string, unknown>;
  activeSessions: number;
  counts: { scans: number; saved: number; aiMessages: number; notifications: number };
  scans: ScanRow[];
  appointments: ApptRow[];
  cases: CaseRow[];
  derm: DermDetail | null;
}

const qs = (p: Record<string, string | number | undefined>) => {
  const parts = Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

type Ok = { ok: true };

export const adminApi = {
  overview: () => get<Overview>('/admin/overview'),
  users: (p: { role?: string; q?: string; status?: string; limit?: number; offset?: number } = {}) => get<Paged & { users: UserRow[] }>(`/admin/users${qs(p)}`),
  user: (id: string) => get<UserDetail>(`/admin/users/${id}`),
  createUser: (b: { role: Role; name: string; email: string; password: string }) => post<Ok & { id: string }>('/admin/users', b),
  updateUser: (id: string, b: Partial<{ name: string; email: string; phone: string; dob: string; gender: string; city: string }>) => patch<Ok>(`/admin/users/${id}`, b),
  setPassword: (id: string, password: string) => post<Ok>(`/admin/users/${id}/password`, { password }),
  signOutUser: (id: string) => post<Ok>(`/admin/users/${id}/sign-out`),
  suspend: (id: string, reason: string) => post<Ok>(`/admin/users/${id}/suspend`, { reason }),
  restore: (id: string) => post<Ok>(`/admin/users/${id}/restore`),
  deleteUser: (id: string) => del<Ok>(`/admin/users/${id}`),

  derms: (status: DermStatus | 'all' = 'pending', q = '') => get<{ derms: DermDetail[] }>(`/admin/derms${qs({ status, q })}`),
  derm: (id: string) => get<DermDetail>(`/admin/derms/${id}`),
  approve: (id: string) => post<Ok>(`/admin/derms/${id}/approve`),
  reject: (id: string, note: string) => post<Ok>(`/admin/derms/${id}/reject`, { note }),
  updateDerm: (id: string, b: Partial<Omit<DermDetail, 'services'>> & { services?: DermDetail['services'] }) => patch<Ok>(`/admin/derms/${id}`, b),

  appointments: (p: { status?: string; service?: string; q?: string; limit?: number; offset?: number } = {}) => get<Paged & { appointments: ApptRow[] }>(`/admin/appointments${qs(p)}`),
  appointment: (id: string) => get<ApptRow>(`/admin/appointments/${id}`),
  cancelAppointment: (id: string, note: string) => post<Ok>(`/admin/appointments/${id}/cancel`, { note }),
  setPayment: (id: string, status: PaymentStatus) => post<Ok>(`/admin/appointments/${id}/payment`, { status }),

  cases: (p: { status?: string; urgency?: string; q?: string; limit?: number; offset?: number } = {}) => get<Paged & { cases: CaseRow[] }>(`/admin/cases${qs(p)}`),
  case: (id: string) => get<CaseDetail>(`/admin/cases/${id}`),
  setCaseStatus: (id: string, status: CaseStatus) => post<Ok>(`/admin/cases/${id}/status`, { status }),

  scans: (p: { user_id?: string; limit?: number; offset?: number } = {}) => get<Paged & { scans: ScanRow[] }>(`/admin/scans${qs(p)}`),
  deleteScan: (id: string) => del<Ok>(`/admin/scans/${id}`),

  broadcast: (b: { audience: 'all' | 'patients' | 'dermatologists'; title: string; body: string }) => post<Ok & { sent: number }>('/admin/broadcast', b),
  audit: (p: { limit?: number; offset?: number } = {}) => get<Paged & { entries: LogEntry[] }>(`/admin/audit${qs(p)}`),
};

/**
 * Loads `fn` when the screen gains focus and whenever `deps` change; `reload` refetches.
 * Keeps the last data while reloading so lists don't flash empty.
 */
export function useAdminQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps);

  const reload = useCallback(async () => {
    const n = ++seq.current;
    setLoading(true);
    try {
      const r = await load();
      if (n === seq.current) {
        setData(r);
        setError(null);
      }
    } catch (e) {
      if (n === seq.current) setError(errorMessage(e));
    } finally {
      if (n === seq.current) setLoading(false);
    }
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, error, loading, reload, setData };
}

/** "Show more" paging that starts over whenever the filters (`key`) change. */
export function usePageLimit(key: string, size: number) {
  const [more, setMore] = useState({ key, n: size });
  const limit = more.key === key ? more.n : size;
  return [limit, () => setMore({ key, n: limit + size })] as const;
}

export const ROLE_LABEL: Record<Role, string> = { patient: 'Patient', dermatologist: 'Dermatologist', admin: 'Admin' };
export const DERM_STATUS_LABEL: Record<DermStatus, string> = { draft: 'Onboarding', pending: 'Waiting for review', approved: 'Verified', rejected: 'Needs changes' };
export const ACTION_LABEL: Record<string, string> = {
  'user.create': 'Created account',
  'user.update': 'Edited account',
  'user.password': 'Set password',
  'user.sign_out': 'Signed out everywhere',
  'user.suspend': 'Suspended account',
  'user.restore': 'Restored account',
  'user.delete': 'Deleted account',
  'derm.approve': 'Verified doctor',
  'derm.reject': 'Sent doctor back',
  'derm.revoke': 'Revoked verification',
  'derm.update': 'Edited doctor profile',
  'appointment.cancel': 'Cancelled booking',
  'appointment.payment': 'Changed payment',
  'case.view': 'Opened case messages',
  'case.status': 'Changed case status',
  'scan.delete': 'Deleted scan',
  broadcast: 'Sent announcement',
};

export function dateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getFullYear()}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}
