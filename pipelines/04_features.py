"""Stage A: climate normals, ET0, rain regime, SPI-3, hazard indices, backtest. Pure numpy/scipy.

Inputs : data/raw/power/*.json (NASA POWER monthly, 1981-2025), data/raw/soil/*.json (SoilGrids samples)
Outputs: data/features.csv, data/climate_monthly.csv, data/spi_selected.csv, data/event_results.json
Units  : POWER PRECTOTCORR is mm/day -> multiplied by days in month = mm/month.
"""
import json, pathlib, calendar, math
import numpy as np, pandas as pd
from scipy import stats
from scipy.signal import find_peaks

ROOT = pathlib.Path(__file__).resolve().parents[1]
Y0, Y1 = 1981, 2025
NY = Y1 - Y0 + 1
DAYS = np.array([[calendar.monthrange(y, m)[1] for m in range(1, 13)] for y in range(Y0, Y1 + 1)], float)


def load_cell(f):
    j = json.loads(f.read_text())
    p = j["p"]
    def arr(name):
        a = np.full((NY, 12), np.nan)
        for k, v in p[name].items():
            y, m = int(k[:4]), int(k[4:])
            if m <= 12 and Y0 <= y <= Y1 and v != -999:
                a[y - Y0, m - 1] = v
        return a
    return j["lat"], j["lon"], j.get("elev"), {n: arr(n) for n in p}


def hargreaves_et0(lat, tmean, tmax, tmin):
    """Monthly ET0 (mm/month) climatology, FAO-56 Hargreaves. tmean/tmax/tmin: 12 values (C)."""
    phi = math.radians(lat)
    mid = np.array([15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349])
    dr = 1 + 0.033 * np.cos(2 * np.pi * mid / 365)
    dec = 0.409 * np.sin(2 * np.pi * mid / 365 - 1.39)
    ws = np.arccos(np.clip(-np.tan(phi) * np.tan(dec), -1, 1))
    ra = (24 * 60 / np.pi) * 0.0820 * dr * (ws * np.sin(phi) * np.sin(dec) + np.cos(phi) * np.cos(dec) * np.sin(ws))
    et0 = 0.0023 * (tmean + 17.8) * np.sqrt(np.clip(tmax - tmin, 0, None)) * 0.408 * ra
    return np.clip(et0, 0, None) * np.array([calendar.monthrange(2001, m)[1] for m in range(1, 13)])


def n_seasons(clim):
    x = np.asarray(clim, float)
    if x.max() < 20:
        return 0
    ext = np.concatenate([x[-3:], x, x[:3]])
    sm = np.convolve(ext, np.ones(3) / 3, mode="same")[3:-3]
    peaks, _ = find_peaks(np.concatenate([sm, sm]), prominence=0.25 * sm.max(), distance=3)
    return min(len({p % 12 for p in peaks}), 2)


def spi3(rain):
    """rain: (NY,12) mm/month -> SPI-3 (NY,12), gamma per calendar month (WMO method)."""
    flat = rain.reshape(-1)
    roll = np.full_like(flat, np.nan)
    roll[2:] = flat[2:] + flat[1:-1] + flat[:-2]
    roll = roll.reshape(NY, 12)
    out = np.full_like(roll, np.nan)
    for m in range(12):
        x = roll[:, m]
        ok = ~np.isnan(x)
        pos = x[ok & (x > 0)]
        if len(pos) < 10:
            continue
        q = 1 - len(pos) / ok.sum()
        a, loc, b = stats.gamma.fit(pos, floc=0)
        cdf = q + (1 - q) * stats.gamma.cdf(np.where(ok, x, 0), a, loc=loc, scale=b)
        out[:, m] = np.where(ok, stats.norm.ppf(np.clip(cdf, 1e-4, 1 - 1e-4)), np.nan)
    return out


