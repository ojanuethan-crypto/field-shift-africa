# SciFarm (Field Shift Africa)

Map-first, no-login farm planning app for the NASA Space Apps Challenge. Specs are in `Doc/`, design references in `Doc/Ref_Pictures/`.

```
npm install
npm run dev
```

Needs Node 20.19+ (or 22.12+). If `npm run dev` says "Cannot find native binding", run
`npm i --no-save @rolldown/binding-win32-x64-msvc @oxlint/binding-win32-x64-msvc` (known npm optional-dependency bug on Windows).

## Working in parallel without merge conflicts

Each person owns one group of screens and only touches their own files:

| Group | Screens | Folder |
|---|---|---|
| A | S0-S8 | `src/screens/s0-s8/` |
| B | S9-S17 | `src/screens/s9-s17/` |
| C | S18-S26 | `src/screens/s18-s26/` (done as the example) |

1. **Routes** - add `src/screens/<your-folder>/routes.jsx` that default-exports `[{ path: '/xyz', element: <Xyz /> }]`. It is auto-registered; never edit `App.jsx`.
2. **Text** - add your own `src/i18n/locales/en/<your-folder>.json` and `.../fr/<your-folder>.json`. Files are deep-merged. Use `t('key')`, never hardcode text.
3. **Shared UI** (`src/components/`): `ScreenHeader` (back + title + speaker), `SpeakButton`, `Card`, `Button`, `Stars`, `StatusIcon`, `StateScreen` (offline/error/desert/ocean/outside/nodata), `BottomNav` (already global).
4. **Settings** (`src/lib/settings.js`): `useSettings()` gives `{ lang, textSize, voice }`.
5. **Mock data** goes in `src/mock/` until the backend is ready.
6. Only change shared files (`index.css` tokens, `components/`, `lib/`) in small separate commits, and tell the others.

## Design rules (from Doc 05)
One decision per screen, pictures over words, a speaker button on every screen, 48px+ targets, colour AND shape (tick / triangle / cross), sentences under 10 words, honest "indicative advice" disclaimer.
