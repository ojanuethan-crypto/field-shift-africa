// PLACEHOLDER evidence for S20 (Data Passport) and S21 (Proof).
// Dataset names/resolutions are the real products we plan to use; every VALUE (hit rates, NDVI, dates)
// is a made-up placeholder until the AI/data teammates provide the real backtest and access dates.
// Keep the "sample data" badge visible while this file is used.
export const PASSPORT_ROWS = [
  {
    id: 'rain',
    dataset: 'CHIRPS',
    version: 'v2.0',
    resolution: '0.05° (~5 km)',
    period: '1991–2020',
    accessed: '2026-11-13',
  },
  {
    id: 'temp',
    dataset: 'NASA POWER',
    version: 'v9',
    resolution: '0.5° (~50 km)',
    period: '1991–2020',
    accessed: '2026-11-13',
  },
  {
    id: 'soil',
    dataset: 'SoilGrids',
    version: '2.0',
    resolution: '250 m',
    period: 'Static map',
    accessed: '2026-11-13',
  },
  {
    id: 'window',
    dataset: 'CHIRPS + NASA POWER',
    version: 'v2.0 / v9',
    resolution: '0.05° to 0.5°',
    period: '1991–2020',
    accessed: '2026-11-13',
  },
  {
    id: 'veg',
    dataset: 'MODIS NDVI (MOD13Q1)',
    version: 'v061',
    resolution: '250 m, 16 days',
    period: '2001–2025',
    accessed: '2026-11-13',
  },
]

export const PROOF_EVENTS = [
  { id: 'drought1516', years: '2015–16', hit: 78, chance: 50, misses: 3, of: 14 },
  { id: 'flood2019', years: '2019', hit: 71, chance: 50, misses: 4, of: 14 },
  { id: 'drought2022', years: '2021–22', hit: 64, chance: 50, misses: 5, of: 14 },
]

// Monthly hazard index vs NDVI anomaly (both 0-100, placeholder shape).
export const NDVI_SERIES = [
  ['J', 22, 70], ['F', 25, 66], ['M', 40, 55], ['A', 58, 42], ['M', 66, 36], ['J', 72, 31],
  ['J', 60, 40], ['A', 48, 50], ['S', 36, 60], ['O', 30, 66], ['N', 24, 70], ['D', 20, 72],
].map(([m, hazard, ndvi]) => ({ m, hazard, ndvi }))
