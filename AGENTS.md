# Project notes

This project is on Expo SDK 58 (React Native 0.88, React 19.3). Keep the Expo Go client on the developer's phone on SDK 58 too. Do not upgrade the Expo SDK, `react` or `react-native` without first confirming that the installed Expo Go supports the new SDK. A mismatch triggers "Project is incompatible with this version of Expo Go". A custom dev build (`eas build --profile development`) avoids it entirely.

Content rules:
- `src/content/documents/*.json` (the text shown in each Lectura) are generated from the original documents by `scripts/documents/build_documents.py`; don't hand-edit them.
- `Contenido_Guia_Ancianos.xlsx` is the source of truth. Never hand-edit `src/content/course.ts`, `src/content/questions.ts`, `src/content/uiText.ts` or `src/content/videos.ts`; they are regenerated on every `npm start`.
- Category titles/order live in code, in `src/content/categories.ts`; pack → category comes from the Course tab's Section column. Course row order is the order on Home.
- Pack IDs, Question IDs and Video IDs are keys for users' stored progress and exam history. Never rename or reuse them.
- The UI is Argentine Spanish (voseo: "tocá", "elegí", "repasá"). Every on-screen string goes through `t("key")` from the spreadsheet's UI Text tab.
- Questions are multiple choice (one correct answer, three wrong ones). Ask about content and meaning, not «which verse / which chapter / how many» trivia (the generator rejects those). Keep the four options similar in length so the right one doesn't stand out.
- Guía / Libro de orden / CFW questions must stay faithful to the source documents and cite the section in Reference. Bible questions cite a passage; any quoted wording comes from the Reina-Valera 1909 (public domain), never from a copyrighted translation.

Checks before shipping: `npm run check-content && npm run typecheck && npx expo export --platform ios`.
