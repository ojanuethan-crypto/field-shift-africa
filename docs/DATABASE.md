# SciFarm database and API

Supabase project **SciFarm** (`ghpkqcyjhqcagbstvpoy`, eu-west-2, Postgres 17 + PostGIS + pgvector).
Base URL for the app: `https://ghpkqcyjhqcagbstvpoy.supabase.co/functions/v1/api`

Design rules (from the product spec): **no accounts, no personal data, farmers only tap pictures**. Coordinates are rounded to 2 decimals and never stored. Only anonymous counts and thumbs are written.

## API (Edge Function `api`)

| Route | Method | Frontend screen | Notes |
|---|---|---|---|
| `/profile?lat&lon` | GET | S3 land, S12 months | zone, hazards 1-5, `rain_p20/50/80`, soil sentence, `watch_months`; `{no_data:true}` outside coverage; `low_farming_potential` for desert |
| `/rotations` | POST | S7, S8, S13 | body `{lat,lon,priorities[],can_water,can_buy_fertilizer,last_crop}`; returns 3 plans (safest/soil/money) in the mock shape plus `best_for_you`; `{low_potential:true}` for desert |
| `/window?lat&lon` | GET | S8 | planting window, from past climate |
| `/twins?lat&lon` | GET | S11 | up to 5 climate twins, different countries, >= 500 km |
| `/zones` | GET | S9, S10 | GeoJSON of cell points + zone legend |
| `/proof` | GET | S21 | backtest events, hit vs chance, NDVI correlation, reviewer feedback |
| `/passport` | GET | S20 | sources, assumptions, limitations, methods, scoring config |
| `/faq?lang` | GET | S15 | reviewed Q&A (status `draft` until a person reviews) |
| `/advice-index` | GET | S14/S16 offline | all passages (per language) for the bundled keyword search |
| `/ask` | POST | S14 | `{question,lang,zone_id,plan_crops?}` -> `{answer,sources[{doc,page,licence,source_url}],mode}`; `mode` = `rag` (LLM), `search` (extractive), `none` ("I don't know") |
| `/feedback` | POST | S25, thumbs | `{target,value:1|-1,zone?,note?,lang?}` |
| `/event` | POST | analytics | `{name,zone?}`, allow-listed names, no identifiers |

Direct RPCs (anon): `get_crop_stats(iso3, crop_slug, from_year)` for FAOSTAT yield/area/production by year.

## Tables (schema `public`)

* **Geography/climate:** `zones`, `cells` (1-degree Africa grid + 5 pilots), `cell_features`, `climate_monthly`, `spi_series`, `cell_watch_months`, `planting_windows`, `climate_twins`, `pilot_satellite_monthly`, `zone_geometries`
* **Crops/engine:** `crops` (traits with a per-field `trait_sources`), `reasons` (EN/FR), `scoring_config`, `priority_weights`, `rotation_plans` + `rotation_plan_steps` (optional cache)
* **Trust:** `passport_sources`, `passport_notes`, `events`, `event_results`, `ndvi_validation`, `reviewer_feedback`
* **Advisor:** `documents`, `document_chunks` (text, keywords, `embedding vector(384)`, `tsv`), `faq_items`, `africa_stats`, `advisor_queries` (no question text), `advisor_eval`, `data_versions`
* **Anonymous telemetry:** `feedback`, `usage_events` (+ views `usage_daily`, `feedback_summary`)

Storage buckets: `faq-audio` (public), `advisor-docs` (private).

RLS: reference tables are public read-only; `feedback` and `usage_events` are anonymous insert-only (table CHECK constraints validate values); `advisor_queries` and `advisor_eval` are service-role only.

## How the data got there (all scripts in `pipelines/`, re-runnable)

1. `01_build_grid.py` Africa 1-degree grid from Natural Earth polygons + 5 Cameroon pilots
2. `02_pull_power.py` NASA POWER monthly 1981-2025 (resumable, raw JSON in `data/raw/power`)
3. `03_pull_soil.py` ISRIC SoilGrids point samples (1 cell in 9 + pilots; other cells take the nearest sample)
4. `04_features.py` normals, ET0 (Hargreaves), rain regime, SPI-3, hazard quintiles, backtest
5. `06_zones.py` k-means diagnostics; `07_build_load.py` freezes 9 farmland zones + Desert, loads cells/features/watch months/windows/twins/SPI
6. `05_ingest_docs.py` + `08_load_docs.py` PDF -> page-aware chunks -> gte-small embeddings (via the `embed` Edge Function)
7. `09_faq.py` FAQ with extractive answers; `10_faostat.py` FAOSTAT yields; `11_appeears_ndvi.py` MODIS NDVI at pilots
8. `engine/rotations.mjs` rule-based rotation engine (unit tests: `node engine/test.mjs`); the deployed copy is `supabase/functions/api/engine.ts`

Secrets live only in `.env` (gitignored): `SUPABASE_DB_URL`, `EARTHDATA_USERNAME`, `EARTHDATA_PASSWORD`. Optional Supabase secret `ANTHROPIC_API_KEY` switches `/ask` from `search` to `rag` mode.

## Honest limits (also on the Data Passport)

* Rotation scoring is transparent rules, **not** a yield prediction and not machine learning. Zoning (k-means) and twins (nearest neighbours) are the ML parts.
* Crop temperature/rainfall/pH ranges are FAO EcoCrop; tolerances, income index, Kc and cycle days are **assumptions** awaiting agronomist review.
* POWER reanalysis rainfall can be off locally (Douala about 2,400 mm vs roughly 3,600 mm at the station).
* The 2020-22 Horn of Africa drought is a backtest miss (below chance); it is shown on the Proof page.
* FAO documents are reused under FAO's website terms (non-commercial, attribution). Confirm before any commercial use.
