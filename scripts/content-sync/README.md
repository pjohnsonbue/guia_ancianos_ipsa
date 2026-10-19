# Content spreadsheet sync

`Contenido_Guia_Ancianos.xlsx` (project root) is the source of truth for every pack, card, exam question and on-screen string. Its tabs are **Packs**, **Cards**, **Quiz**, **UI Text** and **Read Me** (the Read Me tab explains every column, in Spanish).

## It runs automatically

`generate-content.mjs` runs before `npm start` / `npm run android` / `npm run ios` / `npm run web`. Edit the spreadsheet, run the app, and that's it. It writes:

| Output | What |
|---|---|
| `src/content/generated/<packId>.ts` | One card array per pack |
| `src/content/packs.ts` | `PACKS`, `ALL_CARDS`, `PACKS_BY_ID`, `CARDS_BY_ID`, `getCardsForPack()` |
| `src/content/quiz.ts` | `QUIZ`, the multiple-choice bank for the Simulacro |
| `src/content/uiText.ts` | `UI_TEXT`, read by `t()` in `src/lib/i18n.ts` |

Generated pack files for packs removed from the sheet are deleted (only files carrying the auto-generated header are ever touched).

```
npm run sync-content     # regenerate
npm run check-content    # exit 1 if anything is out of date (use in CI)
```

The generator validates the sheet and **fails loudly** with row numbers: duplicate or malformed IDs, unknown Pack IDs or categories, missing question/answer text, quiz questions without three distinct wrong answers, bad colours, and duplicate or empty UI Text keys.

## Editing rules (short version)

- **Category** (Packs): `guia`, `orden`, `cfw` or `biblia`.
- **Visible?** FALSE hides a pack from Home and removes its questions from the Simulacro.
- **Cards**: Front (Question), Back (Answer), optional Back Note, a Reference (document section or Bible passage), and Source Quote + Source Location (verbatim quote shown when the user taps «Fuente»; both or neither).
- **Quiz**: Correct Answer + Wrong 1-3. Keep the four options similar in length and style so the right one doesn't stand out. Options are shuffled in the app.
- Row order sets pack order (within a category) and card order (within a pack).
- **Never rename a Card ID or Question ID.** They key users' saved progress and exam history.
- `{n}` etc. in a UI Text string is replaced at runtime (`t("home.reviewSubtitle", { n })`).

After any content change: `npm run typecheck`.
