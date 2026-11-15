"""Provider seam, fixture contracts, engine independence, cache and the not-yet-connected database."""
import inspect
import json
import re
from pathlib import Path

import pytest

from backend.app import create_app
from backend.app.providers import DatabaseProvider, MockProvider, build_provider
from backend.app.providers.base import DataProvider
from backend.app.providers.database import REQUIRED_FROM_OKANI
from backend.app.errors import ApiError, SchemaPending
from backend.app.schemas import (Crop, FaqItem, Passage, PassportRow, PlanFixture, ProfileData, ProofEvent, Twin, ZoneFeature, ZoneMeta)
from backend.app.services.cache import Cache

ROOT = Path(__file__).resolve().parents[2]
MOCK = ROOT / "backend/app/mock"
load = lambda name: json.loads((MOCK / name).read_text(encoding="utf-8"))
real_keys = lambda d: {k: v for k, v in d.items() if not k.startswith("_")}


# ---------------------------------------------------------------- fixtures obey the contract
def test_every_mock_fixture_matches_its_schema():
    for zone, p in real_keys(load("profiles.json")).items():
        ProfileData.parse_obj(p)
    for zone, plans in real_keys(load("rotations.json")).items():
        assert len(plans) == 3
        for p in plans:
            PlanFixture.parse_obj(p)
    for t in load("twins.json")["twins"]:
        Twin.parse_obj(t)
    for f in load("zones.geojson")["features"]:
        ZoneFeature.parse_obj(f)
    for z in load("zones_meta.json")["zones"]:
        ZoneMeta.parse_obj(z)
    for c in load("crops.json")["crops"]:
        Crop.parse_obj(c)
    for i in load("faq.json")["items"]:
        FaqItem.parse_obj(i)
    for p in load("advice-index.json")["passages"]:
        Passage.parse_obj(p)
    for r in load("passport.json")["rows"]:
        PassportRow.parse_obj(r)
    for e in load("proof.json")["events"]:
        ProofEvent.parse_obj(e)


def test_every_fixture_file_says_it_is_mock_or_fixture():
    for name in ("profiles.json", "rotations.json", "twins.json", "watch.json", "zones.geojson", "zones_meta.json",
                 "crops.json", "passport.json", "proof.json", "faq.json", "advice-index.json"):
        note = json.dumps(load(name))[:600].lower()
        assert "mock" in note or "fixture" in note or "placeholder" in note, name


@pytest.mark.parametrize("name", ["zones.geojson", "profiles.json", "rotations.json", "twins.json", "watch.json", "faq.json", "advice-index.json"])
def test_backend_fixtures_match_the_frontend_mock_files(name):
    """DRIFT ALARM: if a teammate edits public/mock/<file>, run backend/scripts/sync_mocks.py to refresh the copy."""
    assert json.loads((ROOT / "public/mock" / name).read_text(encoding="utf-8")) == load(name)


# ---------------------------------------------------------------- the provider seam
def test_both_providers_implement_the_whole_interface():
    abstract = {n for n, m in inspect.getmembers(DataProvider) if getattr(m, "__isabstractmethod__", False)}
    assert abstract  # sanity
    for cls in (MockProvider, DatabaseProvider):
        assert not (abstract - {n for n, _ in inspect.getmembers(cls)}), cls
        assert not getattr(cls, "__abstractmethods__", None), cls


def test_database_provider_documents_what_it_needs_from_okani_for_every_data_method():
    data_methods = {n for n, m in inspect.getmembers(DataProvider) if getattr(m, "__isabstractmethod__", False)} - {"status"}
    assert data_methods == set(REQUIRED_FROM_OKANI)
    assert all(len(v) > 10 for v in REQUIRED_FROM_OKANI.values())


def test_database_provider_without_a_url_returns_no_records_and_never_invents_any():
    db = DatabaseProvider(None)
    calls = {"zone_id_for": (1, 1), "zones_geojson": (), "profile": (1, 1), "watch_months": (1, 1), "crops": (None,),
             "candidate_plans": (1, 1), "twins": (1, 1, 5), "planting_window": (1, 1), "passport": (1, 1), "proof": ()}
    calls.update({"faq": ("en",), "advice_index": ()})
    assert set(calls) == set(REQUIRED_FROM_OKANI)
    for name, args in calls.items():
        with pytest.raises(ApiError) as e:
            getattr(db, name)(*args)
        assert e.value.status == 503 and e.value.code == "database_not_configured"



