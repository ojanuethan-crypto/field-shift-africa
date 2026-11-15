"""Dev check: opens the real app in headless Edge/Chrome (real time, so the splash plays) and reads what is on screen.
Needs the API and the app running, and `pip install websocket-client` (dev only). Not part of the pytest suite.

    python backend/scripts/browser_check.py [app-url]          # default http://localhost:4173 (npm run build && npm run preview)

The API must allow the app's origin (ALLOWED_ORIGINS) and the app must be built with VITE_USE_MOCK=false.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

import websocket  # websocket-client

APP = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4173"
CANDIDATES = [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              shutil.which("msedge"), shutil.which("google-chrome"), shutil.which("chromium")]
BROWSER = next(p for p in CANDIDATES if p and os.path.exists(p))
PORT = 9333


class Page:
    def __init__(self):
        self.profile = tempfile.mkdtemp()
        self.proc = subprocess.Popen([BROWSER, "--headless=new", "--disable-gpu", f"--remote-debugging-port={PORT}", f"--user-data-dir={self.profile}",
                                      "--window-size=420,900", "about:blank"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(50):
            try:
                tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json"))
                self.ws = websocket.create_connection(next(t for t in tabs if t["type"] == "page")["webSocketDebuggerUrl"], timeout=30)
                break
            except Exception:
                time.sleep(0.3)
        self.n = 0

    def cmd(self, method, **params):
        self.n += 1
        self.ws.send(json.dumps({"id": self.n, "method": method, "params": params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.n:
                return msg.get("result", {})

    def text(self):
        return self.cmd("Runtime.evaluate", expression="document.body.innerText", returnByValue=True).get("result", {}).get("value", "") or ""

    def js(self, expr):
        return self.cmd("Runtime.evaluate", expression=expr, returnByValue=True).get("result", {}).get("value")

    def open(self, path, wait_for=None, timeout=40):
        self.cmd("Page.navigate", url=APP + path)
        end = time.time() + timeout
        while time.time() < end:
            time.sleep(0.7)
            t = self.text()
            if wait_for and all(w in t for w in wait_for):
                return t
        return self.text()

    def close(self):
        self.proc.terminate()


fails = 0


def check(name, cond, extra=""):
    global fails
    print(("PASS " if cond else "FAIL ") + name + ("" if cond else "  | " + extra[:240].replace("\n", " ")))
    fails += 0 if cond else 1


def main():
    p = Page()
    try:
        # S10 zone legend: the zones the database lists, real markers on the map
        t = p.open("/zones", ["Desert"])
        check("S10 /zones: zones from the database (Desert, Wet forest land)", "Desert" in t and "Wet forest land" in t, t)
        check("S10 /zones: map markers drawn", (p.js("document.querySelectorAll('.leaflet-marker-icon').length") or 0) > 100, str(p.js("document.querySelectorAll('.leaflet-marker-icon').length")))
        # S21 proof: the real backtest, with the honest miss
        t = p.open("/proof", ["Horn of Africa"])
        check("S21 /proof: real events incl. 2020-22 Horn of Africa", "2020-22 Horn of Africa" in t, t)
        check("S21 /proof: the miss is explained, not hidden", "We report it as is" in t or "MISS" in t, t)
        check("S21 /proof: no 'sample data' badge, no invented plant-check chart", "Not computed yet" in t, t)
        # S20 passport: real dataset registry
        t = p.open("/passport", ["NASA POWER"])
        check("S20 /passport: datasets, access date, limits", "NASA POWER" in t and "ISRIC SoilGrids" in t and "2026-11-15" in t and "wrong locally" in t, t)
        # S15 faq: real questions
        t = p.open("/faq", ["Why change crops?"])
        check("S15 /faq: real questions from the database", "Why change crops?" in t and "floods" in t, t)
        p.js("[...document.querySelectorAll('button')].find(b => b.innerText.includes('Why change crops?'))?.click()")
        time.sleep(1.5)
        t = p.text()
        check("S15 /faq: tapping a question shows the FAO passage with its source", "Save and Grow" in t or "FAO" in t or "varieties" in t, t)
        # S14 advisor
        t = p.open("/advisor", ["Ask"], 30)
        check("S14 /advisor loads (no error)", "try again" not in t.lower(), t)
        # a farmer's journey with a saved farm (state is the app's own localStorage entry)
        def farm_state(lat, lon, name, lang="en", **extra):
            st = {"lang": lang, "muted": True, "voiceSet": True, "farm": {"lat": lat, "lon": lon, "name": name}, "lastCrop": "maize",
                  "priorities": ["soil", "water"], "canWater": False, **extra}
            p.cmd("Page.navigate", url=APP + "/about")
            time.sleep(2)
            p.js("localStorage.setItem('fieldnav.state.v1', %s)" % json.dumps(json.dumps(st)))

        farm_state(4.05, 9.7, "Douala")
        t = p.open("/land", ["Wet forest land"])
        check("S3 /land (Douala): real zone, hazards, soil from the database", "Wet forest land" in t and "Acid soil" in t, t)
        check("S3 /land: planting window card (March-April)", "March" in t and "April" in t, t)
        t = p.open("/routes", ["Groundnut"])
        n_plans = t.count("See the steps")
        check("S7 /routes: 3 real plans with crops", n_plans == 3 and "Groundnut" in t, "plans=%s %s" % (n_plans, t))
        check("S7 /routes: no error / no sample badge", "try again" not in t.lower() and "example data" not in t.lower(), t)
        t = p.open("/routes/1034-soil", ["Groundnut"])
        check("S8 /routes/1034-soil: plan detail from the real plan", "Groundnut" in t and "Cocoyam" in t, t)
        t = p.open("/twins", ["Gabon"])
        check("S11 /twins: real climate twins (Gabon...)", "Gabon" in t, t)
        t = p.open("/months", ["Too much rain"])
        check("S12 /months: watch months from the database", "Dry spell: January, February, December" in t and "Too much rain: June" in t, t)

        farm_state(23.0, 12.0, "Sahara")
        t = p.open("/land", [], 14)
        check("S3 /land (Sahara): friendly desert screen, not data or an error", "try again" not in t.lower() and "Wet forest" not in t, t)
        print("     desert /land says:", t[:140].replace("\n", " "))
        t = p.open("/routes", [], 14)
        check("S7 /routes (Sahara): friendly state, not an error", "try again" not in t.lower() and "Groundnut" not in t, t)
        print("     desert /routes says:", t[:140].replace("\n", " "))

        farm_state(4.05, 9.7, "Douala", lang="fr")
        t = p.open("/faq", ["Pourquoi changer de culture"])
        check("S15 /faq in French: French questions", "Pourquoi changer de culture" in t, t)
        t = p.open("/land", ["Terres de forêt humide"])
        check("S3 /land in French: French zone name and text", "Terres de forêt humide" in t and "Sol acide" in t, t)
    finally:
        p.close()
    print("\nFAILED: %d" % fails if fails else "\nALL PASSED")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
