import json
from pathlib import Path

import pytest

from backend.app.schemas import Plan

ROOT = Path(__file__).resolve().parents[2]
DOUALA = {"lat": 4.05, "lon": 9.7}   # mock zone 3
NIAMEY = {"lat": 13.51, "lon": 2.11}  # mock zone 1


def post(client, payload):
    return client.post("/api/rotations", json=payload)


def test_answer_is_a_bare_array_the_frontend_can_map_over(client):
    r = post(client, DOUALA)
    assert r.status_code == 200
    plans = r.get_json()
    assert isinstance(plans, list) and len(plans) == 3
    for p in plans:
        Plan.parse_obj(p)
        assert p["score"] is not None and len(p["statuses"]) == len(p["sequence"])
        assert set(p["scenarios"]) == {"dry", "normal", "wet"}
    assert r.headers["X-Data-Source"] == "mock"


def test_original_fixture_fields_are_untouched(client):
    """S7/S8 read id, kind, sequence, reason, why, warnings, scen from the plan: they must equal the frontend mock."""
    fixture = json.loads((ROOT / "public/mock/rotations.json").read_text(encoding="utf-8"))["3"]
    got = {p["id"]: p for p in post(client, DOUALA).get_json()}
    for f in fixture:
        for key, value in f.items():
            assert got[f["id"]][key] == value, (f["id"], key)


def test_plans_come_best_first(client):
    plans = post(client, {**DOUALA, "priorities": ["soil"]}).get_json()
    scores = [p["score"] for p in plans]
    assert scores == sorted(scores, reverse=True)
    assert plans[0]["id"] == "3-soil"


def test_priorities_change_the_ranking_and_are_explained(client):
    money = post(client, {**DOUALA, "priorities": ["money"]}).get_json()
    soil = post(client, {**DOUALA, "priorities": ["soil"]}).get_json()
    assert money[0]["id"] != soil[0]["id"]
    w = money[0]["breakdown"]["weights"]
    assert w["money"] == 0.55 and w["soil"] == 0.15  # Roadmap section 6 mapping


def test_two_priorities(client):
    plans = post(client, {**DOUALA, "priorities": ["water", "soil"]}).get_json()
    assert plans[0]["breakdown"]["weights"] == {"money": 0.1, "water": 0.4, "soil": 0.4, "safety": 0.1}


def test_last_crop_penalty_applies_to_plans_starting_with_it(client):
    plans = {p["id"]: p for p in post(client, {**DOUALA, "lastCrop": "maize"}).get_json()}
    adj = [a["rule"] for a in plans["3-soil"]["breakdown"]["adjustments"]]
    assert adj == ["same_crop_as_last"]
    assert plans["3-soil"]["statuses"][0] == "warn"
    assert plans["3-safest"]["breakdown"]["adjustments"] == []  # starts with plantain


def test_last_crop_none_means_no_last_crop(client):
    a = post(client, {**DOUALA, "lastCrop": "none"}).get_json()
    b = post(client, DOUALA).get_json()
    assert a == b


def test_cannot_water_lowers_plans_with_water_short_seasons(client):
    base = {p["id"]: p["score"] for p in post(client, NIAMEY).get_json()}
    dry = {p["id"]: p for p in post(client, {**NIAMEY, "canWater": False}).get_json()}
    assert dry["1-money"]["score"] < base["1-money"]
    assert dry["1-money"]["breakdown"]["adjustments"][0]["rule"] == "cannot_water"
    assert dry["1-safest"]["score"] == pytest.approx(base["1-safest"])


def test_fertilizer_answer_is_accepted_and_disclosed_as_unused(client):
    plans = post(client, {**DOUALA, "canBuyFertilizer": False}).get_json()
    assert plans[0]["breakdown"]["ignored_inputs"][0]["input"] == "can_buy_fertilizer"


def test_the_frontends_current_request_shape_works(client):
    # hooks.js posts only {lat, lon}
    assert post(client, {"lat": 4.05, "lon": 9.7}).status_code == 200


def test_unknown_extra_fields_are_ignored(client):
    assert post(client, {**DOUALA, "somethingNew": 1}).status_code == 200


def test_scores_use_configurable_settings(make_app):
    app = make_app(SCORING_CONFIG_JSON='{"same_crop_as_last_penalty": 0.3}')
    plans = {p["id"]: p for p in app.test_client().post("/api/rotations", json={**DOUALA, "lastCrop": "maize"}).get_json()}
    assert plans["3-soil"]["breakdown"]["adjustments"][0]["delta"] == -0.3


@pytest.mark.parametrize("payload", [
    {"lat": 4.05},
    {"lat": "x", "lon": 9.7},
    {**DOUALA, "priorities": ["soil", "water", "money"]},
    {**DOUALA, "priorities": ["luck"]},
    {**DOUALA, "lastCrop": "banana"},
    {**DOUALA, "canWater": "maybe"},
])
def test_bad_input_is_422(client, payload):
    r = post(client, payload)
    assert r.status_code == 422 and r.get_json()["error"] == "invalid_request"


def test_body_must_be_json_object(client):
    assert client.post("/api/rotations", data="nope", content_type="text/plain").status_code == 422
    assert client.post("/api/rotations", json=[1, 2]).status_code == 422


def test_outside_coverage_is_422_with_friendly_message(client):
    r = post(client, {"lat": 48.85, "lon": 2.35})
    assert r.status_code == 422 and r.get_json()["error"] == "outside_coverage"


def test_get_is_not_allowed(client):
    assert client.get("/api/rotations").status_code == 405


def test_results_are_cached_per_request_shape(client):
    assert post(client, DOUALA).headers["X-Cache"] == "miss"
    assert post(client, DOUALA).headers["X-Cache"] == "hit"
    assert post(client, {**DOUALA, "priorities": ["soil"]}).headers["X-Cache"] == "miss"


def test_rate_limit_returns_json_429(make_app):
    c = make_app(RATELIMIT_ENABLED=True, RATELIMIT_ROTATIONS="2 per minute").test_client()
    assert [post(c, DOUALA).status_code for _ in range(3)] == [200, 200, 429]
    assert c.post("/api/rotations", json=DOUALA).is_json


def test_real_mode_without_a_database_says_so(make_app):
    r = make_app(ENGINE_MODE="real").test_client().post("/api/rotations", json=DOUALA)
    assert r.status_code == 503 and r.get_json()["error"] == "database_not_configured"
