/** The four parts of the course. Each question pack belongs to one; the
 *  Simulacro draws evenly from them and reports a score per part. */
export type CategoryId = "guia" | "confesion" | "orden" | "biblia";

export type DocumentId = "guia" | "confesion" | "orden";

/** A «Lectura»: a run of chapters from one of the study documents. */
export interface Reading {
  /** Shown as «Lectura: <title>». */
  title: string;
  docId: DocumentId;
  /** Chapter ids from src/content/documents/<docId>.json, in reading order. */
  chapterIds: string[];
  /** The names of the included chapters, for the card subtitle. */
  subtitle: string;
}

/** A pack of multiple-choice review questions — one per row of the
 *  spreadsheet's Course tab. Packs with a reading are shown as
 *  «Lectura» → videos → «Preguntas de repaso»; packs without one (Biblia)
 *  are shown on their own. */
export interface Pack {
  id: string;
  /** Pack title (after «Preguntas de repaso:» when there's a reading). */
  title: string;
  description: string;
  category: CategoryId;
  /** Accent colour of the pack card. */
  color: string;
  visible: boolean;
  questionIds: string[];
  reading?: Reading;
}

/** One heading on Home with its packs, optionally split by sub-headings. */
export interface CourseSection {
  title: string;
  category: CategoryId;
  groups: { title: string | null; packIds: string[] }[];
}

/** A multiple-choice question: used in a pack's «Preguntas de repaso», in
 *  «Repasá» and in the Simulacro. */
export interface Question {
  id: string;
  packId: string;
  question: string;
  correct: string;
  /** Exactly three wrong options. */
  wrong: [string, string, string];
  /** Shown after answering. */
  explanation?: string;
  /** Where to find the answer, e.g. "CFW 1.4" or "Génesis 12:1-3". */
  ref?: string;
}

/** A short video shown on Home just before the reading it introduces or
 *  just after the reading it reinforces (spreadsheet "Videos" tab). */
export interface Video {
  id: string;
  title: string;
  /** The pack whose reading this video goes with on Home. */
  packId: string;
  /** "section": «Video de introducción» to the whole document, under the
   *  section heading (above the first sub-heading). "before": «Video de
   *  introducción» just ahead of the reading. "after": «Video de repaso». */
  position: "section" | "before" | "after";
  /** Length in seconds (shown on the card). */
  duration: number;
  /** Bundled file (require) or a streamed { uri }. */
  source: number | { uri: string };
  poster: number;
}
