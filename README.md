# SciFarm (Field Shift Africa)

**Crop-rotation guidance for African smallholder farms, built on NASA Earth data.**
NASA Space Apps Challenge 2026, challenge *Field Shift: Adapting Farms with NASA Data*. Team **Logical Prowess** (Cameroon).

A farmer opens the app, taps where the farm is, says what matters most (money, water, soil, safety) and gets
**three rotation plans** (Safest, Soil-rebuilder, Money-first) with the reasons behind them, a planting window
and a "what if the year is dry / normal / wet" view. No account, no typing needed, English and French, with voice.

| | |
|---|---|
| Where the data comes from | [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) (every dataset, version, access date, licence, and what is not used) |
| How it works | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Presentation | [docs/presentation/SciFarm_Presentation.pptx](docs/presentation/SciFarm_Presentation.pptx) |
| API the app calls | [docs/API_CONTRACT.md](docs/API_CONTRACT.md) (app side) and [backend/API.md](backend/API.md) (server side) |
| Database and pipelines | [docs/DATABASE.md](docs/DATABASE.md) |
| Deploying | [docs/DEPLOY.md](docs/DEPLOY.md) |

## What it does

1. **Your land today** (from 45 years of NASA POWER climate data): resilience zone, dry / flood / heat / erosion
   risk on a 1 to 5 scale, typical rain each month, the soil in plain words, and **when planting usually starts**.
2. **What matters to you**: up to two priorities, the last crop grown, can you water, can you buy fertiliser.
3. **Three routes**: crop sequences season by season, ranked for your priorities, with a tick / triangle / cross
   for water in each season, the reasons, the warnings, and how the plan holds up in a dry, normal or wet year.
4. **Context**: climate twins (places elsewhere in Africa with a similar climate), months to watch, NASA satellite
   layers (plants, rain) and a soil-type map, a Data Passport (where every number comes from) and a Proof page
   (how well the hazard index matched past droughts and floods, misses included).
5. **Advisor**: common farmer questions answered only from licensed FAO documents, with the page shown, and an
   offline keyword search.

Design rules for low-literacy users: one decision per screen, pictures instead of words, a speaker button on every
screen, large tap targets, colour **and** shape for every status, short sentences, and an honest "indicative advice,
ask an agronomist" notice.

## Run it

**App only (demo data, no server needed):**
```
npm install
npm run dev            # http://localhost:5173   (open /dev for a gallery of every screen, dev builds only)
```
Needs Node 20.19+ or 22.12+. The demo build shows an "Example data for the demo" label on screens that read demo data.

**App with the live API** (data from the database described in `docs/DATA_SOURCES.md`):
```
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt
backend/.venv/Scripts/python -m waitress --listen=127.0.0.1:8000 --call backend.app:create_app   # needs backend/.env (DATABASE_URL, ENGINE_MODE=real)
printf 'VITE_USE_MOCK=false\nVITE_API_URL=http://127.0.0.1:8000\n' > .env.local
npm run dev
```
Details and the Windows notes are in [backend/README.md](backend/README.md).

## Repository map

| Folder | What is in it |
|---|---|
| `src/` | The web app (React 19, Vite, Tailwind, react-router, react-i18next, Leaflet, Recharts). Screens in `src/screens/S0-S8`, `S9-S17`, `S18-S26`; API layer in `src/api/` |
| `backend/` | Flask API: reads the database, runs the rotation engine, rate limits, cache, tests (`pytest backend/tests`) |
| `pipelines/` | Python scripts that pulled and processed the data (NASA POWER, SoilGrids, FAOSTAT, FAO documents, zoning) |
| `engine/` | Rule-based rotation engine (`node engine/test.mjs` runs its tests); the deployed copy is `supabase/functions/api/engine.ts` |
| `supabase/` | The database API as a Supabase Edge Function |
| `public/mock/` | Demo data used when the app runs without the API |
| `docs/` | Documentation and the presentation |
| `Doc/` | The original product guides (specs) |

## Honest status

* **Real:** the climate (NASA POWER 1981-2025), soil (ISRIC SoilGrids), crop ranges (FAO EcoCrop), yields
  (FAOSTAT) and advisor documents (FAO) are pulled and loaded; zones, hazards, planting windows and climate twins are
  computed from them; the hazard backtest is computed on five real events.
* **Not yet:** NDVI validation (pipeline written, data not loaded), GPM IMERG and SMAP in the calculations (shown only
  as a map layer, or not at all), crop tolerances and income index (assumptions awaiting an agronomist), FAQ answers
  (draft, not yet reviewed by a person), full offline mode, field trials.
* **Never claimed:** yields, income or guaranteed results. The scores compare options; they are not forecasts.

## Team and credits

Team Logical Prowess: frontend, backend, and data / AI / database roles. Built during the event; product guides in `Doc/`.
Data providers and licences are credited in [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md). Illustrations: SVG icons drawn with
AI assistance and edited by the team. Map tiles: © OpenStreetMap contributors.
