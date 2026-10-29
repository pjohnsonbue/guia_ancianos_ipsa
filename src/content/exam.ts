import type { CategoryId, Question } from "./types";
import { QUESTIONS, QUESTIONS_BY_ID } from "./questions";
import { CATEGORIES, categoryOfPack } from "./categories";
import { PACKS_BY_ID } from "./course";

/** Number of questions in one Simulacro. */
export const EXAM_LENGTH = 30;

/** Percentage at or above which a Simulacro counts as passed. */
export const PASS_PERCENT = 70;

export interface ExamQuestion {
  question: Question;
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

export function shuffle<T>(items: T[], rand: () => number = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Questions eligible for the exam: those whose pack is visible. */
function eligibleQuestions(): Question[] {
  return QUESTIONS.filter((q) => PACKS_BY_ID[q.packId]?.visible);
}

/**
 * Builds a fresh Simulacro of up to EXAM_LENGTH questions.
 *
 * Questions are drawn round-robin across the four categories, so every exam
 * covers the Guía, the Confesión, the Libro de orden and the Bible roughly
 * equally, no matter how many questions each category has. Within a category,
 * questions are also spread round-robin across its packs, so one large pack
 * can't dominate. The final list is shuffled, as are the options of each
 * question.
 */
export function buildExam(length: number = EXAM_LENGTH, rand: () => number = Math.random): ExamQuestion[] {
  const pool = eligibleQuestions();

  // category -> pack -> shuffled questions
  const byCategory = new Map<CategoryId, Question[]>();
  for (const cat of CATEGORIES) {
    const byPack = new Map<string, Question[]>();
    for (const q of pool) {
      if (categoryOfPack(q.packId) !== cat.id) continue;
      if (!byPack.has(q.packId)) byPack.set(q.packId, []);
      byPack.get(q.packId)!.push(q);
    }
    // Interleave packs (in random pack order) so a category's picks are
    // spread over its packs.
    const packQueues = shuffle([...byPack.values()].map((qs) => shuffle(qs, rand)), rand);
    const interleaved: Question[] = [];
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

  const picked: Question[] = [];
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

  return shuffle(picked, rand).map((question) => withShuffledOptions(question, rand));
}

/** A question with its four options in a fresh random order. */
export function withShuffledOptions(question: Question, rand: () => number = Math.random): ExamQuestion {
  const options = shuffle([question.correct, ...question.wrong], rand);
  return { question, options, correctIndex: options.indexOf(question.correct) };
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
export function scoreByCategory(result: ExamResult, questionsById: Record<string, Question>): CategoryScore[] {
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

export { QUESTIONS_BY_ID };
