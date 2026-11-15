# Where SciFarm's data comes from

Every number in SciFarm can be traced to a public dataset, a documented method, or a stated assumption.
This page lists them all: what is **used in the calculations**, what is **only shown on a map**, and what was
**planned but is not used yet**. The same registry is in the app (Data Passport screen) and in the database
(`passport_sources`). Facts below were read from the project database on **15 November 2026**.

NASA data is the core: the whole continent's climate profile, every hazard score, the resilience zones, the
planting windows and the climate twins are computed from **NASA POWER**. Other open datasets fill the gaps
NASA does not cover (soil, crop requirements, national yields, farming advice).

## 1. Used in the calculations (pulled, processed and stored in the database)

| What it feeds in the app | Dataset and provider | Version / access | Resolution | Period | Accessed | Licence | Pipeline |
|---|---|---|---|---|---|---|---|
| Rain: monthly totals, typical / dry / wet years (P20, P50, P80), annual rain, variability, drought index (SPI-3) | **NASA POWER**, `PRECTOTCORR` (bias-corrected precipitation), NASA Langley | POWER monthly API, community AG | 0.5° × 0.625° (MERRA-2 native), sampled at 1° cell centres | 1981-2025 | 2026-11-15 | NASA open data policy | `02_pull_power.py`, `04_features.py` |
| Temperature, heat risk (months with mean Tmax above 35 °C) | **NASA POWER**, `T2M`, `T2M_MAX`, `T2M_MIN` | POWER monthly API, community AG | as above | 1981-2025 | 2026-11-15 | NASA open data policy | as above |
| Also pulled from POWER | `ALLSKY_SFC_SW_DWN` (sunlight), `RH2M` (humidity), `GWETROOT` (root-zone soil wetness) | POWER monthly API | as above | 1981-2025 | 2026-11-15 | NASA open data policy | `02_pull_power.py` |
| Water demand of the air (ET0) and aridity (rain / ET0); planting window | **Derived**: Hargreaves reference evapotranspiration, FAO-56 | from POWER Tmax / Tmin and latitude | 1° cell | 1981-2025 climatology | 2026-11-15 | FAO method | `04_features.py` |
| Soil sentence (clay, sand, pH, organic carbon, CEC, 0-30 cm) | **ISRIC SoilGrids** (Poggio et al. 2021) | 2.0, REST API | 250 m, sampled at 1 in 9 cells and all pilot sites; other cells take the nearest sample | static map | 2026-11-15 | CC BY 4.0 | `03_pull_soil.py` |
| Crop needs (temperature, rain and pH ranges) for 20 crops; crop suitability | **FAO EcoCrop** | OpenCLIM GitHub mirror of the FAO EcoCrop database | per species | n/a | 2026-11-15 | FAO database terms | seed `06a` |
| Africa land grid and country names | **Natural Earth** admin-0 countries | 110m | 1:110 million | n/a | 2026-11-15 | public domain | `01_build_grid.py` |
| Advisor answers (with document and page) | **FAO documents**: *Save and Grow* (ch. 1, 3, 5), *Produire plus avec moins* (ch. 5), FAO fact sheet no. 1, FAO / TerrAfrica land-management guides (2 parts). 3 in English, 4 in French | 2011 editions | page-level passages (about 300 words) | 2011 | 2026-11-15 | FAO terms: non-commercial use with attribution | `05_ingest_docs.py`, `08_load_docs.py` |
| Crop yields over the years (Advisor context) | **FAOSTAT** Crops and livestock products, Africa (QCL) | bulk file | country, yearly | 1961-latest | 2026-11-15 | CC BY-NC-SA 3.0 IGO | `10_faostat.py` |

## 2. Shown on the maps in the app (visual layers, not used in the calculations)

| Layer in the app | Source | Notes |
|---|---|---|
| "See from space" > **Plants** | **NASA GIBS**, `MODIS_Terra_NDVI_8Day` (WMTS, latest image) | Vegetation greenness. A picture of the latest available period, never called a forecast |
| "See from space" > **Rain** | **NASA GIBS**, `IMERG_Precipitation_Rate` (GPM IMERG, WMTS, latest image) | Where rain is falling |
| "See from space" > **Soil** | **ISRIC SoilGrids**, WRB "most probable soil group" (WMS) | 30 soil groups, legend in the app; modelled map |
| Base map on every map screen | **OpenStreetMap** | © OpenStreetMap contributors (ODbL) |

## 3. Planned in the project guides, not used yet (said openly)

| Dataset | Status |
|---|---|
| GPM IMERG in the calculations | Not used in the calculations; shown only as the map layer above. All rain figures come from NASA POWER |
| SMAP soil moisture | Not used |
| MODIS NDVI (MOD13A3 v061 via NASA AppEEARS) for the NDVI check | Pipeline written (`11_appeears_ndvi.py`), **data not loaded** (0 rows). The Proof page says "not computed yet" |
| CHIRPS rainfall | Not used |
| Reviewer (agronomist) feedback | None recorded yet |

