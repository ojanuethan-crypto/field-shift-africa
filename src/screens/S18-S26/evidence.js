// Evidence shown by S20 (Data Passport) and S21 (Proof) in DEMO mode (no API).
// With the real API both screens read the database instead (GET /api/passport, GET /api/proof).
// These demo values are copied from that database (tables passport_sources and event_results, read 2026-11-15)
// so the demo build tells the same story as the live app. Keep the "sample data" badge visible.
export const PASSPORT_ROWS = [
  {
    id: 'rain',
    dataset: 'NASA POWER, PRECTOTCORR',
    version: 'Monthly API, AG community',
    resolution: '0.5° × 0.625°, sampled at 1° cells',
    period: '1981–2025',
    accessed: '2026-11-15',
  },
  {
    id: 'temp',
    dataset: 'NASA POWER, T2M / T2M_MAX / T2M_MIN',
    version: 'Monthly API, AG community',
    resolution: '0.5° × 0.625°, sampled at 1° cells',
    period: '1981–2025',
    accessed: '2026-11-15',
  },
  {
    id: 'soil',
    dataset: 'ISRIC SoilGrids',
    version: '2.0 (REST API)',
    resolution: '250 m, sampled at 1 in 9 cells + pilots',
    period: 'Static map (0–30 cm)',
    accessed: '2026-11-15',
  },
  {
    id: 'window',
    dataset: 'Derived from NASA POWER',
    version: 'Rain vs Hargreaves ET0 (FAO-56)',
    resolution: '1° cell',
    period: '1981–2025 climatology',
    accessed: '2026-11-15',
  },
  {
    id: 'veg',
    dataset: 'MODIS NDVI (MOD13A3 v061, via AppEEARS)',
    version: 'Planned',
    resolution: '1 km, monthly',
    period: 'Not loaded yet',
    accessed: '—',
  },
]

// Real backtest (hazard index vs known events). hit / chance in %, misses = places not flagged, of = places in the event area.
export const PROOF_EVENTS = [
  { id: 'drought1011', years: '2010–11', hit: 57, chance: 17, misses: 57, of: 134 },
  { id: 'drought1516', years: '2015–16', hit: 56, chance: 21, misses: 94, of: 215 },
  { id: 'flood2019', years: '2019 (Cyclone Idai)', hit: 30, chance: 11, misses: 16, of: 23 },
  { id: 'drought2022', years: '2020–22', hit: 3, chance: 16, misses: 130, of: 134 },
  { id: 'flood2022', years: '2022', hit: 37, chance: 31, misses: 42, of: 67 },
]

// NDVI check: not computed yet (no NDVI series loaded). Empty = the screen says so instead of drawing a curve.
export const NDVI_SERIES = []
