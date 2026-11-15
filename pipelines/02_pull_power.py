"""Resumable NASA POWER monthly pull for every grid cell (1981-2025).

Source: https://power.larc.nasa.gov/docs/services/api/temporal/monthly/  (community=AG, no login)
Parameters: PRECTOTCORR (mm/day), T2M, T2M_MAX, T2M_MIN (C), ALLSKY_SFC_SW_DWN (kWh/m2/day), RH2M (%), GWETROOT (0-1)
Every response is saved to data/raw/power/<lat>_<lon>.json so a crash costs nothing.
"""
import json, pathlib, time, sys, requests
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data/raw/power"; OUT.mkdir(parents=True, exist_ok=True)
URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
PARAMS = "PRECTOTCORR,T2M,T2M_MAX,T2M_MIN,ALLSKY_SFC_SW_DWN,RH2M,GWETROOT"
cells = json.loads((ROOT / "data/grid.json").read_text())
cells.sort(key=lambda c: (not c["is_pilot"], c["lat"], c["lon"]))   # pilots first

def fetch(c):
    f = OUT / f"{c['lat']}_{c['lon']}.json"
    if f.exists():
        return 0
    for attempt in range(6):
        try:
            r = requests.get(URL, params={"parameters": PARAMS, "community": "AG", "latitude": c["lat"],
                             "longitude": c["lon"], "start": 1981, "end": 2025, "format": "JSON"}, timeout=120)
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(5 * (attempt + 1)); continue
            r.raise_for_status()
            j = r.json()
            f.write_text(json.dumps({"lat": c["lat"], "lon": c["lon"], "elev": j["geometry"]["coordinates"][2],
                                     "p": j["properties"]["parameter"]}))
            return 1
        except Exception as e:
            time.sleep(3 * (attempt + 1))
    print("FAILED", c, file=sys.stderr)
    return 0

if __name__ == "__main__":
    done = 0
    with ThreadPoolExecutor(3) as ex:
        for i, ok in enumerate(ex.map(fetch, cells), 1):
            done += ok
            if i % 50 == 0:
                print(f"{i}/{len(cells)} ({done} new)", flush=True)
    print("DONE", len(list(OUT.glob('*.json'))), "files")
