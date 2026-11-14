import {
  DEFAULT_AVAILABILITY,
  DEMO_APPOINTMENTS,
  DEMO_CASES,
  DEMO_NOTIFICATIONS,
  DEMO_PATIENT,
  DEMO_SAVED,
  DEMO_SCANS,
  DEMO_THREADS,
  DEMO_VISITS,
} from '@/data/seed';
import type {
  AppNotification,
  Appointment,
  Availability,
  Case,
  ConcernKey,
  Message,
  Role,
  SavedItem,
  Scan,
  ServiceType,
  SkinType,
  Thread,
  Visit,
} from '@/data/types';
import { todayKey } from '@/lib/format';

export { todayKey };

export const STATE_VERSION = 2;

/** Demo dates are written around 15 Nov 2026. Shift upcoming ones so the demo stays current on any day. */
const DEMO_ANCHOR = new Date('2026-11-15T00:00:00+05:00');
function rebase(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const anchor = new Date(DEMO_ANCHOR);
  anchor.setHours(0, 0, 0, 0);
  const shift = Math.round((today.getTime() - anchor.getTime()) / 86400000);
  if (shift <= 0) return iso;
  const d = new Date(iso);
  d.setDate(d.getDate() + shift);
  return d.toISOString();
}

export interface Profile {
  tone: number | null;
  feel: SkinType | null;
  concerns: ConcernKey[];
  avoid: string[];
  current: string | null;
  done: boolean;
  phone: string;
  dob: string;
  gender: string;
  city: string;
}

export interface RoutinePrefs {
  amTime: string;
  pmTime: string;
  length: 3 | 4 | 6;
  budget: 'Low' | 'Medium' | 'Any';
  rebuild: boolean;
  /** Steps a doctor or the user removed from the routine. */
  removed: string[];
}

export interface Settings {
  remindAm: boolean;
  remindPm: boolean;
  remindRescan: boolean;
  rescanDays: number;
  quiet: boolean;
  quietFrom: string;
  quietTo: string;
  keepPhotos: boolean;
  train: boolean;
  language: 'English' | 'Urdu';
}

export interface Share {
  doctorId: string;
  scanIds: string[];
  until: string;
}

export interface DermProfile {
  step: 'profile' | 'credentials' | 'services' | 'done';
  status: 'draft' | 'pending' | 'approved';
  specialties: string[];
  photo: boolean;
  pmdc: string;
  qualification: string;
  clinic: string;
  certificate: string | null;
  cnic: string | null;
  services: Record<ServiceType, { on: boolean; fee: number }>;
  availability: Availability;
  cases: Case[];
  visits: Visit[];
  /** Thread ids the doctor has read. */
  readThreads: string[];
}

export interface AppState {
  version: number;
  session: { role: Role; name: string; email: string; demo: boolean } | null;
  pendingRole: Role | null;
  consent: { adult: boolean; train: boolean; at: string } | null;
  profile: Profile;
  scans: Scan[];
  guideSeen: number;
  routineLog: Record<string, string[]>;
  streakBase: number;
  routinePrefs: RoutinePrefs;
  settings: Settings;
  shares: Share[];
  saved: SavedItem[];
  favorites: string[];
  appointments: Appointment[];
  threads: Thread[];
  aiChat: Message[];
  notifications: AppNotification[];
  derm: DermProfile;
}

const emptyProfile: Profile = {
  tone: null,
  feel: null,
  concerns: [],
  avoid: [],
  current: null,
  done: false,
  phone: '',
  dob: '',
  gender: '',
  city: '',
};

const defaultDerm: DermProfile = {
  step: 'profile',
  status: 'draft',
  specialties: [],
  photo: false,
  pmdc: '',
  qualification: '',
  clinic: '',
  certificate: null,
  cnic: null,
  services: { video: { on: true, fee: 3000 }, clinic: { on: true, fee: 3500 }, message: { on: true, fee: 1500 } },
  availability: DEFAULT_AVAILABILITY,
  cases: [],
  visits: [],
  readThreads: [],
};

export const initialState: AppState = {
  version: STATE_VERSION,
  session: null,
  pendingRole: null,
  consent: null,
  profile: emptyProfile,
  scans: [],
  guideSeen: 0,
  routineLog: {},
  streakBase: 0,
  routinePrefs: { amTime: '7:30 am', pmTime: '10:00 pm', length: 4, budget: 'Medium', rebuild: true, removed: [] },
  settings: {
    remindAm: true,
    remindPm: true,
    remindRescan: true,
    rescanDays: 10,
    quiet: true,
    quietFrom: '11 pm',
    quietTo: '7 am',
    keepPhotos: false,
    train: false,
    language: 'English',
  },
  shares: [],
  saved: [],
  favorites: [],
  appointments: [],
  threads: [],
  aiChat: [],
  notifications: [],
  derm: defaultDerm,
};


/** The returning patient from the storyboard: five scans, a booked visit and a doctor thread. */
export function demoPatientState(): AppState {
  return {
    ...initialState,
    session: { role: 'patient', name: DEMO_PATIENT.name, email: DEMO_PATIENT.email, demo: true },
    consent: { adult: true, train: false, at: '2026-10-08T09:00:00+05:00' },
    profile: {
      tone: 2,
      feel: 'Combination',
      concerns: ['redness', 'acne', 'darkSpots'],
      avoid: ['Fragrance', 'Benzoyl peroxide'],
      current: 'Cleanser and moisturiser',
      done: true,
      phone: DEMO_PATIENT.phone,
      dob: DEMO_PATIENT.dob,
      gender: DEMO_PATIENT.gender,
      city: DEMO_PATIENT.city,
    },
    scans: DEMO_SCANS,
    guideSeen: 5,
    routineLog: { [todayKey()]: ['am-cleanser', 'am-niacinamide'] },
    streakBase: 9,
    shares: [{ doctorId: 'dr-sana', scanIds: ['scan-1102', 'scan-1029', 'scan-1018'], until: '2026-12-16' }],
    saved: DEMO_SAVED,
    appointments: DEMO_APPOINTMENTS.map((a) => (a.status === 'upcoming' ? { ...a, start: rebase(a.start) } : a)),
    threads: DEMO_THREADS.filter((t) => t.patientName === DEMO_PATIENT.name),
    notifications: DEMO_NOTIFICATIONS,
  };
}

/** Dr. Sana Iqbal: verified, with a full inbox and schedule. */
export function demoDoctorState(): AppState {
  return {
    ...initialState,
    session: { role: 'dermatologist', name: 'Dr. Sana Iqbal', email: 'sana@clinic.pk', demo: true },
    consent: { adult: true, train: false, at: '2026-11-03T09:00:00+05:00' },
    threads: DEMO_THREADS,
    derm: {
      ...defaultDerm,
      step: 'done',
      status: 'approved',
      specialties: ['Acne', 'Pigmentation', 'Melasma'],
      photo: true,
      pmdc: '54123-P',
      qualification: 'FCPS Dermatology',
      clinic: 'Skin Health Clinic, Gulberg III',
      certificate: 'PMDC_certificate.pdf',
      cnic: 'CNIC_front.jpg',
      visits: DEMO_VISITS.map((v) => ({ ...v, start: rebase(v.start) })),
      cases: DEMO_CASES.map((c) => ({ ...c, receivedAt: rebase(c.receivedAt) })),
      readThreads: ['thread-hassan'],
    },
  };
}
