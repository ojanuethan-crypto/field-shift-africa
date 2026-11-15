"""DatabaseProvider against a SQLite copy of the real tables (seeded from Ojani's engine/testdata.json) and answers recorded
from the live database functions (tests/fixtures/db_samples.json). No network, no credentials."""
import json
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import models
from backend.app.errors import ApiError
from backend.app.providers import DatabaseProvider
from backend.app.schemas import (StatsResponse, LowPotentialResponse, AdviceIndexResponse, AskResponse, CropsResponse, FaqResponse, Plan, PassportResponse, ProfileResponse, ProofResponse, TwinsResponse,
                                 WindowResponse, ZonesResponse)

ROOT = Path(__file__).resolve().parents[2]
DATA = json.loads((ROOT / "engine" / "testdata.json").read_text(encoding="utf-8"))
SAMPLES = json.loads((Path(__file__).parent / "fixtures" / "db_samples.json").read_text(encoding="utf-8"))
DOUALA = "lat=4.05&lon=9.7"
CELL = 1034


def seed(s):
    d = DATA["cells"]["Douala"]
    f = d["cell"]
    s.add_all([
        models.Zone(zone_id=4, slug="wet-forest", name_en="Wet forest land", name_fr="Terres de forêt humide", desc_en="Very wet.", desc_fr="Très humide.",
                    icon="🌴", color="#2E7D4F", typical_crops=["cocoyam", "plantain", "cassava"]),
        models.Zone(zone_id=8, slug="south", name_en="South", name_fr="Sud", color="#111111", typical_crops=[]),
        models.Zone(zone_id=10, slug="desert", name_en="Desert", name_fr="Désert", color="#F2E3B3", typical_crops=[]),
        models.Cell(cell_id=CELL, lat=4.5, lon=9.5, country="Cameroon", place_name="Douala", zone_id=4),
        models.Cell(cell_id=2175, lat=23.5, lon=12.5, country="Libya", zone_id=10),
        models.CellFeature(cell_id=CELL, rain_annual=f["rain_annual"], n_seasons=f["n_seasons"], ph=f["ph"], soc=f["soc"],
                           hz_drought=f["hz"]["drought"], hz_flood=f["hz"]["flood"], hz_heat=f["hz"]["heat"], hz_erosion=4),
        models.CellFeature(cell_id=2175, rain_annual=3.0, n_seasons=0, ph=None, soc=2.0, hz_drought=4, hz_flood=1, hz_heat=3, hz_erosion=1),
        models.PlantingWindow(cell_id=CELL, season=1, start_month=3, end_month=4, method="rain onset (test)"),
        models.ScoringConfig(key="effective_rain_share", value="0.8"),
        models.ScoringConfig(key="suitability_min", value="0.4"),
        models.PassportNote(note_id=1, kind="method", text_en="Backtest: a hit is a cell flagged during a known event.", text_fr="Test rétrospectif : un succès est une cellule signalée.", sort=1),
        models.PassportNote(note_id=2, kind="limitation", text_en="Other.", text_fr="Autre.", sort=2),
    ])
    for r in d["climate"]:
        s.add(models.ClimateMonthly(cell_id=CELL, **r))
        s.add(models.CellWatchMonth(cell_id=CELL, month=r["month"], is_dry=r["month"] in (1, 2, 12), is_flood=r["month"] in d["floodMonths"], is_heat=False))
    for i in range(1, 13):  # a desert cell with no rain at all
        s.add(models.ClimateMonthly(cell_id=2175, month=i, rain_p20=0, rain_p50=0, rain_p80=0, tmean=30, et0=250))
    for i, c in enumerate(DATA["crops"], 1):
        s.add(models.Crop(crop_id=i, name_en=c["slug"].title(), name_fr=c["slug"].title() + "-fr", emoji="🌱", **c))
    for code, t in DATA["reasons"].items():
        s.add(models.Reason(code=code, text_en=t["en"], text_fr=t["fr"]))
    s.commit()


def rpc(name, **p):
    lat, lon = p.get("p_lat"), p.get("p_lon")
    in_douala = lat is not None and 3 <= lat <= 6 and 8 <= lon <= 11
    in_desert = lat is not None and lat >= 20
    if name == "nearest_cell":
        return CELL if in_douala else 2175 if in_desert else None
    if name == "get_profile":
        return SAMPLES["get_profile_douala"] if in_douala else SAMPLES["get_profile_desert"] if in_desert else SAMPLES["get_profile_outside"]
    if name == "get_twins":
        return SAMPLES["get_twins_douala"]
    return SAMPLES[name]


