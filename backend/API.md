# Field Navigator API (Flask)

Base path `/api`. JSON in, JSON out. Shapes are enforced by `app/schemas.py` (every response is validated before it is sent).
Errors always look like `{ "error": "code", "message": "human text" }`.
In mock mode every answer carries the header `X-Data-Source: mock`, and object answers carry `"_mock": true`.
Cached answers carry `X-Cache: hit|miss`. Coordinates are rounded to 2 decimals.

| Method + path | Input | Output | Notes |
|---|---|---|---|
| GET `/health` | none | `{status, version, db, mode}` | `db`: `mock`, `not_configured`, `schema_pending` |
| GET `/zones` | `bbox=minLon,minLat,maxLon,maxLat` (optional) | GeoJSON points `{zone_id}` + `zones[{id,color,name}]` | S10. Hand-placed draft points. |
| GET `/profile` | `lat`, `lon`, `lang` | `{zone, description, hazards, rain_p50[12], soil, watch_months, data_quality}` | S3, S12. Outside the covered area: `200 {outside:true, message}`. `watch_months` is `null` when unknown. |
| POST `/rotations` | `{lat, lon, priorities?[max 2 of money/water/soil/safety], lastCrop?, canWater?, canBuyFertilizer?}`, or the guide form: `goals{income,water,soil,resilience}` (each 0-1, normalised to sum 1; replace the priority weights) and `constraints{irrigation,fertilizer,short_season}` (irrigation=canWater, fertilizer=canBuyFertilizer, short_season accepted with no effect; unspecified = unknown, not false). Explicit `canWater`/`canBuyFertilizer` win over `constraints`. | **bare array** of plans `{id, kind, sequence, sub, scen, reason, why, warnings, score, statuses, breakdown, scenarios}` | S7, S8. Array (not `{plans}`) because the frontend maps over it. No plans for the place (desert, no data cell, no suitable crop): `200 {low_potential:true, state:"desert"|"no_data", plans:[]}` (the app shows its friendly screen). `breakdown` shows weights, per-criterion contributions and every adjustment. |
| GET `/twins` | `lat`, `lon`, `n` (1-10, default 5) | `{origin, twins[{name,country,lat,lon,similarity,crops,reason}], note}` | S11. Empty list (with a note) when there is no data for the zone. |
| GET `/window` | `lat`, `lon` | `{start_month, end_month, text{en,fr}, method}` | Past climate, never a forecast. Mock method is stated in `method`. |
| GET `/crops` | `zone_id` (optional) | `{zone_id, crops[{id,name,emoji,legume,family,season_length}]}` | `family`/`season_length` are `null` = unknown. |
| GET `/passport` | `lang` (`lat`,`lon` optional: the Passport is about the data, not one place) | `{rows, limits, validation}` | S20. Values are `null` until data is pulled. |
| GET `/proof` | none | `{events, ndvi_correlation, notes}` | S21. Hit rates are `null`: no backtest has been run. |
| GET `/faq` | `lang` (en/fr, default en) | `{items[{id,emoji,passage,q{en,fr},status?}]}` | S15. `passage` = id of the answer passage in `lang`. Real mode: questions with no passage in `lang` are left out; `status` is `draft` until a person reviews it. |
| GET `/advice-index` | `lang` (optional) | `{version, passages[{id,doc,page,licence,text{...},keywords{...},lang?,source_url?}]}` | S14-S16. Mock: sample passages with `text{en,fr}`. Real: one language per passage (`text` has one key); pass `lang` to get only that language. |
| POST `/ask` | `{question, lang?, zone_id?}` | `{answer, sources[{id?,doc,page}], mode}` | `sources[]` also carry `licence` and `source_url` for real documents. `mode`: `llm` (model answer built only from the matched passages), `search` (best passage or its best sentences, offline), `none` (answer null), `rag` (when Ojani's RAG is plugged in). |
| POST `/explain` | `{plan, lang}` (a plan exactly as `/rotations` returned it) or `{plan_id, lat, lon, lang, ...rotations inputs}` | `{text, source}` | S8. `source`: `llm` (model words the plan's own facts, cached by plan + language) or `template` (fixed wording; used with no model or when the model fails or breaks a guardrail). Both end by telling the farmer to ask a local agronomist. 404 `no_data` if `plan_id` is not among this place's plans. |
| POST `/feedback` | `{target, value: up\|down, zone?, lang?}` | `{ok:true}` | Count only. Real mode: stored in the database (`feedback`); targets `plan, answer (also advisor-answer), app, proof, passport` are stored, others are only counted in memory. Never fails the app. |
| POST `/event` | `{name, zone?}` | `{ok:true}` | Count only. Real mode: stored in `usage_events` for the names the database allows (`visit, farm_picked, plan_viewed, plan_shared, advisor_asked, passport_opened, proof_opened, offline_downloaded`). |
| GET `/stats` | none | `{feedback, events, storage}` | Real mode: counted from the database (`storage: "database"`). Mock mode, or database down: in memory (resets on restart). |

Differences from the guide, on purpose: `/rotations` answers a bare array (not `{plans}`) because the screens map over it; `/profile` has `rain_p50` only (p20/p80 and temperature are not in the data yet); `/zones` entries have no `description` and twins no `zone_id` until the data has them (both fields are optional in the schema); outside the covered area `/profile` answers `200 {outside:true}` (what S3 expects) while `/rotations`, `/twins` and `/window` answer 422.

Status codes: 200 ok, 404 `no_data`, 405 wrong method, 422 `invalid_request` / `outside_coverage`, 429 rate limited,
500 `internal` (details only in the server log), 501 `schema_pending` (kept for future gaps; nothing returns it now),
503 `database_not_configured` / `database_unavailable` (real mode).

Real mode extras (absent in mock mode): `/profile` also has `rain_p20`, `rain_p80`, `low_farming_potential` and `zone.color`; `/proof` events also have
`kind`, `years`, `cells_total`, `misses_note` (misses are shown) and `reference`; zone ids run 1-10 (10 = Desert). `/passport` rows come from the
dataset registry (`value` stays null). Climate twins below 0.4 similarity are not shown.

Model (optional): set `ANTHROPIC_API_KEY` to let `/ask` and `/explain` use a model (`services/llm.py`: timeout, daily cap, no key = offline). The model only sees matched passages / the plan's own facts, and any answer that states a dose (e.g. "2 kg/ha") is rejected in favour of the offline answer. `app.extensions["rag"]` remains the hook for Ojani's RAG, which answers `/ask` first when plugged in.
