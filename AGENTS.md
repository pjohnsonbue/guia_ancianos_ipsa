# Project notes

This project is pinned to Expo SDK 57, matching the other Lumena apps and the Expo Go client on the developer's phone. Do not upgrade the Expo SDK, `react` or `react-native` without first confirming that the installed Expo Go supports the new SDK. A mismatch triggers "Project is incompatible with this version of Expo Go". A custom dev build (`eas build --profile development`) avoids it entirely.

Content rules:
- `Contenido_Guia_Ancianos.xlsx` is the source of truth. Never hand-edit `src/content/generated/*`, `src/content/packs.ts`, `src/content/quiz.ts` or `src/content/uiText.ts`; they are regenerated on every `npm start`.
- Category titles/order live in code, in `src/content/categories.ts`; pack → category is the spreadsheet's Category column.
- Card IDs and Question IDs are keys for users' stored progress and exam history. Never rename or reuse them.
- The UI is Argentine Spanish (voseo: "tocá", "elegí", "repasá"). Every on-screen string goes through `t("key")` from the spreadsheet's UI Text tab.
- Guía / Libro de orden / CFW content must stay faithful to the source documents; every card has a Reference plus a verbatim Source Quote + Source Location (Fuente popup). Bible cards cite a passage and quote it from the Reina-Valera 1909 (public domain) — never from a copyrighted translation.

Checks before shipping: `npm run check-content && npm run typecheck && npx expo export --platform ios`.
