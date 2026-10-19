import type { CategoryId, QuizQuestion } from "./types";
import { QUIZ } from "./quiz";
import { CATEGORIES, categoryOfPack } from "./categories";
import { PACKS_BY_ID } from "./packs";

/** Number of questions in one Simulacro. */
export const EXAM_LENGTH = 30;

/** Percentage at or above which a Simulacro counts as passed. */
export const PASS_PERCENT = 70;

export interface ExamQuestion {
  question: QuizQuestion;
  /** The four options in display order (correct one shuffled in). */
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
}

/** One answered question, as stored in an exam result. */
export interface ExamAnswer {
  questionId: string;
  /** Index the user picked, into the options they were shown. */
  chosenIndex: number;
  correct: boolean;
}

export interface ExamResult {
  /** Epoch ms when the exam was finished. */
  finishedAt: number;
  total: number;
  correct: number;
  answers: ExamAnswer[];
  /** Options as shown, so the results screen can replay them exactly. */
  optionsById: Record<string, string[]>;
}

function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Questions eligible for the exam: those whose pack is visible. */
function eligibleQuestions(): QuizQuestion[] {
  return QUIZ.filter((q) => PACKS_BY_ID[q.packId]?.visible);
}

/**
 * Builds a fresh Simulacro of up to EXAM_LENGTH questions.
 *
 * Questions are drawn round-robin across the four categories, so every exam
 * covers the Guía, the Libro de orden, the Confesión and the Bible roughly
 * equally, no matter how many questions each category has. Within a category,
 * questions are also spread round-robin across its packs, so one large pack
 * can't dominate. The final list is shuffled, as are the options of each
 * question.
 */
export function buildExam(length: number = EXAM_LENGTH, rand: () => number = Math.random): ExamQuestion[] {
  const pool = eligibleQuestions();

  // category -> pack -> shuffled questions
  const byCategory = new Map<CategoryId, QuizQuestion[]>();
  for (const cat of CATEGORIES) {
    const byPack = new Map<string, QuizQuestion[]>();
    for (const q of pool) {
      if (categoryOfPack(q.packId) !== cat.id) continue;
      if (!byPack.has(q.packId)) byPack.set(q.packId, []);
      byPack.get(q.packId)!.push(q);
    }
    // Interleave packs (in random pack order) so a category's picks are
    // spread over its packs.
    const packQueues = shuffle([...byPack.values()].map((qs) => shuffle(qs, rand)), rand);
    const interleaved: QuizQuestion[] = [];
    let added = true;
    while (added) {
      added = false;
      for (const queue of packQueues) {
        const next = queue.shift();
        if (next) {
          interleaved.push(next);
          added = true;
        }
      }
    }
    if (interleaved.length) byCategory.set(cat.id, interleaved);
  }

  const picked: QuizQuestion[] = [];
  const catOrder = shuffle([...byCategory.keys()], rand);
  while (picked.length < length) {
    let progressed = false;
    for (const cat of catOrder) {
      if (picked.length >= length) break;
      const next = byCategory.get(cat)!.shift();
      if (next) {
        picked.push(next);
        progressed = true;
      }
    }
    if (!progressed) break;
  }

  return shuffle(picked, rand).map((question) => {
    const options = shuffle([question.correct, ...question.wrong], rand);
    return { question, options, correctIndex: options.indexOf(question.correct) };
  });
}

export function percentOf(result: Pick<ExamResult, "correct" | "total">): number {
  return result.total === 0 ? 0 : Math.round((result.correct / result.total) * 100);
}

export interface CategoryScore {
  category: CategoryId;
  correct: number;
  total: number;
}

/** Per-category tally of a finished exam, in Home order. */
export function scoreByCategory(result: ExamResult, questionsById: Record<string, QuizQuestion>): CategoryScore[] {
  const tally = new Map<CategoryId, CategoryScore>();
  for (const a of result.answers) {
    const q = questionsById[a.questionId];
    const cat = q ? categoryOfPack(q.packId) : undefined;
    if (!cat) continue;
    const t = tally.get(cat) ?? { category: cat, correct: 0, total: 0 };
    t.total += 1;
    if (a.correct) t.correct += 1;
    tally.set(cat, t);
  }
  return CATEGORIES.map((c) => tally.get(c.id)).filter((t): t is CategoryScore => !!t);
}

export const QUIZ_BY_ID: Record<string, QuizQuestion> = Object.fromEntries(QUIZ.map((q) => [q.id, q]));
