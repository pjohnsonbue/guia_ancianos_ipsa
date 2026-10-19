// Design language: a warm paper-cream study notebook with the colours of the
// Saint Andrew's saltire — azul San Andrés for anything you can tap, deep
// navy ink for text — plus a burgundy and an old-gold accent taken from the
// app icon. Each category has its own colour family (pack colours live in
// the content spreadsheet).

export const fontFamily = {
  // Fraunces — warm, high-contrast serif for headlines, pack names and the
  // question on a card.
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  displayBlack: "Fraunces_900Black",
  displayItalic: "Fraunces_600SemiBold_Italic",
  displayBoldItalic: "Fraunces_700Bold_Italic",
  // Manrope — clean grotesk for everything you actually read.
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemiBold: "Manrope_600SemiBold",
  bodyBold: "Manrope_700Bold",
  bodyExtraBold: "Manrope_800ExtraBold",
};

export const palette = {
  // Grounds
  cream: "#F8F5EF",
  creamDeep: "#EFE9DE",
  surface: "#FFFFFF",

  // Ink
  ink: "#152238",
  inkMuted: "#5F6878",
  border: "#E4DDD0",
  borderStrong: "#D2C8B6",

  // Accents
  azul: "#0B4F9C", // San Andrés blue: primary interactive accent
  azulDeep: "#083A73",
  azulTint: "#E7EFF9", // selected / highlighted backgrounds
  borravino: "#8E2C3B", // burgundy: decoration + warm labels
  borravinoDeep: "#6E1F2C",
  oro: "#C6922A", // old gold: Simulacro CTA, decoration
  oroDeep: "#9E7116",
  verde: "#1F8A5B", // success / "La saqué" / correct answer
  verdeDeep: "#166B46",
  verdeTint: "#E4F4EC",

  danger: "#C2413B",
  dangerTint: "#FBE9E7",
  locked: "#B8ADA0",
};

/** Darkens a hex colour by roughly `amount` (0–1) in HSL lightness — builds
 *  a two-stop gradient partner for any pack's flat accent colour. */
export function darken(hex: string, amount = 0.16): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  let sat = 0;
  const light = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue *= 60;
  }
  const newLight = Math.max(0, light - amount);
  const c = (1 - Math.abs(2 * newLight - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = newLight - c / 2;
  let [r2, g2, b2] = [0, 0, 0];
  if (hue < 60) [r2, g2, b2] = [c, x, 0];
  else if (hue < 120) [r2, g2, b2] = [x, c, 0];
  else if (hue < 180) [r2, g2, b2] = [0, c, x];
  else if (hue < 240) [r2, g2, b2] = [0, x, c];
  else if (hue < 300) [r2, g2, b2] = [x, 0, c];
  else [r2, g2, b2] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}

// Cached: darken() does HSL maths and is called for every pack card and
// every Flashcard mount.
const packGradientCache = new Map<string, [string, string]>();

export function packGradient(hex: string): [string, string] {
  const cached = packGradientCache.get(hex);
  if (cached) return cached;
  const result: [string, string] = [hex, darken(hex, 0.16)];
  packGradientCache.set(hex, result);
  return result;
}

export const gradients = {
  azul: [palette.azul, palette.azulDeep] as [string, string],
  borravino: [palette.borravino, palette.borravinoDeep] as [string, string],
  oro: [palette.oro, palette.oroDeep] as [string, string],
  verde: [palette.verde, palette.verdeDeep] as [string, string],
};

export const theme = {
  colors: {
    background: palette.cream,
    backgroundDeep: palette.creamDeep,
    surface: palette.surface,
    text: palette.ink,
    textMuted: palette.inkMuted,
    border: palette.border,
    borderStrong: palette.borderStrong,
    accent: palette.azul,
    accentDeep: palette.azulDeep,
    accentTint: palette.azulTint,
    accentWarm: palette.borravino,
    accentGold: palette.oro,
    accentGoldDeep: palette.oroDeep,
    success: palette.verde,
    successTint: palette.verdeTint,
    locked: palette.locked,
    danger: palette.danger,
    dangerTint: palette.dangerTint,
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999,
  },
  spacing: (n: number) => n * 8,
  font: {
    title: { fontFamily: fontFamily.displayBlack, fontSize: 30 },
    heading: { fontFamily: fontFamily.displayBold, fontSize: 20 },
    body: { fontFamily: fontFamily.body, fontSize: 16 },
    label: { fontFamily: fontFamily.bodyExtraBold, fontSize: 13 },
    cardFront: { fontFamily: fontFamily.displayBold, fontSize: 24 },
    cardBack: { fontFamily: fontFamily.bodySemiBold, fontSize: 18 },
  },
};

export type Theme = typeof theme;
