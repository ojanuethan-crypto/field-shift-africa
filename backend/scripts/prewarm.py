"""Warm the API cache for the demo sites by calling your OWN running API (Backend Guide section 5.3).

    python backend/scripts/prewarm.py                                  # http://127.0.0.1:8000, default sites
    python backend/scripts/prewarm.py --base https://your-api.example --site 4.05,9.70 --site 3.87,11.52

Uses default priorities (none), so the cache keys match what the app sends first. Prints one line per call, exits 1 if any call failed.
"""
import argparse
import json
import sys
import time
import urllib.error
import urllib.request

# Coordinates of the guide's pilot towns (Douala is the guide's own example). Add the other demo sites with --site.
SITES = {"Douala": (4.05, 9.70), "Yaounde": (3.87, 11.52), "Ngaoundere": (7.32, 13.58), "Maroua": (10.59, 14.32)}


def call(base, method, path, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(base + path, data=data, method=method, headers={"Content-Type": "application/json"})
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            status, cache = r.status, r.headers.get("X-Cache", "-")
    except urllib.error.HTTPError as e:
        status, cache = e.code, "-"
    except Exception as e:  # network down, timeout...
        print(f"FAIL {method} {path}: {e}")
        return False
    ms = (time.perf_counter() - t0) * 1000
    print(f"{status} {method} {path} {ms:.0f}ms cache={cache}")
    return status in (200, 422)  # 422 = a place outside coverage: a valid, honest answer


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8000")
    ap.add_argument("--site", action="append", help="extra site as lat,lon (repeatable)")
    args = ap.parse_args()
    sites = list(SITES.values()) + [tuple(float(x) for x in s.split(",")) for s in args.site or []]
    ok = call(args.base, "GET", "/api/health")
    for lang in ("en", "fr"):
        ok &= call(args.base, "GET", f"/api/zones?lang={lang}")
        ok &= call(args.base, "GET", f"/api/crops?lang={lang}")
        ok &= call(args.base, "GET", f"/api/faq?lang={lang}")
    for lang in ("en", "fr"):  # the Advisor loads these on the first question: warm them (the real database takes a few seconds)
        ok &= call(args.base, "GET", f"/api/advice-index?lang={lang}")
    ok &= call(args.base, "POST", "/api/ask", {"question": "my field floods", "lang": "en"})
    ok &= call(args.base, "POST", "/api/ask", {"question": "mon champ est inondé", "lang": "fr"})
    ok &= call(args.base, "GET", "/api/proof")
    for lat, lon in sites:
        for lang in ("en", "fr"):
            ok &= call(args.base, "GET", f"/api/profile?lat={lat}&lon={lon}&lang={lang}")
        ok &= call(args.base, "POST", "/api/rotations", {"lat": lat, "lon": lon})
        ok &= call(args.base, "GET", f"/api/twins?lat={lat}&lon={lon}")
        ok &= call(args.base, "GET", f"/api/window?lat={lat}&lon={lon}")
        ok &= call(args.base, "GET", f"/api/passport?lat={lat}&lon={lon}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
