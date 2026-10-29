# Curso de Formación de Ancianos

A study app (iPhone and Android) for elders in training in the **Presbiterio San Andrés** (Iglesia Presbiteriana San Andrés, Argentina). The UI is in Argentine Spanish (voseo).

It's a guided course: the user **reads** a portion of a source document (a «Lectura»), **watches** the short videos that reinforce it, then answers **multiple-choice review questions** on what they read. A **Simulacro** (practice exam) draws from all of it. It began as a fork of the Repaso (GCSE Spanish) app and keeps its architecture: Expo (React Native + TypeScript), a spreadsheet as the content source of truth, progress stored on the device. Everything is free.

## Run it

```
npm install
npx expo start
```

Scan the QR code with Expo Go (it must support **SDK 58**), or use a development build (`npx eas build --profile development`). On **Expo SDK 58** (React Native 0.88, React 19.3); see AGENTS.md.

## What's in it

| | |
|---|---|
| Course | Three documents split into 33 Lecturas, each with its videos and a «Preguntas de repaso» pack, plus 9 Bible packs in their own section at the end (see below) |
| Content | 42 packs, 551 multiple-choice questions (10–15 per pack, scaled to the length of the reading). Questions are about content and meaning, never «which verse / which chapter / how many» trivia |
| Lectura | A button on Home («Lectura: …», subtitle = the sections it covers, «n de N leídos»). It opens a table of contents of just those sections; the chapter reader has adjustable text size and a «Volver al curso» button after the last section |
| Preguntas de repaso | One question at a time, options shuffled, instant feedback with an explanation and the reference (document section or Bible passage). End screen: score, «Repetir las que fallé», «Repetir todas» |
| Simulacro | 30 random questions spread over the 4 categories and their packs; options shuffled; instant feedback; result screen with %, pass/fail (70%), per-category breakdown, missed questions and history |
| Videos | Short vertical motion-graphics videos (captions burned in), shown on Home as a «Video de introducción» (to a whole document, at the top of its section, or just before a Lectura) or as a «Video de repaso» after a Lectura. Full-screen player (`expo-video`); a video is marked «Visto» once 90% has played |
| Repasá | On Home: every question the user last answered wrong |
| Progress | Stored on the device only (AsyncStorage). No accounts, nothing sent anywhere |

### Course structure