def test_database_url_is_never_exposed(make_app):
    app = make_app(ENGINE_MODE="real", DATABASE_URL="postgresql://user:TOPSECRET@host/db")
    c = app.test_client()
    for url in ("/api/health", "/api/zones", "/api/profile?lat=4&lon=9"):
        assert "TOPSECRET" not in c.get(url).get_data(as_text=True)


def test_real_mode_without_a_database_answers_503_and_never_fake_data(make_app):
    c = make_app(ENGINE_MODE="real").test_client()
    gets = ["/api/zones", "/api/profile?lat=4&lon=9", "/api/twins?lat=4&lon=9", "/api/window?lat=4&lon=9", "/api/crops",
            "/api/passport?lat=4&lon=9", "/api/proof"]
    for url in gets:
        r = c.get(url)
        assert r.status_code == 503 and r.get_json()["error"] == "database_not_configured", url
        assert "X-Data-Source" not in r.headers, url
    assert c.post("/api/rotations", json={"lat": 4, "lon": 9}).status_code == 503
    for r in (c.get("/api/faq"), c.get("/api/advice-index"), c.post("/api/ask", json={"question": "floods"})):
        assert r.status_code == 503 and r.get_json()["error"] == "database_not_configured"
    assert c.get("/api/health").status_code == 200  # health itself still works


def test_unknown_engine_mode_is_rejected():
    with pytest.raises(ValueError):
        build_provider({"ENGINE_MODE": "oracle"})
    with pytest.raises(ValueError):
        create_app({"ENGINE_MODE": "oracle"})


def test_mock_provider_gives_nothing_it_does_not_have():
    p = MockProvider()
    assert p.watch_months(10.59, 14.32) is None  # no fixture for zone 2
    assert p.twins(10.59, 14.32, 5)["twins"] == []
    assert p.candidate_plans(4.05, 9.7) and p.profile(4.05, 9.7)


# ---------------------------------------------------------------- the engine stays database-independent
def test_engine_package_imports_no_flask_database_or_provider_code():
    forbidden = re.compile(r"^\s*(from|import)\s+(flask|sqlalchemy|pydantic|diskcache|httpx|\.\.providers|\.\.services|backend\.app\.(providers|services|models))", re.M)
    for f in (ROOT / "backend/app/engine").glob("*.py"):
        assert not forbidden.search(f.read_text(encoding="utf-8")), f.name


# ---------------------------------------------------------------- cache
def test_memory_cache_hits_expires_and_does_not_cache_errors():
    c = Cache("memory")
    n = {"calls": 0}

    def produce():
        n["calls"] += 1
        return {"v": n["calls"]}

    assert c.get_or_set("k", produce, 60) == ({"v": 1}, False)
    assert c.get_or_set("k", produce, 60) == ({"v": 1}, True)
    assert c.get_or_set("expired", produce, 0)[1] is False and c.get_or_set("expired", produce, 0)[1] is False

    def boom():
        raise RuntimeError("x")

    with pytest.raises(RuntimeError):
        c.get_or_set("err", boom, 60)
    assert c.get_or_set("err", lambda: {"ok": 1}, 60) == ({"ok": 1}, False)  # the failure was not remembered


def test_disk_cache_survives_a_new_app(make_app, tmp_path):
    cfg = {"CACHE_BACKEND": "disk", "CACHE_DIR": str(tmp_path / "c")}
    first = make_app(**cfg).test_client().get("/api/profile?lat=4.05&lon=9.7")
    second = make_app(**cfg).test_client().get("/api/profile?lat=4.05&lon=9.7")  # a "restarted" server
    assert first.headers["X-Cache"] == "miss" and second.headers["X-Cache"] == "hit"
    assert first.get_json() == second.get_json()


def test_bad_cache_backend_is_rejected():
    with pytest.raises(ValueError):
        Cache("redis")


def test_cache_is_separate_per_provider_mode(make_app, tmp_path):
    cfg = {"CACHE_BACKEND": "disk", "CACHE_DIR": str(tmp_path / "c2")}
    make_app(**cfg).test_client().get("/api/profile?lat=4.05&lon=9.7")  # fills the cache in mock mode
    real = make_app(ENGINE_MODE="real", **cfg).test_client().get("/api/profile?lat=4.05&lon=9.7")
    assert real.status_code == 503  # a mock answer must never leak into real mode through the cache


# ---------------------------------------------------------------- response contract guard
def test_a_wrong_shaped_provider_answer_becomes_a_500_not_bad_data(make_app):
    app = make_app()
    app.extensions["provider"].profile = lambda lat, lon: {"zone": "not-an-object"}
    r = app.test_client().get("/api/profile?lat=4.05&lon=9.7")
    assert r.status_code == 500 and r.get_json() == {"error": "internal", "message": "Please try again."}
