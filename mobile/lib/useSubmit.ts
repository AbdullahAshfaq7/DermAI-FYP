import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { errorMessage } from '@/lib/api';

/** Busy and error state for a button that calls the API. `run` resolves to undefined on failure. */
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (inFlight.current) return undefined;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(errorMessage(e));
      return undefined;
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, error, setError, run };
}

/** For quick actions without their own error slot (toggles, deletes): show what went wrong. */
export function alertError(e: unknown, title = "Couldn't save that") {
  Alert.alert(title, errorMessage(e));
}

/** Fire-and-forget an action, alerting on failure. */
export function attempt(p: Promise<unknown>, title?: string) {
  p.catch((e) => alertError(e, title));
}
