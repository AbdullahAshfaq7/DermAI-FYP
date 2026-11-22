import { DEFAULT_AVAILABILITY } from '@/data/seed';
import type {
  AppNotification,
  Appointment,
  Availability,
  Case,
  ConcernKey,
  Doctor,
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

/** Must match STATE_VERSION in backend/app/state.py; cached state from another version is ignored. */
export const STATE_VERSION = 3;

export interface Profile {
  tone: number | null;
  feel: SkinType | null;
  concerns: ConcernKey[];
  /** Concerns outside the six the scan reads, e.g. "Fine lines". */
  otherConcerns: string[];
  avoid: string[];
  current: string | null;
  /** What they use now: Cleanser, Moisturiser, Sunscreen, Serum or treatment. */
  currentProducts: string[];
  done: boolean;
  phone: string;
  dob: string;
  gender: string;
  city: string;
}

export interface DoctorStep {
  id: string;
  title: string;
  /** "Every other night" */
  detail: string;
  period: 'am' | 'pm';
  by?: string;
  at?: string;
}

export interface RoutinePrefs {
  amTime: string;
  pmTime: string;
  /** Steps per half of the day. */
  length: 2 | 3 | 4 | 5;
  budget: 'Low' | 'Medium' | 'Any';
  rebuild: boolean;
  /** Steps a doctor or the user removed from the routine. */
  removed: string[];
  /** Steps a dermatologist added. */
  doctorSteps: DoctorStep[];
  /** Step id -> date (YYYY-MM-DD) a doctor's pause ends. */
  paused: Record<string, string>;
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
  /** How long scan photos stay on this phone. */
  photoRetention: '3m' | '1y' | 'always';
  /** Skip the scan guide (offered after the third scan). */
  skipGuide: boolean;
  /** Set when a doctor asks for a new scan by a date (YYYY-MM-DD). */
  rescanDue: string | null;
  train: boolean;
  language: 'English' | 'Urdu';
}

export interface Share {
  doctorId: string;
  scanIds: string[];
  until: string;
}

export interface LedgerEntry {
  id: string;
  patientName: string;
  service: ServiceType;
  start: string;
  fee: number;
  status: Appointment['status'];
}

export interface DermProfile {
  id?: string;
  step: 'profile' | 'credentials' | 'services' | 'done';
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  reviewNote?: string;
  specialties: string[];
  photo: boolean;
  photoUrl?: string | null;
  pmdc: string;
  qualification: string;
  clinic: string;
  city?: string;
  certificate: string | null;
  cnic: string | null;
  degree?: string | null;
  languages?: string[];
  practisingSince?: number | null;
  submittedAt?: string | null;
  services: Record<ServiceType, { on: boolean; fee: number }>;
  availability: Availability;
  cases: Case[];
  visits: Visit[];
  /** Thread ids the doctor has read. */
  readThreads: string[];
  verifiedAt?: string | null;
  stats?: { patients: number; rating: number; reviews: number; replyHours: number };
  ledger?: LedgerEntry[];
  commissionPct?: number;
}

export interface Session {
  id?: string;
  role: Role | 'admin';
  name: string;
  email: string;
  demo: boolean;
  avatarUrl?: string | null;
}

export interface AppState {
  version: number;
  session: Session | null;
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
  /** PMDC-verified doctors patients can book. */
  doctors: Doctor[];
}

const emptyProfile: Profile = {
  tone: null,
  feel: null,
  concerns: [],
  otherConcerns: [],
  avoid: [],
  current: null,
  currentProducts: [],
  done: false,
  phone: '',
  dob: '',
  gender: '',
  city: '',
};

export const defaultDerm: DermProfile = {
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

/** Signed-out state. Everything else comes from GET /me/state. */
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
  routinePrefs: { amTime: '7:30 am', pmTime: '10:00 pm', length: 4, budget: 'Medium', rebuild: true, removed: [], doctorSteps: [], paused: {} },
  settings: {
    remindAm: true,
    remindPm: true,
    remindRescan: true,
    rescanDays: 10,
    quiet: true,
    quietFrom: '11 pm',
    quietTo: '7 am',
    keepPhotos: false,
    photoRetention: '1y',
    skipGuide: false,
    rescanDue: null,
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
  doctors: [],
};
