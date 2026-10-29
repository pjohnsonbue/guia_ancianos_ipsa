import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ExamResult } from "../content/exam";

// v2: the course redesign replaced flash cards with multiple-choice
// questions (new IDs), so progress and exam history start fresh.
const ANSWERS_KEY = "guiaancianos.questionAnswers.v2";
const EXAMS_KEY = "guiaancianos.examHistory.v2";
const VIDEOS_KEY = "guiaancianos.watchedVideoIds.v1";
const READING_KEY = "guiaancianos.reading.v2";
// Flash-card era keys, removed on first launch after the update.
const LEGACY_KEYS = [
  "guiaancianos.seenCardIds.v1",
  "guiaancianos.cardAnswers.v1",
  "guiaancianos.lastCardByPack.v1",
  "guiaancianos.examHistory.v1",
  "guiaancianos.reading.v1",
];

/** How many past Simulacro results are kept on the device. */
const MAX_EXAM_HISTORY = 20;

/** The latest answer given to a question in its pack or in «Repasá». */
export type QuestionAnswer = "correct" | "wrong";

type ReadingState = {
  /** Last chapter opened, by pack (reading) ID. */
  last: Record<string, string>;
  /** Chapters read to the end, by document ID. */
  read: Record<string, string[]>;
  /** Reader text size step. */
  size: number;
};

interface AppStateValue {
  loading: boolean;
  /** Local-only, on-device. No accounts, no sync. */
  questionAnswers: Record<string, QuestionAnswer>;
  recordAnswer: (questionId: string, correct: boolean) => void;
  /** Videos watched to (nearly) the end, by video ID. */
  watchedVideoIds: Record<string, true>;
  markVideoWatched: (videoId: string) => void;
  /** The last chapter opened in each reading (by pack ID). */
  lastChapterByPack: Record<string, string>;
  setLastChapter: (packId: string, chapterId: string) => void;
  /** Chapters read to the end, by document ID. */
  readChaptersByDoc: Record<string, string[]>;
  markChapterRead: (docId: string, chapterId: string) => void;
  /** Reader text size step: 0 (small) to 3 (largest). */
  readerTextSize: number;
  setReaderTextSize: (size: number) => void;
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

const EMPTY_READING: ReadingState = { last: {}, read: {}, size: 1 };

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [examHistory, setExamHistory] = useState<ExamResult[]>([]);
  const [watchedVideoIds, setWatchedVideoIds] = useState<Record<string, true>>({});
  const [reading, setReading] = useState<ReadingState>(EMPTY_READING);

  useEffect(() => {
    (async () => {
      try {
        const [storedAnswers, storedExams, storedVideos, storedReading] = await Promise.all([
          AsyncStorage.getItem(ANSWERS_KEY),
          AsyncStorage.getItem(EXAMS_KEY),
          AsyncStorage.getItem(VIDEOS_KEY),
          AsyncStorage.getItem(READING_KEY),
        ]);
        setQuestionAnswers(safeParse<Record<string, QuestionAnswer>>(storedAnswers, {}));
        setExamHistory(safeParse<ExamResult[]>(storedExams, []));
        setWatchedVideoIds(safeParse<Record<string, true>>(storedVideos, {}));
        const r = safeParse<Partial<ReadingState>>(storedReading, {});
        setReading({ last: r.last ?? {}, read: r.read ?? {}, size: typeof r.size === "number" ? r.size : 1 });
        AsyncStorage.multiRemove(LEGACY_KEYS).catch(() => {});
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const recordAnswer = useCallback((questionId: string, correct: boolean) => {
    const answer: QuestionAnswer = correct ? "correct" : "wrong";
    setQuestionAnswers((prev) => {
      if (prev[questionId] === answer) return prev;
      const next = { ...prev, [questionId]: answer };
      AsyncStorage.setItem(ANSWERS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const markVideoWatched = useCallback((videoId: string) => {
    setWatchedVideoIds((prev) => {
      if (prev[videoId]) return prev;
      const next = { ...prev, [videoId]: true as const };
      AsyncStorage.setItem(VIDEOS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateReading = useCallback((fn: (r: ReadingState) => ReadingState) => {
    setReading((prev) => {
      const next = fn(prev);
      if (next === prev) return prev;
      AsyncStorage.setItem(READING_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);
  const setLastChapter = useCallback(
    (packId: string, chapterId: string) =>
      updateReading((r) => (r.last[packId] === chapterId ? r : { ...r, last: { ...r.last, [packId]: chapterId } })),
    [updateReading]
  );
  const markChapterRead = useCallback(
    (docId: string, chapterId: string) =>
      updateReading((r) => {
        const done = r.read[docId] ?? [];
        return done.includes(chapterId) ? r : { ...r, read: { ...r.read, [docId]: [...done, chapterId] } };
      }),
    [updateReading]
  );
  const setReaderTextSize = useCallback(
    (size: number) => updateReading((r) => (r.size === size ? r : { ...r, size })),
    [updateReading]
  );

  const saveExamResult = useCallback((result: ExamResult) => {
    setExamHistory((prev) => {
      const next = [result, ...prev].slice(0, MAX_EXAM_HISTORY);
      AsyncStorage.setItem(EXAMS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Clears the course progress (answers, videos, reading) but keeps the
  // reader's text size and the Simulacro history.
  const resetProgress = useCallback(async () => {
    setQuestionAnswers({});
    setWatchedVideoIds({});
    updateReading((r) => ({ ...r, last: {}, read: {} }));
    await Promise.all([AsyncStorage.removeItem(ANSWERS_KEY), AsyncStorage.removeItem(VIDEOS_KEY)]);
  }, [updateReading]);

  const clearExamHistory = useCallback(async () => {
    setExamHistory([]);
    await AsyncStorage.removeItem(EXAMS_KEY);
  }, []);

  const value = useMemo(
    () => ({
      loading,
      questionAnswers,
      recordAnswer,
      watchedVideoIds,
      markVideoWatched,
      lastChapterByPack: reading.last,
      setLastChapter,
      readChaptersByDoc: reading.read,
      markChapterRead,
      readerTextSize: reading.size,
      setReaderTextSize,
      examHistory,
      saveExamResult,
      resetProgress,
      clearExamHistory,
    }),
    [
      loading,
      questionAnswers,
      recordAnswer,
      watchedVideoIds,
      markVideoWatched,
      reading,
      setLastChapter,
      markChapterRead,
      setReaderTextSize,
      examHistory,
      saveExamResult,
      resetProgress,
      clearExamHistory,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside <AppStateProvider>");
  return ctx;
}
