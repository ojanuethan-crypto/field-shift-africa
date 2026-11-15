"""MODIS NDVI (MOD13A3 v061, 1 km monthly) at the pilot sites via NASA AppEEARS (needs Earthdata login in .env).
Docs: https://appeears.earthdatacloud.nasa.gov/api/   Usage: python pipelines/11_appeears_ndvi.py submit|fetch
Credentials are read from .env (EARTHDATA_USERNAME / EARTHDATA_PASSWORD) and never printed."""
import sys, json, time, pathlib, requests

ROOT = pathlib.Path(__file__).resolve().parents[1]
ENV = dict(l.split("=", 1) for l in (ROOT / ".env").read_text().splitlines() if "=" in l and not l.startswith("#"))
API = "https://appeears.earthdatacloud.nasa.gov/api"
OUT = ROOT / "data/appeears"; OUT.mkdir(exist_ok=True)
PILOTS = [("Douala", 4.05, 9.70), ("Yaounde", 3.87, 11.52), ("Dschang", 5.45, 10.07), ("Ngaoundere", 7.32, 13.58), ("Maroua", 10.59, 14.32)]


def token():
    r = requests.post(f"{API}/login", auth=(ENV["EARTHDATA_USERNAME"], ENV["EARTHDATA_PASSWORD"]), timeout=60)
    if r.status_code != 200:
        sys.exit(f"login failed: HTTP {r.status_code} {r.text[:120]}")
    return {"Authorization": "Bearer " + r.json()["token"]}


def submit():
    h = token()
    body = {"task_type": "point", "task_name": "scifarm_pilots_ndvi", "params": {
        "dates": [{"startDate": "01-01-2001", "endDate": "12-31-2025"}],
        "layers": [{"product": "MOD13A3.061", "layer": "_1_km_monthly_NDVI"}, {"product": "MOD13A3.061", "layer": "_1_km_monthly_VI_Quality"}],
        "coordinates": [{"id": n, "latitude": la, "longitude": lo, "category": "pilot"} for n, la, lo in PILOTS]}}
    r = requests.post(f"{API}/task", json=body, headers=h, timeout=60)
    print(r.status_code, r.text[:200])
    if r.status_code in (200, 202):
        (OUT / "task.json").write_text(r.text)


def fetch():
    h = token()
    tid = json.loads((OUT / "task.json").read_text())["task_id"]
    st = requests.get(f"{API}/task/{tid}", headers=h, timeout=60).json()
    print("status:", st.get("status"), st.get("error", ""))
    if st.get("status") != "done":
        return
    files = requests.get(f"{API}/bundle/{tid}", headers=h, timeout=60).json()["files"]
    for f in files:
        if f["file_name"].endswith(".csv") and "MOD13A3" in f["file_name"] and "lookup" not in f["file_name"]:
            r = requests.get(f"{API}/bundle/{tid}/{f['file_id']}", headers=h, timeout=300)
            (OUT / "ndvi.csv").write_bytes(r.content); print("saved", f["file_name"], len(r.content), "bytes")


if __name__ == "__main__":
    {"submit": submit, "fetch": fetch}[sys.argv[1]]()
