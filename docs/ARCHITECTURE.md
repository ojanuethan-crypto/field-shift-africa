# How SciFarm works

## The system

```
 Farmer's phone (browser)                         Team's servers                         Public data
 ------------------------                         --------------                         -----------
 SciFarm web app (React)          JSON            Flask API (backend/)                    NASA POWER 1981-2025
  - map, picture cards, voice  <------------>     - /api/profile, /rotations, /window,    ISRIC SoilGrids 2.0
  - EN / FR, no login                              /twins, /zones, /passport, /proof,     FAO EcoCrop
  - demo data when offline                         /faq, /advice-index, /ask, /feedback   FAOSTAT
    or no API (public/mock)                       - rule-based rotation engine            FAO documents
                                                  - cache, rate limits                    Natural Earth
                                                         |                                      |
                                                         v                                      | pipelines/ (Python)
                                                  Supabase Postgres (+ PostGIS, pgvector) <-----+  pulled once,
                                                  cells, zones, climate, soils, crops,             processed, loaded
                                                  windows, twins, backtest, documents

 Map layers are loaded straight from the providers by the browser: NASA GIBS (MODIS NDVI, IMERG), ISRIC SoilGrids WMS, OpenStreetMap.
```

* **The live demo never depends on a live NASA call.** NASA POWER and the other datasets were pulled ahead of time by the
  pipelines and stored in the database; the API reads the database. Only the decorative map layers load live, and the
  app keeps working if they fail.
* The same API also exists as a Supabase Edge Function (`supabase/functions/api`); the deployed engine copy is
  `supabase/functions/api/engine.ts`.

## The method, step by step

1. **Grid the continent**: 1° land cells from Natural Earth (2,669 cells, including 5 Cameroon pilot sites).
2. **Describe each cell** from NASA POWER 1981-2025: monthly rain (typical, dry and wet years), temperature, number of
   rainy seasons, dry months, aridity (rain / Hargreaves ET0), hot months, drought frequency (SPI-3), heavy-rain frequency.
   Soil from SoilGrids (clay, sand, pH, organic carbon, CEC, 0-30 cm).
3. **Group cells into Resilience Zones** with k-means (9 farmland zones + a fixed Desert zone), checked with silhouette and
   stability scores, then named by looking at what each zone contains.
4. **Score hazards** 1 to 5 (drought, flood, heat, erosion) as quintiles across Africa. Erosion is a rainfall-intensity proxy
   only (low confidence) until soil erodibility is added.
5. **Crop suitability**: each crop's FAO EcoCrop temperature, rain and pH ranges against the cell's climate and soil.
6. **Build rotations** of several seasons from suitable crops with agronomic rules (no same family back to back, include
   a legume, respect season length) and score them on income index, water fit (crop water need vs dry / normal / wet-year
   rain; dry = P20, normal = P50, wet = P80, effective rain = 80 %), soil health (legumes, diversity, cover) and resilience
   (tolerance to the zone's main hazards). Flood-intolerant crops are excluded in flood-prone cells.
7. **Rank for this farmer**: the farmer's one or two priorities become weights (two chosen: 0.4 each, others 0.1; one
   chosen: 0.55, others 0.15); last crop, watering and fertiliser change the scores. Three plans come back: Safest,
   Soil-rebuilder, Money-first.
8. **Explain**: every score carries the rules that produced it, in English and French. An optional language model only
   rewords Advisor answers from the retrieved passages; it never invents numbers (without a key, answers are extracted
   passages).
9. **Planting window and twins**: first months where median rain covers enough of the air's water demand; nearest
   neighbours in the zone feature space in other countries.
10. **Validate**: backtest the hazard index on five documented events (results and misses in `docs/DATA_SOURCES.md`).

## The app

| Screen group | Screens |
|---|---|
| Start | Logo splash, voice on / off and choice of voice, language |
| Journey (S0-S8) | Home map, confirm farm, your land today (zone, hazards, rain, soil, planting window), last crop, what matters most, two quick questions, three routes, route detail (steps, water, what if, why) |
| Context (S9-S17) | See from space (plants, rain, soil), zone map, climate twins, months to watch, Advisor, common questions, source viewer, my farms |
| Trust and tools (S18-S26) | Share as a picture (WhatsApp), compare routes, Data Passport, Proof, settings, about and privacy, help, feedback, friendly state screens (offline, error, desert, ocean, outside Africa, no data) |

Built with React 19, Vite, Tailwind, react-router, react-i18next (English / French), Leaflet, Recharts, lucide icons and a
custom SVG illustration set. Voice uses the phone's text-to-speech. All farmer-facing text is in `src/i18n/locales`.

## Privacy by design

No sign-in, no personal data. Coordinates are rounded to 2 decimals before they leave the phone and are never stored.
Saved farms stay on the phone. The server only stores anonymous thumbs and usage counts.