- **Guía de Formación de Liderazgo**, by sub-heading: *La iglesia* · *El anciano* · *Historia de la iglesia* (Historia de la iglesia, La Reforma Protestante, Nuestro contexto) · *Las Santas Escrituras* · *La teología* (La teología, Cristo y la salvación, El pacto y las últimas cosas) · *La tarea de la iglesia*
- **Confesión de fe de Westminster** (Fraternidad Reformada Argentina edition; the Catecismo Menor isn't part of the course): Capítulos 1–5 · 6–8 · 9–12 · 13–16 · 17–20 · 21–24 · 25–29 · 30–31 · 32–33 · 34–35
- **Libro de orden** (2018): *Los esenciales de nuestra fe*; *Libro de gobierno*: Cap. 1–4 · 5–9 · 10–15 · 16–18; *Libro de disciplina*: Cap. 1 · 2–4 · 5–7 · 8–10 · 11–14; *Libro de adoración*: Cap. 1–2 · 3 · 4–7
- **Biblia** (its own section after the Libro de orden; question packs only, no reading; big-picture questions on theologically central passages from an evangelical, Reformed perspective): Pentateuco · Libros históricos · Sabiduría y poesía · Profetas menores · Profetas mayores · Evangelios + Hechos · Cartas paulinas · Cartas universales · Apocalipsis

Every question has an **Explanation** and a **Reference**: a section of the source document (e.g. `LG §16-12`, `CFW 1.4`) or a Bible passage (e.g. `Génesis 12:1-3`). The previous flashcard content (cards with verbatim «Fuente» quotes, and the old quiz bank) is archived in `archivo/Contenido_v1_tarjetas.xlsx`.

> **Content review.** The Guía, Libro de orden and CFW questions were written from the source documents; the Bible questions were written from general knowledge (Reina-Valera book names and wording). It's a study aid, not an official IPSA publication. Before release, have a pastor or the Comité de Educación del Presbiterio skim the spreadsheet; any fix is a cell edit.

## Editing content

Edit **`Contenido_Guia_Ancianos.xlsx`** (tabs: Course, Questions, Videos, UI Text, Read Me), then run the app as usual. `npm start` regenerates `src/content/course.ts`, `questions.ts`, `uiText.ts` and `videos.ts`. See `scripts/content-sync/README.md`.

```
npm run sync-content    # regenerate by hand
npm run check-content   # fail if generated files are stale (for CI)
npm run typecheck
```

### Adding a video

1. Put the MP4 in `media/videos/<video-id>.mp4` (vertical 1080×1920, H.264; the source pages and scripts for the existing ones are in `media/videos/source/`).
2. Make its thumbnail, a square crop of the title frame:
   ```
   ffmpeg -ss 7 -i media/videos/<video-id>.mp4 -frames:v 1 -vf "crop=1080:1080:0:140,scale=240:240" -q:v 3 media/videos/posters/<video-id>.jpg
   ```
3. Add a row to the **Videos** tab: Video ID, Title, Reading ID (the Lectura it goes with), Position (`section` = introduces the whole document, `before` = introduces the Lectura, `after` = review), Duration (m:ss).

Videos are bundled into the app (about 7 MB each), so new ones ship with an app update. To keep the download small as the list grows, host the file anywhere that serves https and put its address in **Stream URL**; that video then streams instead and needs no local `.mp4`.

## Icons, splash and store assets

The logo is the IPSA emblem (shield, Saint Andrew's saltire and burning bush), supplied as `assets/source/logo-ipsa.png`. `scripts/build_logo_icon.py` redraws it as crisp layers (`app-icon.png` = emblem on navy, `app-icon-background.png`, `emblem.png`) and `scripts/make_icons.py` builds every icon from them. To regenerate everything:

```
pip install pillow numpy
python scripts/build_logo_icon.py    # only if the logo changes
python scripts/make_icons.py
```

This writes `assets/icon.png` (also used as the in-app logo, `BrandMark`), the splash image (the emblem on transparency, shown on navy), the Android adaptive icon layers (foreground, navy background, themed monochrome), the favicon, and `store-assets/` (512 icon + Play feature graphic). The navy `#1A2B51` is set in `app.json` (splash and adaptive icon `backgroundColor`) and in `ICON_BACKGROUND` in `src/components/CustomSplashScreen.tsx`; if the logo colour changes, update those with the colour the script prints.

## Going live

1. **New EAS project.** `app.json` has no `extra.eas.projectId` on purpose. Run `npx eas init` so this app doesn't build into another project.
2. **Bundle ID / package** is `com.lumena.formacionipsa` (iOS and Android). Create the app records in App Store Connect and Play Console.
3. **Privacy policy.** Publish `release/privacy-policy.html` and point `PRIVACY_POLICY_URL` in `src/screens/SettingsScreen.tsx` at it.
4. **Store listing.** Draft copy (Spanish) is in `store-listing-copy.md`. Screenshots still to do.
5. `npx eas build --platform all`, then `npx eas submit`.

No in-app purchases, so no RevenueCat setup is needed.

## Project structure

```
Contenido_Guia_Ancianos.xlsx  content source of truth
archivo/                      the v1 flashcard content, kept for reference
src/
  content/
    types.ts                  Reading, Pack, CourseSection, Question, Video, CategoryId
    categories.ts             the 4 categories, Repasá questions, reading-progress keys
    documents/                document text (JSON built by scripts/documents/) + loader
    exam.ts                   Simulacro: buildExam (balanced sampling), scoring
    course.ts, questions.ts, uiText.ts, videos.ts   generated
  components/                 QuestionView (shared by Practice and Exam), icons, decor (DashBand, BrandMark)
  screens/                    Home, Reading (a Lectura's sections), Reader, Practice, Exam, ExamResult, Settings, Video
  state/AppState.tsx          answers, sections read, watched videos, exam history (AsyncStorage)
  lib/                        i18n t(), rating
  theme/                      palette, type, pack icons
media/videos/                 the videos (.mp4), posters/ thumbnails, source/ pages + scripts
scripts/
  content-sync/               spreadsheet → TS generator
  documents/                  original documents → reader JSON (build_documents.py)
  build_logo_icon.py          turns the IPSA logo into the master icon layers
  make_icons.py               icon + store graphics generator
```
