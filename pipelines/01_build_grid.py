"""Build the 1-degree Africa grid (cell centres at x.5) and the Cameroon pilot cells.

Source of country polygons: Natural Earth 110m admin_0_countries (public domain).
https://www.naturalearthdata.com/downloads/110m-cultural-vectors/
Output: data/grid.json  (list of {lat, lon, country, iso3, is_pilot, pilot_name})
"""
import json, pathlib
import numpy as np
from shapely.geometry import shape, Point
from shapely.prepared import prep

ROOT = pathlib.Path(__file__).resolve().parents[1]
fc = json.loads((ROOT / "data/ne_countries.geojson").read_text(encoding="utf-8"))
polys = []
for f in fc["features"]:
    p = f["properties"]
    if p.get("CONTINENT") == "Africa" or p.get("continent") == "Africa":
        name = p.get("NAME") or p.get("name")
        iso3 = p.get("ADM0_A3") or p.get("iso_a3")
        geom = shape(f["geometry"])
        polys.append((name, iso3, geom, prep(geom.buffer(0.35))))  # small buffer keeps coastal cells

cells = []
for la in np.arange(-34.5, 37.5, 1.0):
    for lo in np.arange(-17.5, 51.5, 1.0):
        pt = Point(float(lo), float(la))
        hit = None
        for name, iso3, g, pg in polys:
            if pg.contains(pt):
                hit = (name, iso3)
                if g.contains(pt):
                    break
        if hit:
            cells.append(dict(lat=float(la), lon=float(lo), country=hit[0], iso3=hit[1], is_pilot=False, pilot_name=None))

# Cameroon pilot sites (exact coordinates) - Master Guide section 4
PILOTS = [
    ("Douala", 4.05, 9.70), ("Yaounde", 3.87, 11.52), ("Dschang", 5.45, 10.07),
    ("Ngaoundere", 7.32, 13.58), ("Maroua", 10.59, 14.32),
]
for n, la, lo in PILOTS:
    cells.append(dict(lat=la, lon=lo, country="Cameroon", iso3="CMR", is_pilot=True, pilot_name=n))

(ROOT / "data/grid.json").write_text(json.dumps(cells))
print(len(cells), "cells,", sum(c["is_pilot"] for c in cells), "pilots")
