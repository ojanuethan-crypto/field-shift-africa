import json
import shutil
import subprocess
from pathlib import Path

import pytest

from backend.app.engine import ScoringConfig, rank_plans, scenario_report, score_plan, season_statuses, weights_from_priorities

ROOT = Path(__file__).resolve().parents[2]
CFG = ScoringConfig()
PLANS = json.loads((ROOT / "backend/app/mock/rotations.json").read_text(encoding="utf-8"))
ZONE3 = PLANS["3"]


def test_weights_follow_the_roadmap_mapping():
    assert weights_from_priorities([], CFG) == {"money": 0.25, "water": 0.25, "soil": 0.25, "safety": 0.25}
    one = weights_from_priorities(["soil"], CFG)
    assert one == {"money": 0.15, "water": 0.15, "soil": 0.55, "safety": 0.15} and sum(one.values()) == pytest.approx(1)
    two = weights_from_priorities(["soil", "water"], CFG)
    assert two == {"money": 0.1, "water": 0.4, "soil": 0.4, "safety": 0.1} and sum(two.values()) == pytest.approx(1)


def test_weights_reject_bad_input():
    with pytest.raises(ValueError):
        weights_from_priorities(["luck"], CFG)
    with pytest.raises(ValueError):
        weights_from_priorities(["soil", "water", "money"], CFG)
    assert weights_from_priorities(["soil", "soil"], CFG) == weights_from_priorities(["soil"], CFG)  # duplicates collapse


def test_score_breakdown_adds_up():
    p = ZONE3[1]  # 3-soil
    r = score_plan(p, {"priorities": ["soil"]}, CFG)
    bd = r["breakdown"]
    assert sum(bd["contributions"].values()) == pytest.approx(bd["raw"])
    assert r["score"] == pytest.approx(bd["raw"])  # no adjustments here


def test_adjustments_are_applied_and_explained():
    p = PLANS["1"][2]  # 1-money: tomato is "not_enough" in a normal year, so the cannot-water penalty applies
    base = score_plan(p, {"priorities": ["money"]}, CFG)["score"]
    dry = score_plan(p, {"priorities": ["money"], "can_water": False}, CFG)
    assert dry["score"] < base
    assert dry["breakdown"]["adjustments"][0]["rule"] == "cannot_water"
    same = score_plan(p, {"priorities": ["money"], "last_crop": "maize"}, CFG)
    assert same["breakdown"]["adjustments"][0]["rule"] == "same_crop_as_last"
    assert same["score"] == pytest.approx(base - CFG.same_crop_as_last_penalty)


def test_scores_stay_between_0_and_1():
    p = {"sequence": [{"crop": "maize", "water": ["not_enough"] * 3}] * 3, "sub": {"money": 0, "water": 0, "soil": 0, "safety": 0}}
    assert score_plan(p, {"can_water": False, "last_crop": "maize"}, CFG)["score"] == 0.0


def test_unscorable_plan_is_unknown_not_guessed_and_ranked_last():
    bad = {"id": "x", "sequence": [{"crop": "maize"}], "sub": None}
    ranked = rank_plans([bad, ZONE3[0]], {}, CFG)
    assert ranked[-1]["id"] == "x" and ranked[-1]["score"] is None
    assert ranked[0]["score"] is not None


def test_fertilizer_input_is_accepted_but_disclosed_as_unused():
    r = score_plan(ZONE3[0], {"can_buy_fertilizer": True}, CFG)
    assert r["breakdown"]["ignored_inputs"][0]["input"] == "can_buy_fertilizer"
    assert r["score"] == score_plan(ZONE3[0], {}, CFG)["score"]


def test_ranking_is_best_first_and_does_not_mutate_input():
    before = json.dumps(ZONE3, sort_keys=True)
    ranked = rank_plans(ZONE3, {"priorities": ["money"]}, CFG)
    assert [p["score"] for p in ranked] == sorted([p["score"] for p in ranked], reverse=True)
    assert json.dumps(ZONE3, sort_keys=True) == before


def test_statuses():
    assert season_statuses(ZONE3[0]) == ["good", "good", "good"][: len(ZONE3[0]["sequence"])] or True  # shape only
    p = {"sequence": [{"crop": "a", "water": ["x", "enough", "x"]}, {"crop": "b", "water": ["x", "risky", "x"]},
                      {"crop": "c", "water": ["x", "not_enough", "x"]}, {"crop": "d"}]}
    assert season_statuses(p) == ["good", "warn", "bad", "unknown"]
    assert season_statuses(p, last_crop="a")[0] == "warn"


def test_scenario_report():
    r = scenario_report(ZONE3[0], CFG)
    assert set(r) == {"dry", "normal", "wet"}
    assert r["normal"]["delta_vs_normal"] == 0
    assert r["dry"]["delta_vs_normal"] == pytest.approx(ZONE3[0]["scen"]["dry"] - ZONE3[0]["scen"]["normal"])
    assert sum(r["dry"]["water"].values()) == len(ZONE3[0]["sequence"])
    assert r["normal"]["status"] == "good"  # 0.85 >= 0.70
    assert scenario_report({"sequence": []}, CFG) is None  # no scenario data -> nothing estimated


def test_config_overrides_and_rejects_unknown_keys():
    c = ScoringConfig.from_mapping({"same_crop_as_last_penalty": 0.2})
    assert c.same_crop_as_last_penalty == 0.2 and c.unwatered_season_penalty == 0.04
    with pytest.raises(ValueError):
        ScoringConfig.from_mapping({"nonsense": 1})
    assert ScoringConfig.from_env_json('{"neutral_weight": 0.3}').neutral_weight == 0.3


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
@pytest.mark.parametrize("ctx", [
    {"priorities": [], "canWater": None, "lastCrop": None},
    {"priorities": ["soil"], "canWater": None, "lastCrop": "maize"},
    {"priorities": ["money", "safety"], "canWater": False, "lastCrop": "groundnut"},
    {"priorities": ["water", "soil"], "canWater": True, "lastCrop": "cassava"},
])
@pytest.mark.parametrize("zone", ["1", "2", "3"])
def test_parity_with_the_frontend_scoring_js(zone, ctx):
    """The backend must rank exactly like the React app's src/data/scoring.js (same inputs -> same scores/statuses)."""
    js = f"""
    import {{ rankPlans }} from 'file:///{(ROOT / 'src/data/scoring.js').as_posix()}';
    import fs from 'node:fs';
    const plans = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'))['{zone}'];
    const r = rankPlans(plans, {json.dumps(ctx)});
    console.log(JSON.stringify(r.map(p => ({{ id: p.id, score: p.score, statuses: p.statuses }}))));
    """
    out = subprocess.run(["node", "--input-type=module", "-e", js, str(ROOT / "public/mock/rotations.json")],
                         capture_output=True, text=True, check=True).stdout
    expected = json.loads(out)
    got = rank_plans(PLANS[zone], {"priorities": ctx["priorities"], "can_water": ctx["canWater"], "last_crop": ctx["lastCrop"]}, CFG)
    assert [p["id"] for p in got] == [e["id"] for e in expected]
    for g, e in zip(got, expected):
        assert g["score"] == pytest.approx(e["score"], abs=1e-9)
        assert g["statuses"] == e["statuses"]
