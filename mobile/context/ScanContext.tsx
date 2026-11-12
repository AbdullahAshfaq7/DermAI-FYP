import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { STATIC_SKIN_SCAN_RESULT, SkinScanResult } from '@/data/skinScanResult';

export type AnalysisStatus = 'idle' | 'captured' | 'analyzing' | 'completed';

export interface ScanSession {
  photoUri: string | null;
  capturedAt: string | null;
  analysisStatus: AnalysisStatus;
  result: SkinScanResult | null;
}

export interface SavedScan {
  id: string;
  photoUri: string;
  result: SkinScanResult;
  savedAt: string;
}

interface ScanContextValue {
  session: ScanSession;
  savedScans: SavedScan[];
  saveFeedback: string | null;
  setPhoto: (uri: string) => void;
  clearPhoto: () => void;
  startAnalysis: () => void;
  completeAnalysis: () => void;
  saveScanResult: () => boolean;
  resetForRescan: () => void;
  clearSaveFeedback: () => void;
  isCurrentScanSaved: () => boolean;
}

const initialSession: ScanSession = {
  photoUri: null,
  capturedAt: null,
  analysisStatus: 'idle',
  result: null,
};

const ScanContext = createContext<ScanContextValue | null>(null);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ScanSession>(initialSession);
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const setPhoto = useCallback((uri: string) => {
    setSession({
      photoUri: uri,
      capturedAt: new Date().toISOString(),
      analysisStatus: 'captured',
      result: null,
    });
    setSaveFeedback(null);
  }, []);

  const clearPhoto = useCallback(() => {
    setSession(initialSession);
    setSaveFeedback(null);
  }, []);

  const startAnalysis = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      analysisStatus: 'analyzing',
    }));
  }, []);

  const completeAnalysis = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      analysisStatus: 'completed',
      result: {
        ...STATIC_SKIN_SCAN_RESULT,
        id: `scan-${Date.now()}`,
        scannedAt: prev.capturedAt ?? new Date().toISOString(),
      },
    }));
  }, []);

  const isCurrentScanSaved = useCallback(() => {
    if (!session.result || !session.photoUri) {
      return false;
    }
    return savedScans.some(
      (scan) => scan.result.id === session.result?.id && scan.photoUri === session.photoUri,
    );
  }, [savedScans, session.photoUri, session.result]);

  const saveScanResult = useCallback(() => {
    if (!session.result || !session.photoUri) {
      return false;
    }

    if (isCurrentScanSaved()) {
      setSaveFeedback('This scan is already saved');
      return false;
    }

    const savedScan: SavedScan = {
      id: `saved-${session.result.id}`,
      photoUri: session.photoUri,
      result: session.result,
      savedAt: new Date().toISOString(),
    };

    setSavedScans((prev) => [savedScan, ...prev]);
    setSaveFeedback('Scan saved successfully');
    return true;
  }, [isCurrentScanSaved, session.photoUri, session.result]);

  const resetForRescan = useCallback(() => {
    setSession(initialSession);
    setSaveFeedback(null);
  }, []);

  const clearSaveFeedback = useCallback(() => setSaveFeedback(null), []);

  const value = useMemo(
    () => ({
      session,
      savedScans,
      saveFeedback,
      setPhoto,
      clearPhoto,
      startAnalysis,
      completeAnalysis,
      saveScanResult,
      resetForRescan,
      clearSaveFeedback,
      isCurrentScanSaved,
    }),
    [
      session,
      savedScans,
      saveFeedback,
      setPhoto,
      clearPhoto,
      startAnalysis,
      completeAnalysis,
      saveScanResult,
      resetForRescan,
      clearSaveFeedback,
      isCurrentScanSaved,
    ],
  );

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScan() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error('useScan must be used within ScanProvider');
  }
  return context;
}
