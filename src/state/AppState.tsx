import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ExamResult } from "../content/exam";

const SEEN_KEY = "guiaancianos.seenCardIds.v1";
const ANSWERS_KEY = "guiaancianos.cardAnswers.v1";
const LAST_CARD_KEY = "guiaancianos.lastCardByPack.v1";
const EXAMS_KEY = "guiaancianos.examHistory.v1";

/** How many past Simulacro results are kept on the device. */
const MAX_EXAM_HISTORY = 20;

export type CardAnswer = "correct";

interface AppStateValue {
  loading: boolean;
  /** Local-only, on-device "La saqué" marks. No accounts, no sync. */
  cardAnswers: Record<string, CardAnswer>;
  /** The last card shown in a pack, so it can reopen where the user left off. */
  getLastCardId: (packId: string) => string | undefined;
  setLastCardId: (packId: string, cardId: string) => void;
  /** Whether a card has ever been shown (feeds the review deck). */
  hasSeen: (cardId: string) => boolean;
  markSeen: (cardId: string) => void;
  /** Pass undefined to clear a card's mark. */
  markAnswer: (cardId: string, answer: CardAnswer | undefined) => void;
  /** Past Simulacro results, most recent first. */
  examHistory: ExamResult[];
  saveExamResult: (result: ExamResult) => void;
  resetProgress: () => Promise<void>;
  clearExamHistory: () => Promise<void>;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [cardAnswers, setCardAnswers] = useState<Record<string, CardAnswer>>({});
  const [examHistory, setExamHistory] = useState<ExamResult[]>([]);

  // Seen cards and last-card-per-pack are only ever read on demand (Home's
  // review count when it regains focus; StudyScreen once on mount), so they
  // live in refs: writing them on every card shown must not re-render every
  // consumer mid-animation. They still persist to AsyncStorage as usual.
  const seenCardIdsRef = useRef<Set<string>>(new Set());
  const lastCardIdByPackRef = useRef<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [storedSeen, storedAnswers, storedLastCard, storedExams] = await Promise.all([
          AsyncStorage.getItem(SEEN_KEY),
          AsyncStorage.getItem(ANSWERS_KEY),
          AsyncStorage.getItem(LAST_CARD_KEY),
          AsyncStorage.getItem(EXAMS_KEY),
        ]);
        seenCardIdsRef.current = new Set(safeParse<string[]>(storedSeen, []));
        setCardAnswers(safeParse<Record<string, CardAnswer>>(storedAnswers, {}));
        lastCardIdByPackRef.current = safeParse<Record<string, string>>(storedLastCard, {});
        setExamHistory(safeParse<ExamResult[]>(storedExams, []));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasSeen = useCallback((cardId: string) => seenCardIdsRef.current.has(cardId), []);

  const markSeen = useCallback((cardId: string) => {
    if (seenCardIdsRef.current.has(cardId)) return;
    const next = new Set(seenCardIdsRef.current);
    next.add(cardId);
    seenCardIdsRef.current = next;
    AsyncStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(next))).catch(() => {});
  }, []);

  const markAnswer = useCallback((cardId: string, answer: CardAnswer | undefined) => {
    setCardAnswers((prev) => {
      const next = { ...prev };
      if (answer) next[cardId] = answer;
      else delete next[cardId];
      AsyncStorage.setItem(ANSWERS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const getLastCardId = useCallback((packId: string) => lastCardIdByPackRef.current[packId], []);

  const setLastCardId = useCallback((packId: string, cardId: string) => {
    if (lastCardIdByPackRef.current[packId] === cardId) return;
    const next = { ...lastCardIdByPackRef.current, [packId]: cardId };
    lastCardIdByPackRef.current = next;
    AsyncStorage.setItem(LAST_CARD_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const saveExamResult = useCallback((result: ExamResult) => {
    setExamHistory((prev) => {
      const next = [result, ...prev].slice(0, MAX_EXAM_HISTORY);
      AsyncStorage.setItem(EXAMS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resetProgress = useCallback(async () => {
    seenCardIdsRef.current = new Set();
    lastCardIdByPackRef.current = {};
    setCardAnswers({});
    await Promise.all([
      AsyncStorage.removeItem(SEEN_KEY),
      AsyncStorage.removeItem(ANSWERS_KEY),
      AsyncStorage.removeItem(LAST_CARD_KEY),
    ]);
  }, []);

  const clearExamHistory = useCallback(async () => {
    setExamHistory([]);
    await AsyncStorage.removeItem(EXAMS_KEY);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      cardAnswers,
      getLastCardId,
      setLastCardId,
      hasSeen,
      markSeen,
      markAnswer,
      examHistory,
      saveExamResult,
      resetProgress,
      clearExamHistory,
    }),
    [
      loading,
      cardAnswers,
      getLastCardId,
      setLastCardId,
      hasSeen,
      markSeen,
      markAnswer,
      examHistory,
      saveExamResult,
      resetProgress,
      clearExamHistory,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
