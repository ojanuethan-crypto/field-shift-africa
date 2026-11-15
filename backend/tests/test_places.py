"""Tests for /api/twins, /api/window, /api/crops, /api/passport and /api/proof."""
import json
from pathlib import Path

from backend.app.schemas import CropsResponse, PassportResponse, ProofResponse, TwinsResponse, WindowResponse

ROOT = Path(__file__).resolve().parents[2]
DOUALA = "lat=4.05&lon=9.7"
MAROUA = "lat=10.59&lon=14.32"
NIAMEY = "lat=13.51&lon=2.11"
PARIS = "lat=48.85&lon=2.35"


# ---------------------------------------------------------------- twins
def test_twins_for_douala_match_contract(client):
    r = client.get(f"/api/twins?{DOUALA}")
    assert r.status_code == 200
    body = r.get_json()
    TwinsResponse.parse_obj(body)
    assert len(body["twins"]) == 4 and body["_mock"] is True
    assert body["origin"] == {"lat": 4.05, "lon": 9.7, "name": None, "zone_id": 3}
    assert all(0 <= t["similarity"] <= 1 for t in body["twins"])


def test_twins_n_limits_and_rounds_origin(client):
    body = client.get("/api/twins?lat=4.0549&lon=9.7011&n=2").get_json()
    assert len(body["twins"]) == 2
    assert body["origin"]["lat"] == 4.05 and body["origin"]["lon"] == 9.7


def test_twins_without_fixture_for_the_zone_are_empty_not_invented(client):
    body = client.get(f"/api/twins?{MAROUA}").get_json()
    TwinsResponse.parse_obj(body)
    assert body["twins"] == [] and "mock" in body["note"].lower()


def test_twins_bad_input(client):
    assert client.get(f"/api/twins?{PARIS}").status_code == 422
    assert client.get(f"/api/twins?{DOUALA}&n=0").status_code == 422
    assert client.get(f"/api/twins?{DOUALA}&n=99").status_code == 422
    assert client.get("/api/twins").status_code == 422


# ---------------------------------------------------------------- window
def test_window_douala(client):
    r = client.get(f"/api/window?{DOUALA}")
    assert r.status_code == 200
    body = r.get_json()
    WindowResponse.parse_obj(body)
    assert (body["start_month"], body["end_month"]) == (3, 3)
    assert body["text"] == {"en": "Planting usually starts in: March", "fr": "Les semis commencent en général en : mars"}
    assert "not computed from rainfall" in body["method"]  # honest about being a mock


def test_window_other_zones(client):
    assert client.get(f"/api/window?{NIAMEY}").get_json()["start_month"] == 6
    assert client.get(f"/api/window?{MAROUA}").get_json()["start_month"] == 5


def test_window_is_never_called_a_forecast(client):
    text = client.get(f"/api/window?{DOUALA}").get_json()["text"]["en"]
    assert "forecast" not in text.lower() and "usually" in text


def test_window_outside_and_invalid(client):
    assert client.get(f"/api/window?{PARIS}").status_code == 422
    assert client.get("/api/window?lat=1").status_code == 422


# ---------------------------------------------------------------- crops
def test_all_crops(client):
    body = client.get("/api/crops").get_json()
    CropsResponse.parse_obj(body)
    assert len(body["crops"]) == 12 and body["zone_id"] is None and body["_mock"] is True


def test_crops_do_not_invent_unknown_attributes(client):
    for c in client.get("/api/crops").get_json()["crops"]:
        assert c["family"] is None and c["season_length"] is None  # unknown stays unknown


def test_crops_by_zone_only_lists_crops_in_that_zone_s_mock_plans(client):
    ids = {c["id"] for c in client.get("/api/crops?zone_id=3").get_json()["crops"]}
    assert ids == {"plantain", "groundnut", "cassava", "maize", "cocoyam", "tomato"}


def test_every_crop_used_in_a_mock_plan_exists_in_the_crop_list(client):
    """The React app does CROPS[step.crop][lang]: an unknown id would crash it."""
    known = {c["id"] for c in client.get("/api/crops").get_json()["crops"]}
    plans = json.loads((ROOT / "backend/app/mock/rotations.json").read_text(encoding="utf-8"))
    used = {s["crop"] for z, ps in plans.items() if not z.startswith("_") for p in ps for s in p["sequence"]}
    assert used <= known


def test_crop_legume_flags_match_the_frontend_table(client):
    import subprocess

    js = (f"import {{ CROPS }} from 'file:///{(ROOT / 'src/data/crops.js').as_posix()}';"
          "console.log(JSON.stringify(Object.fromEntries(Object.entries(CROPS).map(([k,v])=>[k,[v.legume,v.en,v.fr,v.emoji]]))))")
    try:
        front = json.loads(subprocess.run(["node", "--input-type=module", "-e", js], capture_output=True, text=True, encoding="utf-8", check=True).stdout)
    except (FileNotFoundError, subprocess.CalledProcessError):
        import pytest
        pytest.skip("node not available")
    got = {c["id"]: [c["legume"], c["name"]["en"], c["name"]["fr"], c["emoji"]] for c in client.get("/api/crops").get_json()["crops"]}
    assert got == front


def test_crops_bad_zone(client):
    assert client.get("/api/crops?zone_id=0").status_code == 422
    assert client.get("/api/crops?zone_id=x").status_code == 422
    assert client.get("/api/crops?zone_id=99").get_json()["crops"] == []


# ---------------------------------------------------------------- passport
def test_passport_matches_contract_and_has_no_fabricated_values(client):
    r = client.get(f"/api/passport?{DOUALA}")
    assert r.status_code == 200
    body = r.get_json()
    PassportResponse.parse_obj(body)
    assert len(body["rows"]) >= 6
    for row in body["rows"]:
        assert row["value"] is None and row["accessed"] is None and row["status"] == "planned"
    assert body["validation"]["status"] == "not_computed"
    assert len(body["limits"]) >= 5


def test_passport_names_the_planned_nasa_datasets(client):
    datasets = {r["dataset"] for r in client.get(f"/api/passport?{DOUALA}").get_json()["rows"]}
    assert {"NASA POWER (AG community)", "GPM IMERG", "SMAP", "MODIS / VIIRS NDVI"} <= datasets


def test_passport_does_not_need_a_place(client):
    r = client.get("/api/passport")  # the Passport is about the data, not one place
    assert r.status_code == 200 and r.get_json()["rows"]
    assert client.get("/api/passport?lat=999&lon=0").status_code == 422  # but a bad place is still rejected


# ---------------------------------------------------------------- proof
def test_proof_matches_contract_and_has_no_fabricated_results(client):
    body = client.get("/api/proof").get_json()
    ProofResponse.parse_obj(body)
    assert len(body["events"]) == 5 and body["ndvi_correlation"] is None
    for e in body["events"]:
        assert e["hit_rate"] is None and e["baseline"] is None and e["status"] == "not_computed"
