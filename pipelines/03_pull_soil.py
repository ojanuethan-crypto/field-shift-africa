"""SoilGrids 2.0 point sampling (ISRIC REST). Rate limited (~5 calls/min) and slow, so we sample:
all pilot sites + every 3rd grid cell in lat and lon (~1 in 9 cells). Other cells take the nearest sampled cell
(soil_source='soilgrids_rest_nn'). Documented in the Data Passport.

Source: https://rest.isric.org/soilgrids/v2.0/docs   (CC BY 4.0, Poggio et al. 2021)
Values are divided by d_factor and averaged over 0-30 cm weighted by layer thickness (5, 10, 15 cm).
Resumable: results go to data/raw/soil/<lat>_<lon>.json
"""
import json, pathlib, time, sys, requests

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data/raw/soil"; OUT.mkdir(parents=True, exist_ok=True)
URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
PROPS = ["clay", "sand", "phh2o", "soc", "cec"]
DEPTHS = ["0-5cm", "5-15cm", "15-30cm"]
W = {"0-5cm": 5, "5-15cm": 10, "15-30cm": 15}
OFFSETS = [(0, 0), (0.05, 0), (-0.05, 0), (0, 0.05), (0, -0.05), (0.15, 0.15), (-0.15, -0.15), (0.15, -0.15), (-0.15, 0.15)]

cells = json.loads((ROOT / "data/grid.json").read_text())
sample = [c for c in cells if c["is_pilot"] or (int(round(c["lat"] - 0.5)) % 3 == 0 and int(round(c["lon"] - 0.5)) % 3 == 0)]
import random
random.Random(7).shuffle(sample)          # even continental coverage at any stopping point
sample.sort(key=lambda c: not c["is_pilot"])


def query(lat, lon):
    r = requests.get(URL, params={"lat": lat, "lon": lon, "property": PROPS, "depth": DEPTHS, "value": "mean"}, timeout=120)
    r.raise_for_status()
    out = {}
    for layer in r.json()["properties"]["layers"]:
        f = layer["unit_measure"]["d_factor"]
        num = den = 0.0
        for d in layer["depths"]:
            v = d["values"]["mean"]
            if v is not None:
                num += W[d["label"]] * v / f
                den += W[d["label"]]
        if den:
            out[layer["name"]] = num / den
    return out


def run():
    for i, c in enumerate(sample, 1):
        f = OUT / f"{c['lat']}_{c['lon']}.json"
        if f.exists():
            continue
        res, used = None, None
        for dla, dlo in OFFSETS:
            for attempt in range(3):
                try:
                    q = query(c["lat"] + dla, c["lon"] + dlo)
                    break
                except Exception:
                    q = None
                    time.sleep(15 * (attempt + 1))
            time.sleep(13)  # stay under ~5 calls/min
            if q and len(q) == len(PROPS):
                res, used = q, (dla, dlo)
                break
        f.write_text(json.dumps({"lat": c["lat"], "lon": c["lon"], "soil": res, "offset": used}))
        print(f"{i}/{len(sample)} {c['lat']},{c['lon']} {'ok' if res else 'NO DATA'}", flush=True)


if __name__ == "__main__":
    run()
    print("DONE")
