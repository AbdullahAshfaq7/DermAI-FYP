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
  photoUri?: string;
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
  /** Which routine lengths include this step (3, 4 or 6). */
  minLength: 3 | 4 | 6;
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
}

export interface DoctorNote {
  stop: string[];
  keep: string[];
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
}

export interface Thread {
  id: string;
  doctorId: string;
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
  sentAt?: string;
}

export interface Case {
  id: string;
  patient: CasePatient;
  complaint: string;
  summary: string;
  urgency: Urgency;
  receivedAt: string;
  status: 'waiting' | 'replied' | 'closed';
  channel: 'video' | 'message';
  photos: { date: string; tone: number }[];
  ai: { confidence: number; reading: string; zones: Record<ZoneKey, ConcernLevel> };
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
  caseId?: string;
}

export interface Availability {
  days: { day: string; open: boolean; from: string; to: string }[];
  gapMinutes: number;
  noticeHours: number;
  timeOff: string;
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
