"""Stage B2: freeze zones, build cells/features/climate/watch months/planting windows/twins/SPI and load into Supabase.
Idempotent: re-run when soil sampling finishes (soil is attached by nearest sample). Needs SUPABASE_DB_URL in .env.
"""
import json, math, pathlib, io
import numpy as np, pandas as pd, psycopg
from scipy.spatial import cKDTree
from sklearn.cluster import KMeans
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL = [l.split("=", 1)[1].strip() for l in (ROOT / ".env").read_text().splitlines() if l.startswith("SUPABASE_DB_URL=")][0]
MONTHS_EN = "January February March April May June July August September October November December".split()
MONTHS_FR = "janvier février mars avril mai juin juillet août septembre octobre novembre décembre".split()

# ---------------------------------------------------------------- zones (frozen: k=9 on farmland + Desert)
RAW2ID = {2: 1, 6: 2, 1: 3, 5: 4, 3: 5, 4: 6, 8: 7, 0: 8, 7: 9}
ZONES = [  # id, slug, en, fr, desc_en, desc_fr, icon, color, regime
 (1, "sahel", "Dry Sahel land", "Terres sèches du Sahel", "Short rains. Long dry season. Very hot.", "Pluies courtes. Longue saison sèche. Très chaud.", "🌵", "#E3B04B", "arid"),
 (2, "dry_savanna", "Dry savanna belt", "Ceinture de savane sèche", "One rainy season. Dry spells in the middle.", "Une saison des pluies. Périodes sèches au milieu.", "🌾", "#D9822B", "unimodal"),
 (3, "moist_savanna", "Moist savanna land", "Terres de savane humide", "One long rainy season. Warm and fairly wet.", "Une longue saison des pluies. Chaud et assez humide.", "🌳", "#8DB255", "unimodal"),
 (4, "wet_forest", "Wet forest land", "Terres de forêt humide", "Very wet most of the year. Short dry spell.", "Très humide presque toute l'année. Courte saison sèche.", "🌴", "#2E7D4F", "year_round"),
 (5, "wet_uplands", "Wet uplands, two rainy seasons", "Hautes terres humides, deux saisons des pluies", "Two rainy seasons. Mild and wet.", "Deux saisons des pluies. Doux et humide.", "⛰️", "#3AA6A0", "bimodal"),
 (6, "horn_drylands", "Horn drylands", "Terres sèches de la Corne", "Two short, unreliable rainy seasons.", "Deux courtes saisons des pluies peu fiables.", "🐪", "#C75B4A", "bimodal"),
 (7, "highland_plateau", "Highland plateau", "Hauts plateaux", "Cool, high land. One rainy season.", "Terres hautes et fraîches. Une saison des pluies.", "🌄", "#8E6BBF", "unimodal"),
 (8, "south_dry_woodland", "Southern dry woodland", "Savane arborée sèche du sud", "Low rain, long dry season. Mild heat.", "Peu de pluie, longue saison sèche. Chaleur modérée.", "🌿", "#B59B5B", "unimodal"),
 (9, "dry_margins", "Dry margins", "Marges sèches", "Very little rain. Farming is hard without water.", "Très peu de pluie. Cultiver est difficile sans eau.", "🌬️", "#9AA0A6", "arid"),
 (10, "desert", "Desert", "Désert", "Almost no rain. Farming needs irrigation.", "Presque pas de pluie. Il faut irriguer.", "🏜️", "#F2E3B3", "arid"),
]


def suit(v, amin, omin, omax, amax):
    if v is None or amin is None or v <= amin or v >= amax:
        return 0.0
    if omin <= v <= omax:
        return 1.0
    return (v - amin) / (omin - amin) if v < omin else (amax - v) / (amax - omax)


def soil_sentence(r):
    if pd.isna(r.get("ph")):
        return None, None
    if r.ph < 5.5: return "Acid soil. Rain washes nutrients away.", "Sol acide. La pluie lave les nutriments."
    if r.sand >= 60: return "Sandy soil. Holds little water.", "Sol sableux. Retient peu d'eau."
    if r.clay >= 45: return "Heavy clay soil. Holds water, can flood.", "Sol argileux lourd. Retient l'eau, peut s'inonder."
    if r.soc < 10: return "Tired soil. Low in nutrients.", "Sol fatigué. Pauvre en nutriments."
    return "Fairly balanced soil. Keep feeding it.", "Sol assez équilibré. Continuez à le nourrir."


def month_range(a, b, lang):
    names = MONTHS_EN if lang == "en" else MONTHS_FR
    return names[a - 1] if a == b else f"{names[a - 1]}–{names[b - 1]}"


