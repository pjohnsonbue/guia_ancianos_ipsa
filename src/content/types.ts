/** The four top-level groupings on Home. Pack → category mapping lives in
 *  the content spreadsheet (Packs tab, "Category" column); the category
 *  titles and order live in src/content/categories.ts. */
export type CategoryId = "guia" | "orden" | "cfw" | "biblia";

export interface CardFront {
  /** The question / prompt shown on the front of the card. */
  text: string;
}

export interface CardBack {
  /** The answer. */
  text: string;
  /** Optional extra explanation shown under the answer. */
  note?: string;
  /** Where to look it up: a section of the source document (e.g. "LG §16-12",
   *  "CFW 1.4") or, for Bible cards, a passage (e.g. "Génesis 12:1-3"). */
  ref?: string;
  /** Verbatim supporting text, shown in a popup when the "Fuente" chip is tapped. */
  source?: CardSource;
}

export interface CardSource {
  /** Direct quote from the document (or the Bible passage, RV 1909). May contain "\n" for lists. */
  quote: string;
  /** Where the quote is: document › chapter › section / § / passage. */
  location: string;
}

export interface Card {
  id: string;
  packId: string;
  front: CardFront;
  back: CardBack;
}

export interface Pack {
  id: string;
  title: string;
  description: string;
  category: CategoryId;
  /** Accent colour used for the pack's cover + cards. */
  color: string;
  cardIds: string[];
  /** Whether this pack is shown in the app ("Visible?" column). */
  visible: boolean;
}

/** A multiple-choice question for the exam simulation (Simulacro). */
export interface QuizQuestion {
  id: string;
  packId: string;
  question: string;
  correct: string;
  /** Exactly three wrong options. */
  wrong: [string, string, string];
  ref?: string;
}
