"""The plan generator (engine/plans.py) is a port of Ojani's engine/rotations.mjs: both must give the same plans."""
import json
import shutil
import subprocess
from pathlib import Path

import pytest

from backend.app.engine import plans as P

ROOT = Path(__file__).resolve().parents[2]
DATA = json.loads((ROOT / "engine" / "testdata.json").read_text(encoding="utf-8"))
EXTRA = json.loads((Path(__file__).parent / "fixtures" / "extra_cells.json").read_text(encoding="utf-8"))
EXTRA.pop("_note")
DATA["cells"].update(EXTRA)  # adds a real two-season cell (Bimodal754)
CROPS = DATA["crops"]
OPTS = [
    {},
    {"priorities": ["soil", "water"], "canWater": False, "canBuyFertilizer": False},
    {"lastCrop": "maize", "priorities": ["money"]},
    {"canWater": True, "canBuyFertilizer": True, "lastCrop": "none"},
    {"lastCrop": "groundnut", "canWater": True},
]


def python_plans(name, opts):
    c = DATA["cells"][name]
    return P.generate_plans(c["cell"], c["climate"], CROPS, DATA["reasons"], c["floodMonths"], c["plantMonths"], {
        "last_crop": opts.get("lastCrop"), "can_water": opts.get("canWater"), "can_buy_fertilizer": opts.get("canBuyFertilizer")})


@pytest.mark.skipif(shutil.which("node") is None, reason="node is not installed")
@pytest.mark.parametrize("opts", OPTS)
def test_same_plans_as_the_javascript_engine(opts):
    out = subprocess.run(["node", str(Path(__file__).with_name("js_plans_runner.mjs")), json.dumps(opts)],
                         capture_output=True, encoding="utf-8", check=True).stdout
    js = json.loads(out)
    for name in DATA["cells"]:
        mine, theirs = python_plans(name, opts), js[name]
        assert mine["low_potential"] == theirs["low_potential"], name
        assert len(mine["plans"]) == len(theirs["plans"]) == 3, name
        for a, b in zip(mine["plans"], theirs["plans"]):
            assert a["id"] == b["id"] and a["kind"] == b["kind"], name
            assert a["sequence"] == b["sequence"], (name, a["kind"])
            assert a["sub"] == b["sub"] and a["scen"] == b["scen"], (name, a["kind"])
            assert a["reason"] == b["reason"], (name, a["kind"])
            assert [w["code"] for w in a["why"]] == [w["code"] for w in b["why"]], (name, a["kind"])
            assert [w["code"] for w in a["warnings"]] == [w["code"] for w in b["warnings"]], (name, a["kind"])


def test_two_season_cell_plans_use_both_planting_months():
    plans = python_plans("Bimodal754", {})["plans"]
    assert len(plans) == 3 and all(len(p["sequence"]) == 4 for p in plans)
    assert all([s["month"] for s in p["sequence"]] == [4, 11, 4, 11] for p in plans)


def test_hard_rules_hold():
    for name in DATA["cells"]:
        fam = {c["slug"]: c["family"] for c in CROPS}
        leg = {c["slug"]: c["is_legume"] for c in CROPS}
        for plan in python_plans(name, {})["plans"]:
            seq = [s["crop"] for s in plan["sequence"]]
            assert all(fam[a] != fam[b] for a, b in zip(seq, seq[1:])), (name, seq)  # no same family back to back
            assert any(leg[s] for s in seq)  # at least one legume


def test_last_crop_family_never_comes_first():
    for name in DATA["cells"]:
        for plan in python_plans(name, {"lastCrop": "maize"})["plans"]:
            assert plan["sequence"][0]["crop"] not in {"maize", "sorghum", "millet", "rice"}  # Poaceae


def test_flood_intolerant_crop_is_excluded_in_a_flood_prone_cell():
    assert all(s["crop"] != "tomato" for p in python_plans("Douala", {})["plans"] for s in p["sequence"])


def test_no_planting_month_means_low_potential_not_a_guess():
    c = DATA["cells"]["Douala"]
    out = P.generate_plans(c["cell"], c["climate"], CROPS, DATA["reasons"], [], [], {})
    assert out == {"low_potential": True, "plans": []}


def test_trapezoid_and_rules_from_database_config():
    assert P.trapezoid(5, 0, 2, 8, 10) == 1 and P.trapezoid(1, 0, 2, 8, 10) == 0.5 and P.trapezoid(11, 0, 2, 8, 10) == 0
    assert P.trapezoid(None, 0, 2, 8, 10) == 1  # no data: not limiting
    r = P.PlanRules().with_db_config({"effective_rain_share": "0.7", "suitability_min": "0.5", "junk": "x"})
    assert r.effective_rain == 0.7 and r.suit_min == 0.5
    assert P.PlanRules().with_db_config({"effective_rain_share": "n/a"}).effective_rain == 0.8  # bad value ignored