def main():
    F = pd.read_csv(ROOT / "data/features.csv")
    C = pd.read_csv(ROOT / "data/climate_monthly.csv")
    S = pd.read_csv(ROOT / "data/spi_selected.csv")
    G = pd.DataFrame(json.loads((ROOT / "data/grid.json").read_text()))
    F = F.merge(G, on=["lat", "lon"], how="left").sort_values(["lat", "lon"]).reset_index(drop=True)
    F["cell_id"] = np.arange(1, len(F) + 1)
    idmap = {(r.lat, r.lon): r.cell_id for r in F.itertuples()}

    # ---- zones
    desert = F.rain_annual < 150
    F["log_rain"] = np.log1p(F.rain_annual); F["log_aridity"] = np.log1p(F.aridity * 10); F["elev_k"] = F.elev.fillna(0).clip(lower=0) / 1000
    FEATS = ["log_rain", "rain_cv", "n_seasons", "dry_months", "log_aridity", "tmean", "hot_months", "drought_freq", "heavy_freq", "elev_k"]
    W = np.array([1.5, 0.8, 1.2, 1.2, 1.2, 1.0, 0.8, 0.6, 0.6, 0.9])
    farm = F[~desert]
    Xf = StandardScaler().fit_transform(farm[FEATS].fillna(farm[FEATS].median())) * W
    km = KMeans(9, n_init=50, random_state=42).fit(Xf)
    # k-means label numbers depend on row order, so match each cluster to a zone by its characteristics
    # (median rain mm, dry months, seasons, tmean, elevation m) as inspected and named on the k=9 diagnostic run.
    REF = {1: (291, 10, 1, 28.3, 339), 2: (747, 7, 1, 27.9, 366), 3: (1266, 5, 1, 25.5, 414), 4: (1778, 2, 1, 24.6, 455),
           5: (1608, 1.5, 2, 23.6, 848), 6: (484, 9, 2, 27.2, 421), 7: (1128, 6, 1, 21.3, 1238), 8: (550, 8, 1, 22.3, 1099), 9: (265, 12, 1, 19.0, 916)}
    from scipy.optimize import linear_sum_assignment
    scale = np.array([600.0, 4.0, 0.7, 4.0, 500.0])
    med = np.array([[farm[km.labels_ == c].rain_annual.median(), farm[km.labels_ == c].dry_months.median(), farm[km.labels_ == c].n_seasons.median(),
                     farm[km.labels_ == c].tmean.median(), farm[km.labels_ == c].elev.median()] for c in range(9)])
    ref = np.array([REF[z] for z in range(1, 10)])
    cost = (((med[:, None, :] - ref[None, :, :]) / scale) ** 2).sum(-1)
    r_i, c_i = linear_sum_assignment(cost)
    raw2zone = {int(a): int(b) + 1 for a, b in zip(r_i, c_i)}
    print("cluster->zone", raw2zone, "max match cost", round(float(cost[r_i, c_i].max()), 3))
    assert cost[r_i, c_i].max() < 1.0, "clusters no longer match the frozen zone definitions"
    F["zone_id"] = 10
    F.loc[~desert, "zone_id"] = [raw2zone[int(l)] for l in km.labels_]

    # ---- soil: attach nearest sampled cell
    soil = []
    for f in (ROOT / "data/raw/soil").glob("*.json"):
        d = json.loads(f.read_text())
        if d["soil"]:
            soil.append((d["lat"], d["lon"], d["soil"]))
    def xyz(la, lo):
        la, lo = np.radians(la), np.radians(lo)
        return np.c_[np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)]
    tree = cKDTree(xyz(np.array([s[0] for s in soil]), np.array([s[1] for s in soil])))
    dist, nn = tree.query(xyz(F.lat.values, F.lon.values))
    for col, key in (("clay", "clay"), ("sand", "sand"), ("ph", "phh2o"), ("soc", "soc"), ("cec", "cec")):
        F[col] = [soil[i][2][key] for i in nn]
    exact = {(s[0], s[1]) for s in soil}
    F["soil_source"] = ["soilgrids_rest" if (r.lat, r.lon) in exact else "soilgrids_rest_nn" for r in F.itertuples()]
    sent = F.apply(soil_sentence, axis=1)
    F["soil_en"] = [s[0] for s in sent]; F["soil_fr"] = [s[1] for s in sent]

    # ---- erosion proxy (low confidence): rain intensity x erodibility (sand, low organic carbon)
    erod = F.sand / 100 * 0.5 + (1 - (F.soc / 40).clip(0, 1)) * 0.5
    F["erosion_idx"] = (F.peak_rain_month_mm.rank(pct=True) * 0.6 + erod.rank(pct=True) * 0.4)
    F["hz_erosion"] = np.ceil(F.erosion_idx.rank(pct=True) * 5).clip(1, 5).astype(int)

    # ---- typical crops per zone from EcoCrop suitability on zone medians (suitable crops, not what farmers grow)
    with psycopg.connect(URL, connect_timeout=30) as con:
        crops = con.execute("select slug, tmin_abs,tmin_opt,tmax_opt,tmax_abs, rain_min_abs,rain_min_opt,rain_max_opt,rain_max_abs from crops where in_mvp").fetchall()
    typical = {}
    for z in range(1, 11):
        m = F[F.zone_id == z]
        if m.empty: typical[z] = []; continue
        # mean suitability over the zone's cells (not just the median cell); tomato excluded (horticulture, not a staple rotation crop)
        sc = sorted(((float(np.mean([min(suit(t, c[1], c[2], c[3], c[4]), suit(r, c[5], c[6], c[7], c[8]))
                                      for t, r in zip(m.tmean, m.rain_annual)])), c[0]) for c in crops if c[0] != "tomato"), reverse=True)
        typical[z] = [s for v, s in sc if v >= 0.3][:4]

    # ---- watch months + planting windows (past climate, never a forecast)
    watch, windows = [], []
    for cid, g in C.assign(cell_id=[idmap[(a, b)] for a, b in zip(C.lat, C.lon)]).groupby("cell_id"):
        g = g.sort_values("month")
        p50, p80, tx, et0 = g.rain_p50.values, g.rain_p80.values, g.tmax.values, g.et0.values
        for i in range(12):
            watch.append((cid, i + 1, bool(p50[i] < 50), bool(p80[i] >= 300), bool(tx[i] > 35)))
        ratio = p50 / np.maximum(et0, 1)
        wet = ratio >= 0.5
        onsets = [i for i in range(12) if wet[i] and not wet[i - 1]]
        if not onsets or wet.all():
            windows.append((cid, 1, None, None, "median rain >= 50% of ET0",
                            "Rain is too low or too constant to name a planting start." if not wet.all() else "Rain is steady all year. Plant any month, avoid flood months.",
                            "La pluie est trop faible ou trop régulière pour fixer un début de semis." if not wet.all() else "La pluie est régulière toute l'année. Semez quand vous voulez, évitez les mois de crue."))
        else:
            for s, o in enumerate(sorted(onsets, key=lambda i: -p50[i:i + 3].sum())[:2], 1):
                a, b = o + 1, (o + 1) % 12 + 1
                windows.append((cid, s, a, b, "first month(s) where median rain >= 50% of ET0",
                                f"Planting usually starts in: {month_range(a, b, 'en')}", f"Les semis commencent en général en : {month_range(a, b, 'fr')}"))

    # ---- climate twins (nearest neighbours in feature space, >= 500 km apart, at most 1 per country)
    Fk = farm.reset_index(drop=True)
    nn_model = NearestNeighbors(n_neighbors=120).fit(Xf)
    d_all, i_all = nn_model.kneighbors(Xf)
    sigma = float(np.median(d_all[:, 40]))   # similarity index scale: typical distance to the 40th neighbour
    def hav(a1, o1, a2, o2):
        a1, o1, a2, o2 = map(math.radians, (a1, o1, a2, o2))
        return 6371 * 2 * math.asin(math.sqrt(math.sin((a2 - a1) / 2) ** 2 + math.cos(a1) * math.cos(a2) * math.sin((o2 - o1) / 2) ** 2))
    def why(a, b):
        en, fr = [], []
        if a.n_seasons == b.n_seasons and a.n_seasons in (1, 2):
            en.append("one rainy season" if a.n_seasons == 1 else "two rainy seasons"); fr.append("une saison des pluies" if a.n_seasons == 1 else "deux saisons des pluies")
        if abs(math.log(a.rain_annual / b.rain_annual)) < 0.15: en.append("similar yearly rain"); fr.append("pluie annuelle semblable")
        if abs(a.dry_months - b.dry_months) <= 1: en.append("the same dry season length"); fr.append("la même durée de saison sèche")
        if abs(a.tmean - b.tmean) <= 1.5: en.append("similar temperatures"); fr.append("des températures semblables")
        if a.hz_flood >= 4 and b.hz_flood >= 4: en.append("the same flood risk"); fr.append("le même risque d'inondation")
        elif a.hz_drought >= 4 and b.hz_drought >= 4: en.append("the same drought risk"); fr.append("le même risque de sécheresse")
        en, fr = en[:3], fr[:3]
        if not en: return "Similar climate overall.", "Climat globalement semblable."
        j = lambda x, w: ", ".join(x[:-1]) + f" {w} " + x[-1] if len(x) > 1 else x[0]
        return "Like yours: " + j(en, "and") + ".", "Comme chez vous : " + j(fr, "et") + "."
    twins = []
    for oi in range(len(Fk)):
        o = Fk.iloc[oi]
        picked, used = 0, {o.country}
        for dd, j in zip(d_all[oi][1:], i_all[oi][1:]):
            t = Fk.iloc[j]
            if t.country in used or hav(o.lat, o.lon, t.lat, t.lon) < 500: continue
            used.add(t.country); picked += 1
            en, fr = why(o, t)
            twins.append((int(o.cell_id), picked, int(t.cell_id), float(math.exp(-(dd ** 2) / (2 * sigma ** 2))), hav(o.lat, o.lon, t.lat, t.lon), en, fr))
            if picked == 5: break

    # ---- load
    with psycopg.connect(URL, connect_timeout=30) as con, con.cursor() as cur:
        cur.execute("truncate climate_twins, spi_series, cell_watch_months, planting_windows, ndvi_validation, pilot_satellite_monthly, "
                    "climate_monthly, cell_features, rotation_plan_steps, rotation_plans, cells")
        for z in ZONES:
            cur.execute("""insert into zones(zone_id,slug,name_en,name_fr,desc_en,desc_fr,icon,color,rain_regime,typical_crops,is_frozen)
                           values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,true)
                           on conflict (zone_id) do update set slug=excluded.slug,name_en=excluded.name_en,name_fr=excluded.name_fr,
                           desc_en=excluded.desc_en,desc_fr=excluded.desc_fr,icon=excluded.icon,color=excluded.color,
                           rain_regime=excluded.rain_regime,typical_crops=excluded.typical_crops,is_frozen=true""",
                        (*z, typical[z[0]]))
        def copy(table, cols, rows):
            with cur.copy(f"copy {table} ({cols}) from stdin") as cp:
                for r in rows: cp.write_row(r)
        nz = lambda v: None if (v is None or (isinstance(v, float) and math.isnan(v))) else v
        copy("cells", "cell_id,lat,lon,country,iso3,place_name,zone_id,is_pilot,pilot_name",
             [(int(r.cell_id), r.lat, r.lon, r.country, r.iso3, nz(r.pilot_name), int(r.zone_id), bool(r.is_pilot), nz(r.pilot_name)) for r in F.itertuples()])
        copy("cell_features", "cell_id,rain_annual,rain_cv,n_seasons,dry_months,aridity,tmean,hot_months,clay,sand,ph,soc,cec,drought_freq,heavy_freq,heat_idx,erosion_idx,"
             "hz_drought,hz_flood,hz_heat,hz_erosion,soil_source,elevation_m,soil_en,soil_fr",
             [(int(r.cell_id), *(nz(float(x)) for x in (r.rain_annual, r.rain_cv)), int(r.n_seasons), int(r.dry_months), nz(float(r.aridity)), nz(float(r.tmean)), nz(float(r.hot_months)),
               nz(float(r.clay)), nz(float(r.sand)), nz(float(r.ph)), nz(float(r.soc)), nz(float(r.cec)), nz(float(r.drought_freq)), nz(float(r.heavy_freq)),
               nz(float(r.heat_idx)), nz(float(r.erosion_idx)), int(r.hz_drought), int(r.hz_flood), int(r.hz_heat), int(r.hz_erosion), r.soil_source, nz(r.elev), r.soil_en, r.soil_fr)
              for r in F.itertuples()])
        copy("climate_monthly", "cell_id,month,rain_p20,rain_p50,rain_p80,tmean,tmax,tmin,et0,solar,rh",
             [(idmap[(r.lat, r.lon)], int(r.month), r.rain_p20, r.rain_p50, r.rain_p80, r.tmean, r.tmax, r.tmin, r.et0, nz(r.solar), nz(r.rh)) for r in C.itertuples()])
        copy("cell_watch_months", "cell_id,month,is_dry,is_flood,is_heat", watch)
        copy("planting_windows", "cell_id,season,start_month,end_month,method,text_en,text_fr", windows)
        copy("climate_twins", "cell_id,rank,twin_cell_id,similarity,distance_km,reason_en,reason_fr", twins)
        copy("spi_series", "cell_id,ym,spi3,rain_mm", [(idmap[(r.lat, r.lon)], int(r.ym), r.spi3, r.rain_mm) for r in S.itertuples()])
        cur.execute("update data_versions set version=%s, updated_at=now() where name='zones'", ("k9+desert-" + pd.Timestamp.now().strftime("%Y%m%d"),))
        con.commit()
    print("loaded:", len(F), "cells;", len(C), "monthly rows;", len(twins), "twins;", len(S), "spi rows;", len(soil), "soil samples")
    print(F.groupby("zone_id").size().to_dict()); print(typical)


if __name__ == "__main__":
    main()
