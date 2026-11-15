# Frontend <-> backend contract (what the app calls today)

For the backend and database teammates. This is what the app actually sends and reads, checked against a
fake backend that answers in exactly these shapes. If guide 03 says something different, tell the frontend
owner: only `src/api/adapters.js` (and this file) change, not the screens.

## Connect the app to your backend
1. Create `.env` in the project root:
   ```
   VITE_USE_MOCK=false
   VITE_API_URL=http://localhost:8000
   ```
2. Restart `npm run dev`. With `VITE_USE_MOCK=false` the app calls your API and hides the "example data" labels.
3. **CORS**: allow the frontend origin and answer the `OPTIONS` preflight (the app POSTs JSON with
   `Content-Type: application/json`). No cookies, no auth headers.
4. A non-2xx answer or a network error shows a friendly "try again" screen. Slow answers: keep each under about 2 s.

## Rules for every endpoint
- `lat`, `lon` arrive already rounded to 2 decimals. `lang` is `en` or `fr`.
- User-facing text: send it in the requested `lang` as a plain string. (A few older endpoints below use `{ "en": "...", "fr": "..." }`;
  the screens accept the object form there too.)
- Sentences short (about 10 words or fewer), plain words, no jargon, no units without a picture.
- Crop ids must be exactly: `maize groundnut cassava plantain cocoyam cowpea soybean millet sorghum rice tomato beans`.
  Another crop needs a new icon first: tell the frontend owner.
- Priority ids the app sends: `money water soil safety` (1 or 2 items). **The backend turns them into weights**
  (two chosen -> 0.4 each, others 0.1; one chosen -> 0.55, others 0.15; Roadmap section 6).
- Zone ids are `1..7` (1 Sahel, 2 Sudano-Guinean savanna, 3 humid forest, 4 highlands, 5 southern woodland,
  6 arid margins, 7 floodplains). The app has a picture for each.

## 1. `GET /api/profile?lat=4.05&lon=9.70&lang=en`   (screens S3 and S12)
```json
{
  "zone":    { "id": 3, "name": "Wet forest land", "description": "Very wet. Acid soil." },
  "hazards": { "drought": 1, "flood": 5, "heat": 2, "erosion": 4 },
  "climate": { "rain_p50": [30,50,140,200,280,430,590,680,540,340,110,40] },
  "soil":    { "summary": "Acid soil. Rain washes nutrients away." },
  "watch_months": { "dry": [12,1,2], "flood": [7,8,9], "heat": [2,3] },
  "data_quality": "ok"
}
```
- `hazards`: whole numbers 1 (low) to 5 (high). `rain_p50`: 12 monthly values in mm, January first.
- `watch_months`: month numbers 1-12 of the typical dry spell, flood and heat months (from past climate, not a forecast).
- For places we cannot advise on, send only `{ "data_quality": "ocean" | "desert" | "no_data" | "outside" }`.
  The app shows a friendly spoken screen for each.

## 2. `POST /api/rotations`   (screens S7, S8, S18, S19)  -- the core of the product
Request (the app sends exactly this):
```json
{ "lat": 4.05, "lon": 9.70, "lang": "en",
  "priorities": ["money", "soil"],
  "last_crop": "maize",
  "constraints": { "irrigation": false, "fertilizer": true } }
```
- `last_crop` is `null` when unknown. `constraints.*` are `true`, `false` or `null` (not answered).
Response: **exactly 3 plans**, one of each kind:
```json
{ "plans": [ {
  "id": "p1",
  "kind": "soil",
  "score": 78,
  "sequence": [
    { "season": 1, "crop": "maize",     "plant_month": 3, "water": { "dry": "risky", "normal": "enough", "wet": "enough" } },
    { "season": 2, "crop": "groundnut", "plant_month": 9, "water": { "dry": "risky", "normal": "enough", "wet": "risky"  } }
  ],
  "subscores": { "income": 0.60, "water": 0.70, "soil": 0.92, "resilience": 0.65 },
  "scenarios": { "dry": 0.65, "normal": 0.82, "wet": 0.70 },
  "reasons":  ["Groundnut after maize adds nitrogen.", "Planting avoids the flood months."],
  "warnings": ["Maize can rot if the field floods in season 1."]
} ] }
```
| Field | Required? | What the app does with it |
|---|---|---|
| `id`, `sequence[].crop`, `season` | yes | the route and its crop pictures |
| `score` (0-100) | yes | **ranks the plans** (the app shows stars). Must already reflect priorities, `last_crop` and constraints |
| `subscores`, `scenarios` (0-1) | yes | the "what if the weather changes" tab (dry / normal / wet year) |
| `reasons[0]` | yes | the one-line reason on the route card; all reasons appear under "Why" |
| `warnings` | yes (can be `[]`) | the "Be careful" list |
| `kind` = `safest` / `soil` / `money` | **please send** | plan name. If missing the app guesses it from the strongest sub-score |
| `sequence[].plant_month` (1-12) | **please send** | "Plant maize in March". If missing the app says "in season 1" |
| `sequence[].water` per scenario: `enough` / `risky` / `not_enough` | **please send** | the water meter and tick / triangle / cross. If missing the app derives it from `scenarios` |

