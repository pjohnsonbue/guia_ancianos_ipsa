# Guía de Formación de Ancianos IPSA

A study app (iPhone and Android) for elders in training in the **Presbiterio San Andrés** (Iglesia Presbiteriana San Andrés, Argentina). The UI is in Argentine Spanish (voseo).

It's a fork of the Repaso (GCSE Spanish) app and keeps its architecture: Expo (React Native + TypeScript), a spreadsheet as the content source of truth, flip/swipe flashcards with local progress. Audio, exam-board picking and the paywall were removed (everything is free), and a **Simulacro** (practice exam) was added.

## Run it

```
npm install
npx expo start
```

Scan the QR code with Expo Go. Pinned to **Expo SDK 57**, like the other Lumena apps (see AGENTS.md).

## What's in it

| | |
|---|---|
| Categories | Guía de liderazgo · Libro de orden · Confesión de fe de Westminster · Biblia |
| Content | 21 packs, 916 flashcards, 226 multiple-choice questions |
| Simulacro | 30 random questions, spread evenly over the 4 categories (7–8 each) and over each category's packs; options shuffled; instant feedback with the reference; result screen with %, pass/fail (70%), per-category breakdown, missed questions and history |
| Review deck | "Repasá" on Home: every card seen but not ticked "La saqué" |
| Fuente | Tapping "Fuente: …" on a card's back opens a popup with the verbatim supporting quote and exactly where it is (document › chapter › section / §). Bible cards quote the passage from the Reina-Valera 1909 (public domain, accents modernised) |
| Progress | Stored on the device only (AsyncStorage). No accounts, nothing sent anywhere |

### Packs

- **Guía de liderazgo** (source: *Documento maestro Guía de Liderazgo*): La iglesia y el rol del anciano · La historia de la iglesia · Las Santas Escrituras · Teología · La tarea de la iglesia en el mundo
- **Libro de orden** (source: *Libro de Orden 2018*): Los esenciales de nuestra fe · Libro de gobierno · Libro de disciplina · Libro de adoración
- **Confesión de fe de Westminster** (source: Fraternidad Reformada Argentina edition, 35 chapters; catechism not covered): Capítulos 1-10 · 11-20 · 21-35
- **Biblia** (written independently; big-picture questions and theologically central passages read from an evangelical, Reformed perspective; every answer cites a passage): Pentateuco · Libros históricos · Sabiduría y poesía · Profetas menores · Profetas mayores · Evangelios + Hechos · Cartas paulinas · Cartas universales · Apocalipsis

Every card and question carries a **Reference**: a section of the source document (e.g. `LG §16-12`, `LD §9-1I`, `CFW 1.4`, `Guía · Nicea`) or a Bible passage (e.g. `Génesis 12:1-3`). Every card also carries a **Source Quote** + **Source Location** (shown in the Fuente popup). These were extracted verbatim from the source documents (best-matching sentences within the referenced section, plus a handful of hand-picked ones); long passages are shortened with « … ». For Bible passages longer than ~420 characters, the most relevant verses are quoted and the location says "(selección de versículos)".

> **Content review.** The Guía, Libro de orden and CFW content was written from the attached documents; the Bible content was written from general knowledge (Reina-Valera book names and wording). The Fuente quotes were matched automatically and spot-checked; skim them too. It's a study aid, not an official IPSA publication. Before release, have a pastor or the Comité de Educación del Presbiterio skim the spreadsheet; any fix is a cell edit.

## Editing content

Edit **`Contenido_Guia_Ancianos.xlsx`** (tabs: Packs, Cards, Quiz, UI Text, Read Me), then run the app as usual. `npm start` regenerates `src/content/generated/*.ts`, `packs.ts`, `quiz.ts` and `uiText.ts`. See `scripts/content-sync/README.md`.

```
npm run sync-content    # regenerate by hand
npm run check-content   # fail if generated files are stale (for CI)
npm run typecheck
```

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
2. **Bundle ID** is `com.lumena.guiaancianos` (iOS and Android). Create the app records in App Store Connect and Play Console.
3. **Privacy policy.** Publish `release/privacy-policy.html` and point `PRIVACY_POLICY_URL` in `src/screens/SettingsScreen.tsx` at it.
4. **Store listing.** Draft copy (Spanish) is in `store-listing-copy.md`. Screenshots still to do.
5. `npx eas build --platform all`, then `npx eas submit`.

No in-app purchases, so no RevenueCat setup is needed.

## Project structure

```
Contenido_Guia_Ancianos.xlsx  content source of truth
src/
  content/
    types.ts                  Card, Pack, QuizQuestion, CategoryId
    categories.ts             the 4 Home sections, review deck
    exam.ts                   Simulacro: buildExam (balanced sampling), scoring
    packs.ts, quiz.ts, uiText.ts, generated/*.ts   generated
  components/                 Flashcard (flip/swipe), icons, ProgressScrubber, SourceModal, decor (DashBand, BrandMark)
  screens/                    Home, Study, Exam, ExamResult, Settings
  state/AppState.tsx          card progress + exam history (AsyncStorage)
  lib/                        i18n t(), rating
  theme/                      palette, type, pack icons
scripts/
  content-sync/               spreadsheet → TS generator
  build_logo_icon.py          turns the IPSA logo into the master icon layers
  make_icons.py               icon + store graphics generator
```