def process(f):
    lat, lon, elev, d = load_cell(f)
    rain = d["PRECTOTCORR"] * DAYS                      # mm/month
    tm, tx, tn = d["T2M"], d["T2M_MAX"], d["T2M_MIN"]
    with np.errstate(all="ignore"):
        p20, p50, p80 = (np.nanpercentile(rain, q, axis=0) for q in (20, 50, 80))
        tmean_c, tmax_c, tmin_c = (np.nanmean(a, axis=0) for a in (tm, tx, tn))
        solar_c, rh_c = np.nanmean(d["ALLSKY_SFC_SW_DWN"], axis=0), np.nanmean(d["RH2M"], axis=0)
        annual = np.nansum(rain, axis=1)
    et0 = hargreaves_et0(lat, tmean_c, tmax_c, tmin_c)
    rain_annual = float(np.nanmean(annual))
    mean_clim = np.nanmean(rain, axis=0)
    sp = spi3(rain)
    # drought_freq: share of years whose SPI-3 at the end of the main rainy season (peak 3-month window) <= -1
    roll_c = np.convolve(np.concatenate([mean_clim[-2:], mean_clim]), np.ones(3), mode="valid")
    end_m = int(np.argmax(roll_c))                      # month index where the 3-month rain peaks
    s_end = sp[:, end_m]
    drought_freq = float(np.nanmean(s_end <= -1))
    heavy_thr = np.maximum(np.nanpercentile(rain, 95, axis=0), 250.0)
    heavy_freq = float(np.nanmean(rain > heavy_thr))
    feat = dict(lat=lat, lon=lon, elev=elev, rain_annual=rain_annual,
                rain_cv=float(np.nanstd(annual) / max(rain_annual, 1e-6)),
                n_seasons=n_seasons(mean_clim), dry_months=int((p50 < 50).sum()),
                aridity=rain_annual / max(float(et0.sum()), 1.0), tmean=float(np.nanmean(tmean_c)),
                hot_months=float((tmax_c > 35).sum()), heat_idx=float(np.sort(tmax_c)[-3:].mean()),
                drought_freq=drought_freq, heavy_freq=heavy_freq,
                peak_rain_month_mm=float(np.nanmax(p50)))
    clim = pd.DataFrame(dict(lat=lat, lon=lon, month=range(1, 13), rain_p20=p20, rain_p50=p50, rain_p80=p80,
                             tmean=tmean_c, tmax=tmax_c, tmin=tmin_c, et0=et0, solar=solar_c, rh=rh_c))
    return feat, clim, rain, sp


EVENTS = [  # slug, name, kind, lat0, lat1, lon0, lon1, start_ym, end_ym
    ("horn_2010_11", "2010-11 Horn of Africa drought", "drought", -2, 12, 38, 51, 201010, 201112),
    ("southern_2015_16", "2015-16 southern Africa El Nino drought", "drought", -28, -12, 22, 36, 201511, 201604),
    ("idai_2019", "March 2019 Cyclone Idai heavy rain", "flood", -21, -15, 32, 36, 201903, 201903),
    ("horn_2020_22", "2020-22 Horn of Africa multi-season drought", "drought", -2, 12, 38, 51, 202010, 202212),
    ("nigeria_2022", "2022 Nigeria floods", "flood", 7, 13, 3, 14, 202207, 202210),
]


