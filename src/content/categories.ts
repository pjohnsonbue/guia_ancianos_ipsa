import type { Card, CategoryId, Pack } from "./types";
import { PACKS, PACKS_BY_ID, getCardsForPack } from "./packs";

/**
 * The four Home sections, in order. Which pack belongs to which category is
 * set in the content spreadsheet (Packs tab → Category); pack order within a
 * category follows the spreadsheet's row order.
 */
export interface Category {
  id: CategoryId;
  title: string;
  subtitle: string;
  /** Short label used in exam result breakdowns. */
  shortTitle: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "guia",
    title: "Guía de liderazgo",
    shortTitle: "Guía de liderazgo",
    subtitle: "La Guía de Formación de Liderazgo del Presbiterio San Andrés",
  },
  {
    id: "orden",
    title: "Libro de orden",
    shortTitle: "Libro de orden",
    subtitle: "Los esenciales de nuestra fe y la Constitución de la IPSA",
  },
  {
    id: "cfw",
    title: "Confesión de fe de Westminster",
    shortTitle: "Confesión de fe",
    subtitle: "Los 35 capítulos de la Confesión (sin los catecismos)",
  },
  {
    id: "biblia",
    title: "Biblia",
    shortTitle: "Biblia",
    subtitle: "Los grandes temas y pasajes clave, libro por libro",
  },
];

export const CATEGORIES_BY_ID: Record<CategoryId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CategoryId, Category>;

export interface HomeSection {
  category: Category;
  packs: Pack[];
}

/** Home-screen layout: each category with its visible, non-empty packs. */
export function getHomeSections(): HomeSection[] {
  return CATEGORIES.map((category) => ({
    category,
    packs: PACKS.filter((p) => p.category === category.id && p.visible && p.cardIds.length > 0),
  })).filter((s) => s.packs.length > 0);
}

/** Id used for the virtual "Repaso" deck (Study route param) — not a real
 *  pack in the spreadsheet. */
export const REVIEW_PACK_ID = "review";

/** Cards for the review deck: every card in a visible pack that has been seen
 *  but not ticked "La saqué" yet, in Home order. */
export function getReviewCards(opts: { hasSeen: (cardId: string) => boolean; isKnown: (cardId: string) => boolean }): Card[] {
  const out: Card[] = [];
  for (const section of getHomeSections()) {
    for (const pack of section.packs) {
      for (const card of getCardsForPack(pack.id)) {
        if (opts.hasSeen(card.id) && !opts.isKnown(card.id)) out.push(card);
      }
    }
  }
  return out;
}

export function categoryOfPack(packId: string): CategoryId | undefined {
  return PACKS_BY_ID[packId]?.category;
}
