import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { RecommendationStatus } from '@/data/recommendations';

interface RecommendationLocalState {
  statuses: Record<string, RecommendationStatus>;
  inRoutine: Record<string, boolean>;
  reminders: Record<string, boolean>;
  feedback: string | null;
}

interface RecommendationsContextValue extends RecommendationLocalState {
  getStatus: (id: string, defaultStatus: RecommendationStatus) => RecommendationStatus;
  isInRoutine: (id: string) => boolean;
  hasReminder: (id: string) => boolean;
  addToRoutine: (id: string) => void;
  markCompleted: (id: string) => void;
  setReminder: (id: string) => void;
  scheduleNextScan: (id: string) => void;
  clearFeedback: () => void;
}

const RecommendationsContext = createContext<RecommendationsContextValue | null>(null);

export function RecommendationsProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, RecommendationStatus>>({});
  const [inRoutine, setInRoutine] = useState<Record<string, boolean>>({});
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const getStatus = useCallback(
    (id: string, defaultStatus: RecommendationStatus) => statuses[id] ?? defaultStatus,
    [statuses],
  );

  const isInRoutine = useCallback((id: string) => Boolean(inRoutine[id]), [inRoutine]);

  const hasReminder = useCallback((id: string) => Boolean(reminders[id]), [reminders]);

  const addToRoutine = useCallback((id: string) => {
    setInRoutine((prev) => ({ ...prev, [id]: true }));
    setStatuses((prev) => ({ ...prev, [id]: 'In progress' }));
    setFeedback('Added to your routine');
  }, []);

  const markCompleted = useCallback((id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: 'Completed today' }));
    setFeedback('Marked as completed');
  }, []);

  const setReminder = useCallback((id: string) => {
    setReminders((prev) => ({ ...prev, [id]: true }));
    setFeedback('Reminder set');
  }, []);

  const scheduleNextScan = useCallback((id: string) => {
    setStatuses((prev) => ({ ...prev, [id]: 'Active' }));
    setReminders((prev) => ({ ...prev, [id]: true }));
    setFeedback('Next scan scheduled in 2 weeks');
  }, []);

  const clearFeedback = useCallback(() => setFeedback(null), []);

  const value = useMemo(
    () => ({
      statuses,
      inRoutine,
      reminders,
      feedback,
      getStatus,
      isInRoutine,
      hasReminder,
      addToRoutine,
      markCompleted,
      setReminder,
      scheduleNextScan,
      clearFeedback,
    }),
    [
      statuses,
      inRoutine,
      reminders,
      feedback,
      getStatus,
      isInRoutine,
      hasReminder,
      addToRoutine,
      markCompleted,
      setReminder,
      scheduleNextScan,
      clearFeedback,
    ],
  );

  return (
    <RecommendationsContext.Provider value={value}>{children}</RecommendationsContext.Provider>
  );
}

export function useRecommendationsState() {
  const context = useContext(RecommendationsContext);
  if (!context) {
    throw new Error('useRecommendationsState must be used within RecommendationsProvider');
  }
  return context;
}