@pytest.fixture()
def provider():
    engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    models.Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine)
    with factory() as s:
        seed(s)
    return DatabaseProvider(session_factory=factory, rpc=rpc)


@pytest.fixture()
def client(make_app, provider):
    app = make_app(ENGINE_MODE="real")
    app.extensions["provider"] = provider
    return app.test_client()


# ------------------------------------------------------------------ provider level
def test_status_ok_with_a_working_database(provider):
    assert provider.status() == "ok" and provider.name == "database" and not provider.is_mock


def test_zone_lookup(provider):
    assert provider.zone_id_for(4.05, 9.7) == 4
    assert provider.zone_id_for(-30, -10) is None  # nowhere near a cell: unknown, not guessed


def test_unknown_function_names_never_reach_the_database(provider):
    with pytest.raises(ValueError):
        provider._rpc(None, "drop_everything")
    with pytest.raises(ValueError):
        provider._rpc(None, "get_profile", p_lat=1)  # wrong parameters


def test_unreachable_database_is_a_503_without_leaking_the_url():
    db = DatabaseProvider("postgresql://user:TOPSECRET@127.0.0.1:1/db")
    assert db.status() == "unreachable"
    with pytest.raises(ApiError) as e:
        db.zone_id_for(4, 9)
    assert e.value.status == 503 and e.value.code == "database_unavailable" and "TOPSECRET" not in e.value.message


# ------------------------------------------------------------------ endpoints through the real provider
def test_profile_comes_from_the_database(client):
    r = client.get(f"/api/profile?{DOUALA}")
    body = r.get_json()
    ProfileResponse.parse_obj(body)
    assert r.status_code == 200 and "X-Data-Source" not in r.headers and "_mock" not in body
    assert body["zone"]["id"] == 4 and body["zone"]["color"] == "#2E7D4F"
    assert body["rain_p20"][0] == 10 and body["rain_p80"][7] == 478 and body["low_farming_potential"] is False
    assert body["watch_months"] == {"dry": [1, 2, 12], "flood": [6, 7, 8, 9, 10], "heat": []}
    assert body["data_quality"] == "ok"


def test_desert_profile_is_a_desert_state(client):
    r = client.get("/api/profile?lat=23.5&lon=12.5")
    assert r.status_code == 200 and r.get_json() == {"data_quality": "desert"}  # the app shows its desert screen


def test_place_without_a_data_cell_is_a_state_the_app_can_show(client):
    r = client.get("/api/profile?lat=0&lon=-10")  # inside the covered box (open Atlantic), but no cell near it
    assert r.status_code == 200 and r.get_json() == {"data_quality": "no_data"}


def test_zones_are_stripped_to_the_contract(client):
    body = client.get("/api/zones").get_json()
    ZonesResponse.parse_obj(body)
    assert [f["properties"] for f in body["features"]] == [{"zone_id": 8}, {"zone_id": 4}]
    z4 = next(z for z in body["zones"] if z["id"] == 4)
    assert z4["color"] == "#2E7D4F" and z4["description"]["fr"] == "Très humide."
    assert "description" not in next(z for z in body["zones"] if z["id"] == 8)  # none stored: not invented


def test_crops_only_mvp_and_zone_filter(client):
    allc = client.get("/api/crops").get_json()
    CropsResponse.parse_obj(allc)
    ids = {c["id"] for c in allc["crops"]}
    assert len(ids) == 12 and "teff" not in ids and "maize" in ids
    z4 = {c["id"] for c in client.get("/api/crops?zone_id=4").get_json()["crops"]}
    assert z4 == {"cocoyam", "plantain", "cassava"}
    assert {c["id"] for c in client.get("/api/crops?zone_id=8").get_json()["crops"]} == ids  # no typical crops stored: all
    maize = next(c for c in allc["crops"] if c["id"] == "maize")
    assert maize["family"] == "Poaceae" and maize["season_length"] == 120 and maize["legume"] is False


