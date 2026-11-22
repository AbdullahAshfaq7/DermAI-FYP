import type { IconName } from '@/components/ui/Icon';
import type { ConcernLevel } from '@/theme/colors';

export type { ConcernLevel };

export type Role = 'patient' | 'dermatologist';
export type ConcernKey = 'acne' | 'dryness' | 'redness' | 'darkSpots' | 'sensitivity' | 'pores';
export type ZoneKey = 'forehead' | 'nose' | 'leftCheek' | 'rightCheek' | 'chin';
export type SkinType = 'Oily' | 'Combination' | 'Dry' | 'Normal';
export type Period = 'am' | 'pm';
export type ServiceType = 'video' | 'clinic' | 'message';

export interface ConcernReading {
  pct: number;
  level: ConcernLevel;
}

export interface Scan {
  id: string;
  /** ISO timestamp */
  date: string;
  score: number;
  concerns: Record<ConcernKey, ConcernReading>;
  zones: Record<ZoneKey, ConcernLevel>;
  /** Where each concern shows most, used in copy and the face map. */
  where: Partial<Record<ConcernKey, ZoneKey[]>>;
  quality: 'good' | 'dim';
  /** Signed link to the photo; null once the photo is deleted (retention) or for older demo scans. */
  photoUri?: string | null;
  confidence?: number;
  /** Fitzpatrick index for the placeholder photo when there is no real photo. */
  photoTone: number;
  sharedWith: string[];
}

export interface RoutineStep {
  id: string;
  period: Period;
  title: string;
  subtitle: string;
  ingredients: string[];
  why: string;
  how: string[];
  avoid: string;
  /** Priority within its half of the day: a routine of N steps includes ranks 1 to N. */
  rank: number;
  /** "Not on the same night as retinol." */
  conflict?: string;
  /** Names to look for on a label, so any brand works. */
  lookFor?: string[];
  /** Timing tip shown on the routine screen. */
  wait?: string;
  /** Added by a dermatologist (not from the library). */
  doctor?: boolean;
  by?: string;
  /** Rough price tier: 1 pharmacy basics, 2 mid-range, 3 premium. Filtered by the budget preference. */
  cost: 1 | 2 | 3;
  /** Concerns a treatment step works on. Empty for basics (cleanse, moisturise, protect). */
  targets: ConcernKey[];
}

export interface Service {
  type: ServiceType;
  fee: number;
  detail: string;
}

export interface Doctor {
  id: string;
  name: string;
  pmdc: string;
  qualifications: string;
  years: number;
  rating: number;
  reviews: number;
  replyHours: number;
  bio: string;
  focus: string;
  specialties: string[];
  city: string;
  clinic: string;
  female: boolean;
  tone: number;
  services: Service[];
  nextFree: string;
  /** Earliest open visit slot, for "Today, 6:00 pm" on cards. */
  nextSlot?: { iso: string; label: string; service: ServiceType } | null;
  languages?: string[];
  patients?: number;
  photoUrl?: string | null;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientName: string;
  service: ServiceType;
  /** ISO start time */
  start: string;
  minutes: number;
  reason: string;
  sharedScanIds: string[];
  status: 'upcoming' | 'done' | 'cancelled';
  fee: number;
  paymentMethod?: PaymentMethod;
  paymentStatus?: string;
  cancelledBy?: 'patient' | 'doctor' | null;
  rating?: number | null;
  caseId?: string | null;
}

export type PaymentMethod = 'pay_at_visit' | 'card' | 'jazzcash' | 'easypaisa';

export interface RxChange {
  action: 'add' | 'pause' | 'stop';
  stepId?: string;
  title: string;
  detail?: string;
  period?: Period;
  weeks?: number;
}

export interface DoctorNote {
  stop: string[];
  keep: string[];
  changes?: RxChange[];
  rescanWeeks?: number | null;
}

export interface Message {
  id: string;
  from: 'patient' | 'doctor' | 'ai';
  text: string;
  at: string;
  note?: DoctorNote;
  attachment?: string;
  /** AI replies that suggest a dermatologist. */
  referral?: boolean;
  /** A real open slot offered with a referral. */
  suggest?: { doctorId: string; doctorName: string; start: string; service: ServiceType } | null;
  /** Pending local message while it is being sent. */
  pending?: boolean;
}

export interface Thread {
  id: string;
  /** Latest case between the two, "DA-2041". */
  caseNumber?: string | null;
  doctorId: string;
  patientId?: string;
  patientName: string;
  caseTitle: string;
  sharedScans: number;
  messages: Message[];
  unreadForPatient: number;
  unreadForDoctor: number;
}

export type SavedKind = 'ingredient' | 'tip' | 'doctor';

export interface SavedItem {
  id: string;
  kind: SavedKind;
  title: string;
  subtitle: string;
  icon: IconName;
  routineStepId?: string;
  source: string;
}

export interface AppNotification {
  id: string;
  icon: IconName;
  title: string;
  body: string;
  at: string;
  href: string;
  read: boolean;
}

export type Urgency = 'urgent' | 'high' | 'moderate' | 'mild';

export interface CasePatient {
  id?: string;
  /** The patient's current routine, so the doctor can pause or stop a step. */
  routine?: { id: string; title: string; period: Period; doctor: boolean }[];
  gender?: string;
  name: string;
  age: number;
  fitz: number;
  type: SkinType;
  avoids: string[];
  tone: number;
}

export interface Assessment {
  findings: string[];
  aiRating: 'correct' | 'partly' | 'wrong';
  note: string;
  stop: string[];
  keep: string[];
  changes?: RxChange[];
  rescanWeeks?: number | null;
  sentAt?: string;
  removedSteps?: string[];
}

export interface Case {
  id: string;
  /** "DA-2041" */
  number?: string | null;
  /** Why it was flagged: "changed shape or colour", "fever reported". */
  flags?: string[];
  patient: CasePatient;
  complaint: string;
  summary: string;
  urgency: Urgency;
  receivedAt: string;
  status: 'waiting' | 'replied' | 'closed';
  channel: ServiceType;
  photos: { date: string; tone: number; uri?: string }[];
  ai: { confidence: number; reading: string; zones: Record<ZoneKey, ConcernLevel>; scanId?: string | null };
  threadId?: string;
  draft?: Assessment;
  assessment?: Assessment;
}

export interface Visit {
  id: string;
  start: string;
  minutes: number;
  kind: 'visit' | 'blocked';
  patientName?: string;
  service?: ServiceType;
  label: string;
  caseId?: string | null;
  status?: Appointment['status'];
}

export interface Availability {
  days: { day: string; open: boolean; from: string; to: string }[];
  gapMinutes: number;
  noticeHours: number;
  /** Dates as YYYY-MM-DD, inclusive. */
  timeOff: { from: string; to: string } | null;
}

export interface ConcernInfo {
  key: ConcernKey;
  label: string;
  icon: IconName;
  /** How this concern can look on medium to deep skin. */
  toneNote: string;
  helps: { icon: IconName; title: string; subtitle: string }[];
  doctorHint: string;
}