## 3. `GET /api/zones`   (S10 map)
GeoJSON `FeatureCollection` of `Point`s, one per grid cell: `properties: { "zone_id": 1..7 }`,
coordinates `[lon, lat]`. Keep it under 600 KB (about 1 degree grid).

## 4. `GET /api/twins?lat=&lon=&lang=`   (S11)
```json
{ "origin": { "name": "Douala", "lat": 4.05, "lon": 9.70, "zone_id": 3 },
  "twins": [ { "name": "Kisangani region", "country": "DR Congo", "lat": 0.52, "lon": 25.19,
               "similarity": 0.91, "crops": ["cassava", "plantain", "rice"],
               "reason": { "en": "Very wet all year, with acid soils like yours.", "fr": "..." } } ] }
```
3 to 5 twins. `reason` is `{en, fr}` here (the screen reads both).

## 5. Advisor
- `GET /api/faq?lang=en` -> `{ "items": [ { "id": "f1", "emoji": "...", "passage": "p2", "q": { "en": "...", "fr": "..." } } ] }`
  (20 to 30 reviewed questions; `passage` points to the answer in the advice index).
- `GET /api/advice-index` -> `{ "version": "...", "passages": [ { "id": "p1", "doc": "FAO ...", "page": 12,
  "licence": "CC BY-NC-SA 3.0 IGO", "text": { "en": "...", "fr": "..." }, "keywords": { "en": ["..."], "fr": ["..."] } } ] }`
  This file is also the offline search library (keep it to a few MB). Every passage needs `doc`, `page` and `licence`.
- `POST /api/ask` `{ "question": "...", "lang": "fr", "zone_id": null }` -> `{ "answer": "...", "sources": [ { "doc": "...", "page": 12 } ], "mode": "online" }`.
  The app waits 8 s, then falls back to offline search. Answer only from the sources; no chemical doses.
  (`zone_id` is always `null` for now; derive the zone from the farm if you need it.)
- `POST /api/feedback` `{ "target": "advisor", "value": "up" | "down" }` -> any 2xx. Anonymous counts only.

## 6. Needed next (screens exist or are planned, endpoint shape is a proposal)
- **Planting window (F10, a MUST)**: `GET /api/window?lat=&lon=&lang=` -> `{ "start_month": 4, "end_month": 5, "text": "Planting usually starts in April-May." }`.
  Method: first months where median rainfall reaches a set share of evaporative demand. Never call it a forecast.
  The UI for this is not built yet.
- **Proof (S21)** and **Data Passport (S20)** currently show static placeholder numbers (`src/screens/S18-S26/evidence.js`).
  Real numbers: `GET /api/proof` (events, hit rates, baseline) and the per-number source list.
- **Anonymous counts**: `POST /api/event` `{ "name": "plan_viewed", "zone": 3 }`, no identifiers.

## Quick test without the frontend
```
curl "http://localhost:8000/api/profile?lat=4.05&lon=9.70&lang=en"
curl -X POST http://localhost:8000/api/rotations -H "Content-Type: application/json" \
  -d '{"lat":4.05,"lon":9.70,"lang":"en","priorities":["soil","water"],"last_crop":"maize","constraints":{"irrigation":false,"fertilizer":true}}'
```
Mock answers in the same shapes: `public/mock/*.json`.
