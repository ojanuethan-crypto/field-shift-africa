# Team setup: how we avoid merge conflicts

Each person works ONLY inside their own screens folder:

| Owner | Folder | Screens |
|-------|--------|---------|
| A | `src/screens/S0-S8/` | S0 to S8 (core journey) |
| B | `src/screens/S9-S17/` | S9 to S17 |
| C | `src/screens/S18-S26/` | S18 to S26 |

## Shared files (set up once; after that only ADD lines)

- `src/routes.jsx`: add one `import` and one `...spread` line (placeholders are already commented in).
- `src/i18n/index.js`: add your two JSON imports (en + fr) and spread them into `en` / `fr`.
- `src/i18n/locales/{en,fr}/`: create your OWN file, e.g. `s9-s17.json`. Use your own top-level keys (`s9`, `s10`, ...). Never edit someone else's JSON.
- `src/index.css`: design tokens in `@theme`. Only add new tokens.
- `src/state/FarmContext.jsx`: shared journey state (add fields to `initial` only).
- `src/data/crops.js`: shared crop table (add crops; never rename ids).

## Shared building blocks (reuse them, don't rewrite)

`Screen` (shell with Back/Home/speaker/mute), `PrimaryButton`, `ChoiceCard`, `StatusMark` (tick / triangle / cross),
`Stars`, `FarmMap` (Leaflet; pass layers as children), `BottomNav`, `useSpeak` / `speakText` in `components/speech.js`.

## Mock vs real API

`src/api/config.js` has `USE_MOCK` (default true; set `VITE_USE_MOCK=false` in `.env` for the real backend, with `VITE_API_URL`).
Mock JSON lives in `public/mock/`. Add your own file there, don't edit others'.

## Route paths (agreed, so screens can link to each other)

| Path | Screen | Owner folder |
|------|--------|--------------|
| `/language` | S0 | S0-S8 |
| `/` | S1 Home map | S0-S8 |
| `/confirm` | S2 | S0-S8 |
| `/land` | S3 | S0-S8 |
| `/last-crop` | S4 | S0-S8 |
| `/priorities` | S5 | S0-S8 |
| `/conditions` | S6 | S0-S8 |
| `/routes` | S7 | S0-S8 |
| `/routes/:id` | S8 (S13 What-if is a tab inside) | S0-S8 |
| `/space` | S9 See from space | S9-S17 |
| `/zones` | S10 Zone legend | S9-S17 |
| `/twins` | S11 Climate Twins | S9-S17 |
| `/months` | S12 Months to watch | S9-S17 |
| `/advisor` | S14 Ask the Advisor | S9-S17 |
| `/faq` | S15 Common questions | S9-S17 |
| `/sources` | S16 Source viewer | S9-S17 |
| `/farms` | S17 My Farms | S9-S17 |
| `/share/:id` | S18 Share preview | S18-S26 |
| `/compare` | S19 Compare routes | S18-S26 |
| `/passport` | S20 Data Passport | S18-S26 |
| `/proof` | S21 Proof | S18-S26 |
| `/settings` | S22 Settings | S18-S26 |
| `/about` | S23 About + privacy | S18-S26 |
| `/help` | S24 Help | S18-S26 |
| `/feedback` | S25 Feedback | S18-S26 |

Unbuilt routes fall back to Home until their owner adds them.

> S7/S8 read the journey from `useFarm()`: `farm`, `lastCrop`, `priorities`, `canWater`, `canBuyFertilizer`, `selectedPlanId`.
