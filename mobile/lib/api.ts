/**
 * Client for the DermAI API (backend/). Handles the base URL, tokens, refresh, timeouts and
 * turns every failure into an ApiError whose `message` can be shown to the person as is.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_PORT = 8000;

function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`;
  }
  // In development the phone reaches the dev machine at the same host Metro is served from.
  const hostUri = Constants.expoConfig?.hostUri ?? (Constants as unknown as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${API_PORT}`;
  return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : `http://localhost:${API_PORT}`;
}

export const API_URL = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  code: string;
  extra: Record<string, unknown>;
  constructor(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return 'Something went wrong. Please try again.';
}

/* ───────────── Tokens ───────────── */

const ACCESS = 'dermai.access';
const REFRESH = 'dermai.refresh';
const secure = Platform.OS !== 'web';

async function readKey(k: string): Promise<string | null> {
  try {
    return secure ? await SecureStore.getItemAsync(k) : await AsyncStorage.getItem(k);
  } catch {
    return null;
  }
}

async function writeKey(k: string, v: string | null): Promise<void> {
  try {
    if (v === null) {
      if (secure) await SecureStore.deleteItemAsync(k);
      else await AsyncStorage.removeItem(k);
    } else if (secure) await SecureStore.setItemAsync(k, v);
    else await AsyncStorage.setItem(k, v);
  } catch {
    // Storage can fail in private browsing; the session then lasts until the app closes.
  }
}

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onSignedOut: (() => void) | null = null;
/** Requests wait for saved tokens to load, so a screen that mounts first can't race the restore. */
let tokensLoaded: Promise<boolean> | null = null;

export function loadTokens(): Promise<boolean> {
  tokensLoaded ??= (async () => {
    accessToken = await readKey(ACCESS);
    refreshToken = await readKey(REFRESH);
    return !!(accessToken || refreshToken);
  })();
  return tokensLoaded;
}

export async function setTokens(t: { accessToken: string; refreshToken: string } | null): Promise<void> {
  tokensLoaded = Promise.resolve(!!t);
  accessToken = t?.accessToken ?? null;
  refreshToken = t?.refreshToken ?? null;
  await Promise.all([writeKey(ACCESS, accessToken), writeKey(REFRESH, refreshToken)]);
}

export const currentRefreshToken = () => refreshToken;

/** Called when the server rejects both tokens, so the app can return to the welcome screen. */
export function setSignedOutHandler(fn: (() => void) | null) {
  onSignedOut = fn;
}

/* ───────────── Requests ───────────── */

export interface FilePart {
  uri: string;
  name: string;
  type: string;
}

type Body = { json?: unknown; form?: Record<string, string | FilePart | null | undefined> };

async function toFormData(form: NonNullable<Body['form']>): Promise<FormData> {
  const fd = new FormData();
  for (const [k, v] of Object.entries(form)) {
    if (v == null) continue;
    if (typeof v === 'string') {
      fd.append(k, v);
    } else if (Platform.OS === 'web') {
      const blob = await (await fetch(v.uri)).blob();
      fd.append(k, blob, v.name);
    } else {
      // React Native's FormData takes {uri, name, type} for files.
      fd.append(k, v as unknown as Blob);
    }
  }
  return fd;
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      await setTokens(await res.json());
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => (refreshing = null), 0);
    }
  })();
  return refreshing;
}

async function send(method: string, path: string, body: Body, timeoutMs: number): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  let payload: BodyInit | undefined;
  if (body.json !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body.json);
  } else if (body.form) {
    payload = await toFormData(body.form);
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(`${API_URL}${path}`, { method, headers, body: payload, signal: ctrl.signal });
  } catch (e) {
    const aborted = (e as { name?: string })?.name === 'AbortError';
    throw new ApiError(0, aborted ? 'timeout' : 'offline', aborted ? 'The server took too long to answer. Try again.' : "Can't reach DermAI. Check your internet connection and try again.");
  } finally {
    clearTimeout(t);
  }
}

export async function api<T = unknown>(method: string, path: string, body: Body = {}, opts: { timeoutMs?: number; auth?: boolean } = {}): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 20000;
  if (opts.auth !== false) await loadTokens();
  let res = await send(method, path, body, timeoutMs);
  if (res.status === 401 && opts.auth !== false && refreshToken) {
    if (await tryRefresh()) res = await send(method, path, body, timeoutMs);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error;
    if (res.status === 401 && opts.auth !== false) {
      await setTokens(null);
      onSignedOut?.();
    }
    const { code, message, ...extra } = (err ?? {}) as { code?: string; message?: string };
    throw new ApiError(res.status, code ?? 'server_error', message ?? `Something went wrong (${res.status}). Please try again.`, extra);
  }
  return data as T;
}

export const get = <T,>(path: string) => api<T>('GET', path);
export const post = <T,>(path: string, json?: unknown) => api<T>('POST', path, { json: json ?? {} });
export const put = <T,>(path: string, json: unknown) => api<T>('PUT', path, { json });
export const patch = <T,>(path: string, json: unknown) => api<T>('PATCH', path, { json });
export const del = <T,>(path: string, json?: unknown) => api<T>('DELETE', path, json === undefined ? {} : { json });
export const upload = <T,>(path: string, form: NonNullable<Body['form']>, timeoutMs = 60000) => api<T>('POST', path, { form }, { timeoutMs });

export function photoPart(uri: string, name = 'photo.jpg'): FilePart {
  const lower = uri.toLowerCase();
  const type = lower.endsWith('.png') || lower.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
  return { uri, name: type === 'image/png' ? name.replace(/\.jpe?g$/, '.png') : name, type };
}
