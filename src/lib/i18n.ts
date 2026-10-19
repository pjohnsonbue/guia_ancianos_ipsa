import { UI_TEXT } from "../content/uiText";

/**
 * UI text lookup. The app is in Argentine Spanish (voseo), and every on-screen
 * string lives in the "UI Text" tab of Contenido_Guia_Ancianos.xlsx (generated
 * into src/content/uiText.ts) so copy can be edited without touching code.
 *
 * `vars` fills {placeholders}: t("home.reviewSubtitle", { n: 12 }).
 * A missing key returns the key itself, which makes typos obvious in dev.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  let text = UI_TEXT[key] ?? key;
  if (__DEV__ && !(key in UI_TEXT)) console.warn(`[i18n] Missing UI Text key: ${key}`);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  }
  return text;
}

export type TFunction = typeof t;

/** Hook form, kept so screens read the same as before (and so a future
 *  locale switch could re-render through it without touching call sites). */
export function useT(): TFunction {
  return t;
}
