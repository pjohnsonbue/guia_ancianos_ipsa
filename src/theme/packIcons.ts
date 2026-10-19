// A small decorative emoji mark per pack, shown on its Home-screen cover
// card. Kept separate from the content model since it's purely visual.
// Packs not listed fall back to 📘 (see PackCard).
export const PACK_ICONS: Record<string, string> = {
  review: "🔁",
  // Guía de liderazgo
  iglesia: "⛪",
  historia: "📜",
  escrituras: "📖",
  teologia: "🕊️",
  tarea: "🌍",
  // Libro de orden
  esenciales: "✝️",
  gobierno: "🏛️",
  disciplina: "⚖️",
  adoracion: "🎶",
  // Confesión de fe de Westminster
  cfw1: "📕",
  cfw2: "📗",
  cfw3: "📘",
  // Biblia
  pentateuco: "⛰️",
  historicos: "👑",
  sabiduria: "🪕",
  menores: "📯",
  mayores: "🔥",
  evangelios: "🐟",
  paulinas: "✉️",
  universales: "📨",
  apocalipsis: "🌅",
};