def test_rotations_are_generated_scored_and_explained(client):
    r = client.post("/api/rotations", json={"lat": 4.05, "lon": 9.7, "priorities": ["soil"]})
    plans = r.get_json()
    assert r.status_code == 200 and len(plans) == 3
    for p in plans:
        Plan.parse_obj(p)
        assert p["breakdown"]["weights"]["soil"] == 0.55 and p["scenarios"] and "code" not in p["why"][0]
    assert [p["score"] for p in plans] == sorted((p["score"] for p in plans), reverse=True)
    assert {p["kind"] for p in plans} == {"safest", "soil", "money"}
    assert all(s["crop"] != "tomato" for p in plans for s in p["sequence"])  # flood-intolerant crop excluded here


def test_farmer_answers_reach_the_generator(client):
    after_maize = client.post("/api/rotations", json={"lat": 4.05, "lon": 9.7, "lastCrop": "maize"}).get_json()
    assert all(p["sequence"][0]["crop"] not in {"maize", "sorghum", "millet", "rice"} for p in after_maize)  # not the same family first
    dry = client.post("/api/rotations", json={"lat": 4.05, "lon": 9.7, "canWater": False}).get_json()
    wet = client.post("/api/rotations", json={"lat": 4.05, "lon": 9.7, "canWater": True}).get_json()
    assert {p["id"]: p["sub"]["water"] for p in dry} != {p["id"]: p["sub"]["water"] for p in wet}  # irrigation changes water fit


def test_desert_gets_no_plans_but_a_state_the_app_can_show(client):
    r = client.post("/api/rotations", json={"lat": 23.5, "lon": 12.5})
    body = r.get_json()
    LowPotentialResponse.parse_obj(body)
    assert r.status_code == 200 and body == {"low_potential": True, "state": "desert", "plans": []}  # nothing made up


def test_place_with_no_data_cell_gets_the_no_data_state(client):
    r = client.post("/api/rotations", json={"lat": 0.0, "lon": -10.0})  # open Atlantic, inside the covered box
    assert r.status_code == 200 and r.get_json() == {"low_potential": True, "state": "no_data", "plans": []}


def test_explain_works_on_database_plans(client):
    pid = client.post("/api/rotations", json={"lat": 4.05, "lon": 9.7}).get_json()[0]["id"]
    r = client.post("/api/explain", json={"lat": 4.05, "lon": 9.7, "plan_id": pid})
    assert r.status_code == 200 and r.get_json()["source"] == "template" and "_mock" not in r.get_json()


def test_twins_below_the_display_threshold_are_dropped(client):
    body = client.get(f"/api/twins?{DOUALA}").get_json()
    TwinsResponse.parse_obj(body)
    assert [t["name"] for t in body["twins"]] == ["Gabon", "Dem. Rep. Congo"] and body["origin"]["zone_id"] == 4
    assert [t["name"] for t in client.get(f"/api/twins?{DOUALA}&n=1").get_json()["twins"]] == ["Gabon"]


def test_window_from_the_table(client):
    body = client.get(f"/api/window?{DOUALA}").get_json()
    WindowResponse.parse_obj(body)
    assert (body["start_month"], body["end_month"], body["method"]) == (3, 4, "rain onset (test)")
    assert "March" in body["text"]["en"] and "mars" in body["text"]["fr"]


def test_window_missing_is_a_404_not_a_guess(client):
    assert client.get("/api/window?lat=23.5&lon=12.5").status_code == 404  # desert cell has no window row


def test_passport_maps_sources_and_limits(client):
    body = client.get(f"/api/passport?{DOUALA}").get_json()
    PassportResponse.parse_obj(body)
    row = body["rows"][0]
    assert row["variable"] == {"en": "Rainfall", "fr": "Pluie"} and row["value"] is None and row["dataset"].startswith("NASA POWER")
    assert len(body["limits"]) == 2 and body["validation"]["methods"] and body["validation"]["scoring_config"]
    assert row["how"].startswith("Monthly mm/day") and row["caveat"] and row["licence"] == "NASA open data policy" and row["url"].startswith("https://power")
    assert client.get("/api/passport").get_json() == body  # no place needed: same answer


