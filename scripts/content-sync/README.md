# Content spreadsheet sync

`Contenido_Guia_Ancianos.xlsx` (project root) is the source of truth for the course structure, every review question and every on-screen string. Its tabs are **Course**, **Questions**, **Videos**, **UI Text** and **Read Me** (the Read Me tab explains every column, in Spanish).

## It runs automatically

`generate-content.mjs` runs before `npm start` / `npm run android` / `npm run ios` / `npm run web`. Edit the spreadsheet, run the app, and that's it. It writes:

| Output | What |
|---|---|
| `src/content/course.ts` | `PACKS`, `PACKS_BY_ID` and `COURSE` (the Home layout: sections, sub-headings and packs in order) |
| `src/content/questions.ts` | `QUESTIONS`, `QUESTIONS_BY_ID`, `getQuestionsForPack()` (used by the review packs, Repasá and the Simulacro) |
| `src/content/uiText.ts` | `UI_TEXT`, read by `t()` in `src/lib/i18n.ts` |
| `src/content/videos.ts` | `VIDEOS`, `VIDEOS_BY_ID`, `getVideosForReading()` (the Home video cards) |

Older generated files from the flashcard version (`packs.ts`, `quiz.ts`, `generated/*.ts`) are deleted if found; only files carrying the auto-generated header are ever touched.

```
npm run sync-content     # regenerate
npm run check-content    # exit 1 if anything is out of date (use in CI)
```

The generator validates the sheet and **fails loudly** with row numbers: duplicate or malformed IDs, Lecturas pointing at chapters that don't exist in `src/content/documents/*.json`, Course rows of the same section not kept together, questions with a missing answer, fewer than three wrong answers or duplicate options, «which verse / which chapter / how many» trivia questions, packs without questions, bad colours, duplicate or empty UI Text keys, and videos whose `.mp4` or poster is missing.

## Editing rules (short version)

- **Course**: one row per pack, in Home order. **Section** is the document heading (Guía de Formación de Liderazgo, Confesión de fe de Westminster, Libro de orden, Biblia); **Subsection** is an optional sub-heading (e.g. Historia de la iglesia, Libro de gobierno).
  - A row with **Document**, **First Chapter** and **Last Chapter** is a *Lectura*: Home shows «Reading Title» as a button, then its review videos, then the «Questions Title» pack. The button's subtitle is generated: Guía Lecturas name the part and section numbers («La iglesia y el rol del anciano: secciones 1–5»), Confesión Lecturas list the chapter titles, and Libro de orden Lecturas have none.
  - A row without a Document (the Bible packs) is a question pack only.
- **Visible?** FALSE hides a pack from Home and removes its questions from the Simulacro.
- **Questions**: Pack ID, Question ID (`<pack>-NN`), Question, Correct Answer, Wrong 1-3, Explanation (shown after answering) and Reference (document section or Bible passage). Aim for 10–15 per pack, more for longer readings.
  - Ask about content and meaning, not trivia.
  - Keep the four options similar in length and style so the right one doesn't stand out. Options are shuffled in the app.
- **Videos**: one row per video, attached to a **Reading ID**. **Position** `after` (or empty) shows it after the Lectura as «Video de repaso»; `before` shows it just ahead of the Lectura (under its sub-heading) as «Video de introducción»; `section` makes it the «Video de introducción» to the whole document, right under the section heading (under an «Introducción» sub-heading when the section has sub-headings), with a small gap after it. The file is `media/videos/<Video ID>.mp4` and the thumbnail `media/videos/posters/<Video ID>.jpg`. Fill **Stream URL** (https) instead to stream it rather than bundle it.
- Row order sets question order within a pack.
- **Never rename a Pack ID, Question ID or Video ID.** They key users' saved progress and exam history.
- `{n}` etc. in a UI Text string is replaced at runtime (`t("home.reviewSubtitle", { n })`).

After any content change: `npm run typecheck`.
