// The full study documents, read in the course's «Lectura» sections.
import type { DocumentId, Pack } from "../types";
// The JSON files are generated from the original documents by
// scripts/documents/build_documents.py (see scripts/documents/README.md);
// don't edit them by hand.

/** ["h"] subheading · ["p"] paragraph · ["q"] quotation · ["li"] list item ·
 *  ["refs"] proof texts · ["note"] footnote · ["row", cells] table row.
 *  Inline **bold** and *italic*. */
export type DocBlock = ["h" | "p" | "q" | "li" | "refs" | "note", string] | ["row", string[]];

export interface DocChapter {
  id: string;
  title: string;
  blocks: DocBlock[];
}

export interface DocPart {
  title: string;
  chapters: DocChapter[];
}

export interface StudyDocument {
  id: DocumentId;
  title: string;
  parts: DocPart[];
}

export type { DocumentId };

// Loaded on first open (each file is a few hundred KB of text).
const cache: Partial<Record<DocumentId, StudyDocument>> = {};

export function loadDocument(id: DocumentId): StudyDocument {
  if (!cache[id]) {
    switch (id) {
      case "guia":
        cache[id] = require("./guia.json");
        break;
      case "confesion":
        cache[id] = require("./confesion.json");
        break;
      case "orden":
        cache[id] = require("./orden.json");
        break;
    }
  }
  return cache[id] as StudyDocument;
}

export interface FlatChapter extends DocChapter {
  partTitle: string;
  index: number;
}

/** Every chapter in reading order, with its part title. */
export function flatChapters(doc: StudyDocument): FlatChapter[] {
  const out: FlatChapter[] = [];
  doc.parts.forEach((p) => p.chapters.forEach((c) => out.push({ ...c, partTitle: p.title, index: out.length })));
  return out;
}

/** The chapters of a pack's reading, in order (`index` is within the reading). */
export function readingChapters(pack: Pack): FlatChapter[] {
  if (!pack.reading) return [];
  const wanted = new Set(pack.reading.chapterIds);
  return flatChapters(loadDocument(pack.reading.docId))
    .filter((c) => wanted.has(c.id))
    .map((c, index) => ({ ...c, index }));
}