## 4. What the team computed from these sources

| Product | Method | Size in the database |
|---|---|---|
| Africa grid | 1° cells on land (Natural Earth) + 5 Cameroon pilot sites (Douala, Yaoundé, Dschang, Ngaoundéré, Maroua) | 2,669 cells |
| Climate normals | NASA POWER monthly 1981-2025 → per-cell monthly statistics | 32,028 monthly rows |
| Resilience zones | k-means on 10 climate features (rain, variability, seasons, dry months, aridity, temperature, hot months, drought and heavy-rain frequency, elevation), checked with silhouette and stability scores; hyper-arid cells (under 150 mm/year) form a fixed Desert zone | 9 farmland zones + Desert (version `k9+desert-20261115`) |
| Hazards 1-5 | Quintiles across Africa: drought (how often SPI-3 at the end of the rainy season is -1 or lower), flood (heavy-rain frequency), heat (hot months); erosion is a rainfall-intensity proxy only (low confidence, soil erodibility not merged yet) | per cell |
| Planting windows | First months where median rain reaches a set share of the air's water demand (ET0), from past climate | 2,759 rows |
| Climate twins | Nearest neighbours in the same feature space, at least 500 km apart and at most one per country | 9,320 pairs |
| Rotation plans | Transparent rule engine: crop suitability (EcoCrop ranges vs the cell's climate and soil), no same family back to back, a legume in the sequence, water need vs dry / normal / wet-year rain; ranked with the farmer's priorities. Every score comes with the rules that produced it | computed on request |
| Advisor library | 7 documents → 373 page-aware passages, keywords and `gte-small` embeddings (hybrid keyword + vector search); 24 farmer questions with extractive answers (status: draft) | 373 passages, 24 FAQ |

## 5. Validation: did the hazard index flag real bad years?

Method: a cell is flagged in a drought if its mean SPI-3 over the event window is at most -0.5 (floods: any month above
that place's 90th percentile). "Chance" applies the same rule to every other window of the same length in 1981-2025.

| Event (reference) | Area cells | Flagged by SciFarm | By chance | Verdict |
|---|---|---|---|---|
| 2010-11 Horn of Africa drought (NASA Earth Observatory) | 134 | **57 %** | 17 % | well above chance |
| 2015-16 southern Africa El Niño drought (UN OCHA) | 215 | **56 %** | 21 % | well above chance |
| March 2019 Cyclone Idai heavy rain (NASA Earth Observatory) | 23 | **30 %** | 11 % | above chance, but most cells missed (narrow coastal band smoothed by 1° cells) |
| 2022 Nigeria floods (UN OCHA) | 67 | **37 %** | 31 % | only slightly above chance |
| 2020-22 Horn of Africa drought, 5 failed seasons (WMO) | 134 | **3 %** | 16 % | **miss, below chance**: shown as is in the app |

The NDVI cross-check is not computed (see section 3).

## 6. Limits we state out loud

* Reanalysis rainfall can be off locally (Douala about 2,400 mm/year in POWER vs roughly 3,600 mm at the station).
* A 1° cell is about 110 km: hills and valleys inside a cell differ.
* Soil between sampled cells is approximate (nearest sample); pilot sites are exact.
* Crop ranges are generic species values, not local varieties. Tolerances, income index, cycle length and crop
  coefficients are **assumptions** waiting for an agronomist's review.
* Rotation scores compare options; they are **not** yield or income predictions. No field trial has validated them yet.
* Advisor answers come only from seven FAO documents; FAQ answers are drafts until a person reviews them; no chemical doses.
* FAO documents are reused under FAO's non-commercial terms with attribution; FAOSTAT is CC BY-NC-SA 3.0 IGO.

## 7. Privacy

No accounts and no personal data. Coordinates are rounded to 2 decimals and never stored. The only things written to the
database are anonymous thumbs (up / down) and usage counts, without identifiers. Saved farms live only on the phone.

## Credits (copy for slides, About page and submission)

NASA POWER Project (NASA Langley Research Center); NASA Global Imagery Browse Services (GIBS) / EOSDIS; MODIS Terra; GPM IMERG;
ISRIC World Soil Information, SoilGrids 2.0 (CC BY 4.0); FAO EcoCrop (via OpenCLIM); FAOSTAT (CC BY-NC-SA 3.0 IGO);
FAO publications *Save and Grow* / *Produire plus avec moins* and FAO / TerrAfrica guides (non-commercial, with attribution);
Natural Earth (public domain); © OpenStreetMap contributors (ODbL).