def test_proof_shows_the_misses(client):
    body = client.get("/api/proof").get_json()
    ProofResponse.parse_obj(body)
    by_id = {e["id"]: e for e in body["events"]}
    assert by_id["horn_2010_11"]["hit_rate"] == 0.57 and by_id["horn_2010_11"]["baseline"] == 0.17 and by_id["horn_2010_11"]["status"] == "above_chance"
    assert by_id["horn_2010_11"]["misses"] == 57 and by_id["horn_2010_11"]["cells_total"] == 134
    assert by_id["horn_2020_22"]["status"] == "miss" and "MISS" in by_id["horn_2020_22"]["misses_note"]["en"]
    assert body["ndvi_correlation"] is None and body["notes"]["en"].startswith("Backtest")


def test_faq_points_each_question_at_its_passage_in_the_requested_language(client):
    en = client.get("/api/faq?lang=en").get_json()
    FaqResponse.parse_obj(en)
    assert [(i["id"], i["passage"]) for i in en["items"]] == [("f1", "18"), ("f8", "55"), ("f10", "132"), ("f11", "34")]  # f3 has no passage
    assert all(i["status"] == "draft" and i["q"]["fr"] for i in en["items"])  # drafts are labelled, questions stay bilingual
    fr = client.get("/api/faq?lang=fr").get_json()
    assert [(i["id"], i["passage"]) for i in fr["items"]] == [("f1", "149"), ("f8", "175")]  # only questions answerable in French


@pytest.mark.parametrize("lang", ["en", "fr"])
def test_every_faq_passage_exists_in_the_index_for_that_language(client, lang):
    ids = {p["id"] for p in client.get(f"/api/advice-index?lang={lang}").get_json()["passages"]}
    assert ids and all(i["passage"] in ids for i in client.get(f"/api/faq?lang={lang}").get_json()["items"])


def test_advice_index_is_one_language_per_passage_and_never_translated(client):
    everything = client.get("/api/advice-index").get_json()
    AdviceIndexResponse.parse_obj(everything)
    assert len(everything["passages"]) == 7 and everything["version"] == "20261115"
    fr = client.get("/api/advice-index?lang=fr").get_json()["passages"]
    assert {p["id"] for p in fr} == {"149", "175"}
    assert all(set(p["text"]) == {"fr"} and p["lang"] == "fr" and set(p["keywords"]) == {"fr"} for p in fr)  # no invented English
    en = client.get("/api/advice-index?lang=en").get_json()["passages"]
    assert all(set(p["text"]) == {"en"} and p["licence"] and p["source_url"].startswith("https://fao.org") for p in en)
    assert client.get("/api/advice-index?lang=de").status_code == 422


def test_ask_answers_from_the_real_passages_and_cites_them(client):
    r = client.post("/api/ask", json={"question": "Pests are in my field", "lang": "en"})
    body = r.get_json()
    AskResponse.parse_obj(body)
    assert r.status_code == 200 and body["mode"] == "search" and "_mock" not in body
    src = body["sources"][0]
    assert src["id"] == "55" and src["page"] == 17 and src["licence"].startswith("FAO") and src["source_url"].endswith("i2215e03.pdf")
    passage = next(p for p in client.get("/api/advice-index?lang=en").get_json()["passages"] if p["id"] == "55")["text"]["en"]
    assert body["answer"] in passage and len(body["answer"]) < len(passage)  # the best sentences, copied, nothing added


def test_ask_in_french_uses_french_passages(client):
    body = client.post("/api/ask", json={"question": "Des ravageurs dans mon champ", "lang": "fr"}).get_json()
    assert body["mode"] == "search" and body["sources"][0]["id"] == "175" and "ravageurs" in body["answer"]


def test_ask_does_not_answer_in_a_language_with_no_passage_on_the_topic(client):
    # the mulch passage exists in English only: a French question about it gets an honest "no answer", not a translation
    assert client.post("/api/ask", json={"question": "Comment faire du paillage mulch", "lang": "fr"}).get_json()["mode"] == "none"


def test_ask_with_no_match_says_so(client):
    body = client.post("/api/ask", json={"question": "who won the football match", "lang": "en"}).get_json()
    assert body["mode"] == "none" and body["answer"] is None and body["sources"] == []


