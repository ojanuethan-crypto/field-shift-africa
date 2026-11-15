import json
from pathlib import Path

import pytest

from backend.app.schemas import OutsideResponse, ProfileResponse

ROOT = Path(__file__).resolve().parents[2]
DOUALA = "lat=4.05&lon=9.7"      # mock zone 3 (latitude band)
MAROUA = "lat=10.59&lon=14.32"   # mock zone 2
NIAMEY = "lat=13.51&lon=2.11"    # mock zone 1


def get(client, qs):
    return client.get(f"/api/profile?{qs}")


def test_douala_matches_contract_and_has_watch_months(client):
    r = get(client, DOUALA)
    assert r.status_code == 200
    body = r.get_json()
    ProfileResponse.parse_obj(body)
    assert body["zone"]["id"] == 3 and body["_mock"] is True and body["data_quality"] == "mock"
    assert body["watch_months"] == {"dry": [12, 1, 2], "flood": [7, 8, 9], "heat": [2, 3]}
    assert r.headers["X-Data-Source"] == "mock"


@pytest.mark.parametrize("qs,zone", [(DOUALA, 3), (MAROUA, 2), (NIAMEY, 1)])
def test_every_mock_zone_serves_the_frontend_fields_unchanged(client, qs, zone):
    """S3 reads zone, description, hazards, rain_p50, soil: they must equal the frontend's own mock entry."""
    fixture = json.loads((ROOT / "public/mock/profiles.json").read_text(encoding="utf-8"))[str(zone)]
    body = get(client, qs).get_json()
    for key, value in fixture.items():
        assert body[key] == value, key


def test_zones_without_watch_month_data_say_so_instead_of_inventing(client):
    body = get(client, MAROUA).get_json()
    assert body["watch_months"] is None
    assert body["data_quality"] == "mock"
    ProfileResponse.parse_obj(body)


def test_outside_the_covered_area_returns_outside_true(client):
    r = get(client, "lat=48.85&lon=2.35")  # Paris
    assert r.status_code == 200
    body = r.get_json()
    OutsideResponse.parse_obj(body)
    assert body["outside"] is True and set(body["message"]) == {"en", "fr"}


def test_coordinates_are_rounded_for_caching(client):
    first = get(client, "lat=4.051&lon=9.701")
    second = get(client, "lat=4.054&lon=9.704")
    assert first.headers["X-Cache"] == "miss"
    assert second.headers["X-Cache"] == "hit"  # same 2-decimal cell
    assert first.get_json() == second.get_json()


def test_cached_answers_are_not_shared_mutable_state(client):
    a = get(client, DOUALA).get_json()
    a["hazards"]["drought"] = 99
    assert get(client, DOUALA).get_json()["hazards"]["drought"] != 99


@pytest.mark.parametrize("qs", ["", "lat=4", "lon=9", "lat=abc&lon=9", "lat=91&lon=9", "lat=4&lon=181", "lat=nan&lon=9", "lat=4&lon=9&lang=de"])
def test_bad_input_is_422_json(client, qs):
    r = get(client, qs)
    assert r.status_code == 422, qs
    assert r.get_json()["error"] == "invalid_request"


def test_lang_param_is_accepted(client):
    assert get(client, DOUALA + "&lang=fr").status_code == 200


def test_real_mode_without_a_database_says_so(make_app):
    r = make_app(ENGINE_MODE="real").test_client().get(f"/api/profile?{DOUALA}")
    assert r.status_code == 503 and r.get_json()["error"] == "database_not_configured"
    assert "X-Data-Source" not in r.headers
