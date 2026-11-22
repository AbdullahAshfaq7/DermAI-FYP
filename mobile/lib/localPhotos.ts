/**
 * Phone-first scan photos. The server analyses a photo and drops it; the phone keeps it here.
 * A photo leaves the phone again only when the person shares that scan with a doctor.
 *
 * Native: files in the app's document folder. Web (dev only): data URLs in local storage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { useMemo, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

const INDEX_KEY = 'dermai-photos-v1';
const DIR = Platform.OS === 'web' ? '' : `${FileSystem.documentDirectory}scans/`;

export interface LocalPhoto {
  uri: string;
  /** Owner, so two accounts on one phone never see each other's photos. */
  userId: string;
  at: string;
  bytes: number;
}

let index: Record<string, LocalPhoto> = {};
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

async function persist() {
  try {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // Web storage can be full; the photo still shows until reload.
  }
}

export async function loadLocalPhotos(): Promise<void> {
  if (loaded) return;
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    index = raw ? JSON.parse(raw) : {};
  } catch {
    index = {};
  }
  loaded = true;
  emit();
}

async function toDataUrl(uri: string): Promise<{ uri: string; bytes: number }> {
  const blob = await (await fetch(uri)).blob();
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
  return { uri: url, bytes: blob.size };
}

/** Keep the photo for a scan on this phone. */
export async function saveLocalPhoto(scanId: string, sourceUri: string, userId: string): Promise<void> {
  await loadLocalPhotos();
  let entry: LocalPhoto;
  if (Platform.OS === 'web') {
    const { uri, bytes } = await toDataUrl(sourceUri);
    entry = { uri, bytes, userId, at: new Date().toISOString() };
  } else {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
    const dest = `${DIR}${scanId}.jpg`;
    await FileSystem.copyAsync({ from: sourceUri, to: dest });
    const info = await FileSystem.getInfoAsync(dest);
    entry = { uri: dest, bytes: info.exists ? (info.size ?? 0) : 0, userId, at: new Date().toISOString() };
  }
  index = { ...index, [scanId]: entry };
  emit();
  await persist();
}

export async function removeLocalPhoto(scanId: string): Promise<void> {
  await loadLocalPhotos();
  const e = index[scanId];
  if (!e) return;
  if (Platform.OS !== 'web') await FileSystem.deleteAsync(e.uri, { idempotent: true }).catch(() => {});
  const { [scanId]: _gone, ...rest } = index;
  index = rest;
  emit();
  await persist();
}

/** Remove every photo belonging to a user (account deleted). */
export async function removeUserPhotos(userId: string): Promise<void> {
  await loadLocalPhotos();
  for (const [id, e] of Object.entries(index)) if (e.userId === userId) await removeLocalPhoto(id);
}

/** Apply the "keep photos for" setting. Scores are kept; only the photos go. */
export async function purgeLocalPhotos(userId: string, retention: '3m' | '1y' | 'always'): Promise<number> {
  if (retention === 'always') return 0;
  await loadLocalPhotos();
  const days = retention === '3m' ? 92 : 366;
  const cutoff = Date.now() - days * 86400000;
  let n = 0;
  for (const [id, e] of Object.entries(index)) {
    if (e.userId === userId && new Date(e.at).getTime() < cutoff) {
      await removeLocalPhoto(id);
      n++;
    }
  }
  return n;
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  void loadLocalPhotos();
  return () => listeners.delete(l);
};
const snapshot = () => index;

/** Photos on this phone for the signed-in person, keyed by scan id. */
export function useLocalPhotos(userId: string | undefined): Record<string, LocalPhoto> {
  const all = useSyncExternalStore(subscribe, snapshot, snapshot);
  return useMemo(() => {
    const mine: Record<string, LocalPhoto> = {};
    if (userId) for (const [id, e] of Object.entries(all)) if (e.userId === userId) mine[id] = e;
    return mine;
  }, [all, userId]);
}

export function localPhoto(scanId: string): LocalPhoto | undefined {
  return index[scanId];
}