def test_ask_model_is_grounded_in_the_real_passages(make_app, provider):
    from backend.app.services.llm import LLM
    from backend.tests.test_ask_explain_llm import FakeClient

    fake = FakeClient("Pests live in the field naturally. Ask a local agronomist.")
    app = make_app(ENGINE_MODE="real")
    app.extensions["provider"] = provider
    app.extensions["llm"] = LLM(None, "m", 1, 50, client=fake)
    body = app.test_client().post("/api/ask", json={"question": "Pests are in my field", "lang": "en"}).get_json()
    assert body["mode"] == "llm" and body["sources"][0]["licence"]
    prompt = fake.calls[0]["messages"][0]["content"]
    assert "Plant pests are often regarded" in prompt and "football" not in prompt  # it saw the passage, not the web


def test_faq_and_ask_without_a_database_say_so(make_app):
    c = make_app(ENGINE_MODE="real").test_client()
    for r in (c.get("/api/faq?lang=en"), c.get("/api/advice-index"), c.post("/api/ask", json={"question": "floods"})):
        assert r.status_code == 503 and r.get_json()["error"] == "database_not_configured"


def test_health_reports_ok(client):
    assert client.get("/api/health").get_json()["db"] == "ok"


# ------------------------------------------------------------------ anonymous counts are stored in the database
def rows(provider, model):
    with provider._session() as s:
        return [tuple(getattr(r, c) for c in cols) for r in s.query(model).all() for cols in [[c.name for c in model.__table__.columns if c.name != "id"]]]


def test_thumbs_are_stored_with_the_values_the_database_accepts(client, provider):
    assert client.post("/api/feedback", json={"target": "advisor-answer", "value": "up", "lang": "fr"}).status_code == 200
    assert client.post("/api/feedback", json={"target": "plan", "value": "down", "zone": 4}).status_code == 200
    assert rows(provider, models.Feedback) == [("answer", 1, None, "fr"), ("plan", -1, 4, None)]


def test_events_are_stored_and_unknown_ones_are_only_counted_in_memory(client, provider):
    assert client.post("/api/event", json={"name": "plan_viewed", "zone": 4}).status_code == 200
    assert client.post("/api/event", json={"name": "made_up_event"}).status_code == 200  # the farmer never sees an error
    assert rows(provider, models.UsageEvent) == [("plan_viewed", 4)]
    assert provider.record_event("made_up_event") is False and provider.record_feedback("nonsense", "up") is False


def test_only_counts_are_stored_no_free_text_no_coordinates(client, provider):
    client.post("/api/feedback", json={"target": "plan", "value": "up", "note": "my name is Ada", "lat": 4.05, "lon": 9.7})
    assert [c.name for c in models.Feedback.__table__.columns] == ["id", "target", "value", "zone_id", "lang"]
    assert rows(provider, models.Feedback) == [("plan", 1, None, None)]


def test_stats_read_from_the_database(client, provider):
    for target, v in (("plan", "up"), ("plan", "up"), ("plan", "down"), ("advisor-answer", "up")):
        client.post("/api/feedback", json={"target": target, "value": v})
    client.post("/api/event", json={"name": "visit"})
    client.post("/api/event", json={"name": "visit", "zone": 4})
    body = client.get("/api/stats").get_json()
    StatsResponse.parse_obj(body)
    assert body["storage"] == "database"
    assert body["feedback"] == {"plan": {"up": 2, "down": 1}, "answer": {"up": 1, "down": 0}}
    assert body["events"] == {"visit": {"none": 1, "4": 1}}


def test_a_database_outage_never_breaks_a_thumb(make_app):
    app = make_app(ENGINE_MODE="real", DATABASE_URL="postgresql://u:TOPSECRET@127.0.0.1:1/db")
    c = app.test_client()
    r = c.post("/api/feedback", json={"target": "plan", "value": "up"})
    assert r.status_code == 200 and r.get_json() == {"ok": True}
    assert c.post("/api/event", json={"name": "visit"}).status_code == 200
    stats = c.get("/api/stats").get_json()
    assert stats["storage"].startswith("memory") and stats["feedback"]["plan"]["up"] == 1  # still counted, honestly labelled


def test_mock_mode_stores_nothing_durably(client_mock):
    assert client_mock.post("/api/feedback", json={"target": "plan", "value": "up"}).status_code == 200
    assert client_mock.get("/api/stats").get_json()["storage"].startswith("memory")


@pytest.fixture()
def client_mock(make_app):
    return make_app().test_client()
