"""Stage B1: cluster Africa grid cells into Resilience Zones (k-means) and print diagnostics.
Features exclude soil (sparse sampling); soil is attached to cells afterwards for crop matching.
Usage: python pipelines/06_zones.py diag        -> silhouette + ARI stability for k=6..10
       python pipelines/06_zones.py fit K       -> writes data/zones_k{K}.csv (cell -> zone label + centroid summary)
"""
import sys, json, pathlib
import numpy as np, pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score, adjusted_rand_score

ROOT = pathlib.Path(__file__).resolve().parents[1]
F = pd.read_csv(ROOT / "data/features.csv")
G = pd.DataFrame(json.loads((ROOT / "data/grid.json").read_text()))
F = F.merge(G, on=["lat", "lon"], how="left")

F["log_rain"] = np.log1p(F.rain_annual)
F["log_aridity"] = np.log1p(F.aridity * 10)
F["elev_k"] = F.elev.fillna(0).clip(lower=0) / 1000
FEATS = ["log_rain", "rain_cv", "n_seasons", "dry_months", "log_aridity", "tmean", "hot_months", "drought_freq", "heavy_freq", "elev_k"]
W = np.array([1.5, 0.8, 1.2, 1.2, 1.2, 1.0, 0.8, 0.6, 0.6, 0.9])   # modest up-weight for rain regime and aridity
DESERT = F.rain_annual < 150          # hyper-arid cells: fixed 'Desert' zone, excluded from clustering so zones describe farmland
F = F[~DESERT].reset_index(drop=True) if len(sys.argv) > 1 and sys.argv[1] != "keepdesert" else F
X = StandardScaler().fit_transform(F[FEATS].fillna(F[FEATS].median())) * W


def summarize(labels):
    d = F.assign(zone=labels)
    s = d.groupby("zone").agg(n=("lat", "size"), rain=("rain_annual", "median"), cv=("rain_cv", "median"), seas=("n_seasons", "median"),
                              dry=("dry_months", "median"), arid=("aridity", "median"), tmean=("tmean", "median"), hot=("hot_months", "median"),
                              elev=("elev", "median"), lat=("lat", "median"), lon=("lon", "median"))
    s["countries"] = d.groupby("zone").country.agg(lambda c: ", ".join(c.value_counts().index[:5]))
    return s.round(2)


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "diag":
        for k in range(6, 11):
            a = KMeans(k, n_init=20, random_state=42).fit(X)
            b = KMeans(k, n_init=20, random_state=7).fit(X)
            print(k, "silhouette", round(silhouette_score(X, a.labels_), 3), "stability(ARI)", round(adjusted_rand_score(a.labels_, b.labels_), 3))
    else:
        k = int(sys.argv[2])
        km = KMeans(k, n_init=50, random_state=42).fit(X)
        F["zone_raw"] = km.labels_
        pd.set_option("display.width", 250); pd.set_option("display.max_colwidth", 60)
        print(summarize(km.labels_).to_string())
        print(F[F.is_pilot == True][["pilot_name", "zone_raw", "rain_annual", "dry_months", "tmean"]].to_string())
        print("desert cells excluded:", int(DESERT.sum()))
        F[["lat", "lon", "zone_raw"]].to_csv(ROOT / f"data/zones_k{k}.csv", index=False)
