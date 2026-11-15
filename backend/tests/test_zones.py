from backend.app import create_app
from backend.app.schemas import ZonesResponse


def test_zones_matches_contract_and_is_labelled_mock(client):
    r = client.get("/api/zones")
    assert r.status_code == 200
    body = ZonesResponse.parse_obj(r.get_json())
    assert body.mock is True
    assert len(body.features) >= 7
    assert {z.id for z in body.zones} == set(range(1, 8))


def test_every_feature_points_at_a_known_zone(client):
    body = ZonesResponse.parse_obj(client.get("/api/zones").get_json())
    known = {z.id for z in body.zones}
    assert all(f.properties.zone_id in known for f in body.features)


def test_zones_shape_is_what_the_frontend_reads(client):
    # S10 reads data.features[i].properties.zone_id and geometry.coordinates as [lon, lat]
    f = client.get("/api/zones").get_json()["features"][0]
    lon, lat = f["geometry"]["coordinates"]
    assert -20 <= lon <= 55 and -36 <= lat <= 38


def test_bbox_filters_points(client):
    all_n = len(client.get("/api/zones").get_json()["features"])
    r = client.get("/api/zones?bbox=5,0,20,15")  # Cameroon-ish window
    assert r.status_code == 200
    feats = r.get_json()["features"]
    assert 0 < len(feats) < all_n
    assert all(5 <= f["geometry"]["coordinates"][0] <= 20 and 0 <= f["geometry"]["coordinates"][1] <= 15 for f in feats)


def test_bbox_that_matches_nothing_returns_empty_not_error(client):
    r = client.get("/api/zones?bbox=100,60,110,70")
    assert r.status_code == 200
    assert r.get_json()["features"] == []


def test_bad_bbox_is_422_with_friendly_message(client):
    for bad in ("abc", "1,2,3", "20,0,5,15", "5,15,20,0"):
        r = client.get(f"/api/zones?bbox={bad}")
        assert r.status_code == 422, bad
        assert r.get_json()["error"] == "invalid_request"


def test_zones_does_not_mutate_shared_mock_between_requests(client):
    client.get("/api/zones?bbox=5,0,20,15")
    assert len(client.get("/api/zones").get_json()["features"]) >= 7


def test_real_mode_returns_501_not_fake_data():
    app = create_app({"TESTING": True, "ENGINE_MODE": "real"})
    r = app.test_client().get("/api/zones")
    assert r.status_code == 503
    assert r.get_json()["error"] == "database_not_configured"


def test_frontend_mock_file_and_backend_mock_file_are_identical():
    # The React app reads public/mock/zones.geojson; the API must serve the same points.
    import json
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    front = json.loads((root / "public/mock/zones.geojson").read_text(encoding="utf-8"))
    back = json.loads((root / "backend/app/mock/zones.geojson").read_text(encoding="utf-8"))
    assert front == back
