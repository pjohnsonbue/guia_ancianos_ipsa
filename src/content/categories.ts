import type { CategoryId, Pack, Question } from "./types";
import { COURSE, PACKS_BY_ID } from "./course";
import { getQuestionsForPack } from "./questions";

/** The four parts of the course, in Home order, with the short labels used
 *  in the Simulacro's per-part breakdown. Their Home headings come from the
 *  spreadsheet's Course tab ("Section"). */
export const CATEGORIES: { id: CategoryId; shortTitle: string }[] = [
  { id: "guia", shortTitle: "Guía de liderazgo" },
  { id: "confesion", shortTitle: "Confesión de fe" },
  { id: "orden", shortTitle: "Libro de orden" },
  { id: "biblia", shortTitle: "Biblia" },
];

export const CATEGORY_SHORT_TITLE = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.shortTitle])) as Record<CategoryId, string>;

/** Id used for the virtual «Repasá» pack (Practice route param) — not a
 *  real pack in the spreadsheet. */
export const REVIEW_PACK_ID = "review";

/** Visible packs in Home order. */
export function getVisiblePacks(): Pack[] {
  return COURSE.flatMap((s) => s.groups.flatMap((g) => g.packIds)).map((id) => PACKS_BY_ID[id]);
}

/** «Repasá»: every question whose latest answer was wrong, in Home order. */
export function getReviewQuestions(isWrong: (questionId: string) => boolean): Question[] {
  return getVisiblePacks().flatMap((p) => getQuestionsForPack(p.id).filter((q) => isWrong(q.id)));
}

export function categoryOfPack(packId: string): CategoryId | undefined {
  return PACKS_BY_ID[packId]?.category;
}

/** UI Text key for a reading's "n de N leídos" line: the Guía is split into
 *  sections, the Confesión and the Libro de orden into chapters. */
export function readingProgressKey(docId: string, total: number): string {
  if (docId === "guia") return "home.readingSections";
  return total === 1 ? "home.readingChapterOne" : "home.readingChapters";
}