def main():
    files = sorted((ROOT / "data/raw/power").glob("*.json"))
    feats, clims, spi_rows, rain_store = [], [], [], {}
    for i, f in enumerate(files):
        feat, clim, rain, sp = process(f)
        feats.append(feat); clims.append(clim); rain_store[(feat["lat"], feat["lon"])] = (rain, sp)
        if i % 300 == 0:
            print(i, "/", len(files), flush=True)
    F = pd.DataFrame(feats)
    C = pd.concat(clims, ignore_index=True)

    # Hazard levels 1-5 = quintiles relative to the African grid (documented assumption)
    def quint(s):
        r = s.rank(pct=True, method="average")
        return np.ceil(r * 5).clip(1, 5).astype(int)
    F["hz_drought"] = quint(F.drought_freq * 0.5 + (1 - F.rain_annual.rank(pct=True)) * 0.5)
    F["hz_flood"] = quint(F.heavy_freq * 0.6 + F.peak_rain_month_mm.rank(pct=True) * 0.4)
    F["hz_heat"] = quint(F.heat_idx)
    # Erosion (low confidence): rainfall intensity proxy only until soil erodibility is merged in stage B
    F["erosion_idx"] = F.peak_rain_month_mm.rank(pct=True)
    F["hz_erosion"] = quint(F.erosion_idx)

    # Selected SPI series (pilots + event boxes) for the Proof page
    pil = set((r["lat"], r["lon"]) for r in json.loads((ROOT / "data/grid.json").read_text()) if r["is_pilot"])
    keep = set(pil)
    for _, _, _, la0, la1, lo0, lo1, _, _ in EVENTS:
        keep |= {(r.lat, r.lon) for r in F.itertuples() if la0 <= r.lat <= la1 and lo0 <= r.lon <= lo1}
    for (la, lo) in keep:
        rain, sp = rain_store[(la, lo)]
        for yi in range(NY):
            for mi in range(12):
                ym = (Y0 + yi) * 100 + mi + 1
                if (la, lo) in pil or ym >= 200901:
                    if not np.isnan(sp[yi, mi]):
                        spi_rows.append((la, lo, ym, round(float(sp[yi, mi]), 3), round(float(rain[yi, mi]), 1)))
    S = pd.DataFrame(spi_rows, columns=["lat", "lon", "ym", "spi3", "rain_mm"])

    # Backtest. Drought: cell flagged if min SPI-3 in window <= -1. Flood: any month rain > local P90 of that calendar month.
    # Chance rate = same rule applied to every other window of the same length in the record (empirical, per region).
    results = []
    for slug, name, kind, la0, la1, lo0, lo1, s_ym, e_ym in EVENTS:
        cells = [(r.lat, r.lon) for r in F.itertuples() if la0 <= r.lat <= la1 and lo0 <= r.lon <= lo1]
        s_idx = (s_ym // 100 - Y0) * 12 + s_ym % 100 - 1
        e_idx = (e_ym // 100 - Y0) * 12 + e_ym % 100 - 1
        L = e_idx - s_idx + 1
        flagged, chance_hits, chance_n = 0, 0, 0
        for c in cells:
            rain, sp = rain_store[c]
            flat_sp, flat_r = sp.reshape(-1), rain.reshape(-1)
            if kind == "drought":
                # Sustained dryness: mean SPI-3 over the window <= -0.5. (First version used min SPI-3 <= -1; it
                # saturated on long windows, chance rate 66-84%, so it could not discriminate. Changed before reading results.)
                hit = lambda a: np.nanmean(flat_sp[a:a + L]) <= -0.5 if not np.all(np.isnan(flat_sp[a:a + L])) else False
            else:
                p90 = np.nanpercentile(rain, 90, axis=0)
                hit = lambda a: any(flat_r[a + k] > p90[(a + k) % 12] for k in range(L))
            flagged += bool(hit(s_idx))
            for a in range(2, NY * 12 - L, 1):
                if abs(a - s_idx) >= L:
                    chance_hits += bool(hit(a)); chance_n += 1
        results.append(dict(slug=slug, name=name, kind=kind, cells_total=len(cells), cells_flagged=int(flagged),
                            hit_rate=flagged / max(len(cells), 1), chance_rate=chance_hits / max(chance_n, 1)))
        print(results[-1], flush=True)

    F.to_csv(ROOT / "data/features.csv", index=False)
    C.to_csv(ROOT / "data/climate_monthly.csv", index=False)
    S.to_csv(ROOT / "data/spi_selected.csv", index=False)
    (ROOT / "data/event_results.json").write_text(json.dumps(results, indent=1))
    print("features", F.shape, "monthly", C.shape, "spi", S.shape)


if __name__ == "__main__":
    main()
