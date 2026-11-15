"""Backend Guide compliance: guide-style request forms, explain by plan object, caching, deployment pieces, NASA client."""
import json
import subprocess
import sys
from pathlib import Path

import httpx
import pytest

from backend.app.services import nasa_power
from backend.app.services.cache import Cache
from backend.app.services.llm import LLM
from backend.tests.test_ask_explain_llm import FakeClient

ROOT = Path(__file__).resolve().parents[1]
DOUALA = {"lat": 4.05, "lon": 9.70}


def post(client, body):
    return client.post("/api/rotations", json={**DOUALA, **body})


# ------------------------------------------------------------------ goals / constraints (guide sections 3-4)
def test_guide_style_request_is_accepted(client):
    r = post(client, {"lang": "fr", "goals": {"income": 0.5, "water": 0.1, "soil": 0.2, "resilience": 0.2},
                      "constraints": {"irrigation": True, "fertilizer": True, "short_season": False}})
    assert r.status_code == 200 and len(r.get_json()) >= 3


def test_goals_are_normalised_to_sum_to_one(client):
    plan = post(client, {"goals": {"income": 0.5, "water": 0.5, "soil": 0, "resilience": 1}}).get_json()[0]
    w = plan["breakdown"]["weights"]
    assert abs(sum(w.values()) - 1) < 1e-9
    assert w["money"] == pytest.approx(0.25) and w["safety"] == pytest.approx(0.5) and w["soil"] == 0


def test_goals_change_the_ranking_weights(client):
    money = post(client, {"goals": {"income": 1, "water": 0, "soil": 0, "resilience": 0}}).get_json()[0]
    safety = post(client, {"goals": {"income": 0, "water": 0, "soil": 0, "resilience": 1}}).get_json()[0]
    assert money["breakdown"]["weights"]["money"] == 1 and safety["breakdown"]["weights"]["safety"] == 1


def test_default_goals_equal_the_neutral_weights(client):
    a = post(client, {"goals": {}}).get_json()
    b = post(client, {}).get_json()
    assert [p["score"] for p in a] == [p["score"] for p in b]


@pytest.mark.parametrize("goals", [
    {"income": 0, "water": 0, "soil": 0, "resilience": 0},
    {"income": 1.5}, {"water": -0.1}, {"soil": "lots"},
])
def test_bad_goals_are_422(client, goals):
    assert post(client, {"goals": goals}).status_code == 422


def test_irrigation_false_maps_to_cannot_water(client):
    north = {"lat": 13.0, "lon": 2.0}
    plans = client.post("/api/rotations", json={**north, "constraints": {"irrigation": False}}).get_json()
    assert any(a["rule"] == "cannot_water" for p in plans for a in p["breakdown"]["adjustments"])


def test_unspecified_constraints_penalise_nothing(client):
    plans = post(client, {"constraints": {"short_season": True}}).get_json()  # short_season: accepted, no effect
    assert all(not p["breakdown"]["adjustments"] for p in plans)


def test_explicit_can_water_beats_constraints(client):
    north = {"lat": 13.0, "lon": 2.0}
    plans = client.post("/api/rotations", json={**north, "canWater": True, "constraints": {"irrigation": False}}).get_json()
    assert all(not any(a["rule"] == "cannot_water" for a in p["breakdown"]["adjustments"]) for p in plans)


# ------------------------------------------------------------------ explain (guide section 3/6)
def test_explain_accepts_a_plan_object(client):
    plan = post(client, {}).get_json()[0]
    r = client.post("/api/explain", json={"plan": plan, "lang": "fr"})
    assert r.status_code == 200 and r.get_json()["source"] == "template"


@pytest.mark.parametrize("lang,ending", [("en", "Ask a local agronomist."), ("fr", "Demandez à un agronome local.")])
def test_template_always_ends_with_the_agronomist_line(client, lang, ending):
    plan = post(client, {}).get_json()[0]
    assert client.post("/api/explain", json={"plan": plan, "lang": lang}).get_json()["text"].endswith(ending)


def test_explain_needs_a_plan_or_an_id(client):
    assert client.post("/api/explain", json={"lang": "en"}).status_code == 422
    assert client.post("/api/explain", json={"plan_id": "3-safest"}).status_code == 422  # id without a place


def test_explain_rejects_a_malformed_plan_object(client):
    assert client.post("/api/explain", json={"plan": {"id": "x"}}).status_code == 422


def test_model_text_is_cached_by_plan_and_language(make_app):
    fake = FakeClient("Plant in March.")
    app = make_app()
    app.extensions["llm"] = LLM(None, "m", 1, 200, client=fake)
    c = app.test_client()
    plan = post(c, {}).get_json()[0]
    first = c.post("/api/explain", json={"plan": plan})
    second = c.post("/api/explain", json={"plan": plan})
    assert first.headers["X-Cache"] == "miss" and second.headers["X-Cache"] == "hit"
    assert len(fake.calls) == 1 and second.get_json()["text"] == "Plant in March."
    c.post("/api/explain", json={"plan": plan, "lang": "fr"})
    assert len(fake.calls) == 2  # another language is another cache entry


def test_template_answers_are_not_cached(make_app):
    app = make_app()
    c = app.test_client()
    plan = post(c, {}).get_json()[0]
    c.post("/api/explain", json={"plan": plan})
    app.extensions["llm"] = LLM(None, "m", 1, 200, client=FakeClient("Now the model is back."))
    assert c.post("/api/explain", json={"plan": plan}).get_json()["source"] == "llm"


# ------------------------------------------------------------------ production settings, logging
def test_prod_refuses_wildcard_cors(make_app):
    with pytest.raises(RuntimeError):
        make_app(ENV="prod", ALLOWED_ORIGINS=["*"])
    make_app(ENV="prod", ALLOWED_ORIGINS=["https://app.example"])


def test_request_log_records_cache_hit_or_miss(client, caplog):
    import logging

    with caplog.at_level(logging.INFO, logger="fieldshift"):
        client.get("/api/profile?lat=4.05&lon=9.7")
        client.get("/api/profile?lat=4.05&lon=9.7")
    lines = [r.getMessage() for r in caplog.records if "/api/profile" in r.getMessage()]
    assert "cache=miss" in lines[0] and "cache=hit" in lines[1]
    assert "lat=" not in "".join(lines)  # no coordinates in the log


def test_wsgi_entry_point_builds_the_app():
    out = subprocess.run([sys.executable, "-c", "from backend.wsgi import app; print(app.name)"], cwd=ROOT.parent,
                         capture_output=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr


def test_deployment_files_exist():
    for f in ("Dockerfile", "wsgi.py", "scripts/prewarm.py", "scripts/smoke.sh", ".env.example"):
        assert (ROOT / f).exists(), f
    assert "ANTHROPIC_API_KEY" in (ROOT / ".env.example").read_text(encoding="utf-8")
    assert ".env" in (ROOT / ".gitignore").read_text(encoding="utf-8")


def test_every_endpoint_accepts_lang_fr(client):
    for path in ("/api/zones", "/api/profile?lat=4.05&lon=9.7", "/api/twins?lat=7.3&lon=13.5", "/api/window?lat=4.05&lon=9.7",
                 "/api/crops", "/api/passport?lat=4.05&lon=9.7", "/api/faq"):
        sep = "&" if "?" in path else "?"
        assert client.get(f"{path}{sep}lang=fr").status_code == 200, path


def test_french_text_is_not_mangled(client):
    body = client.get("/api/profile?lat=4.05&lon=9.7&lang=fr").get_data(as_text=True)
    assert "forêt humide" in body and "\\u00ea" not in body  # real accents, not escapes


# ------------------------------------------------------------------ NASA POWER client (optional extra)
def power_client(handler):
    return httpx.Client(transport=httpx.MockTransport(handler))


GOOD = {"properties": {"parameter": {"PRECTOTCORR": {"202401": 3.2, "202402": -999, "202413": 1.0}, "T2M": {"202401": 26.1}}}}


def test_power_drops_missing_and_annual_values():
    out = nasa_power.monthly(4.05, 9.7, client=power_client(lambda r: httpx.Response(200, json=GOOD)))
    assert out == {"PRECTOTCORR": {"202401": 3.2}, "T2M": {"202401": 26.1}}


def test_power_retries_then_succeeds():
    calls = []

    def handler(req):
        calls.append(1)
        return httpx.Response(503) if len(calls) < 3 else httpx.Response(200, json=GOOD)

    assert nasa_power.monthly(4.05, 9.7, client=power_client(handler), backoff=0)["T2M"] == {"202401": 26.1}
    assert len(calls) == 3


def test_power_gives_up_with_a_clear_error():
    with pytest.raises(nasa_power.PowerUnavailable):
        nasa_power.monthly(4.05, 9.7, client=power_client(lambda r: httpx.Response(429)), backoff=0, retries=1)


def test_power_timeout_is_an_error_not_a_hang():
    def handler(req):
        raise httpx.ReadTimeout("slow", request=req)

    with pytest.raises(nasa_power.PowerUnavailable):
        nasa_power.monthly(4.05, 9.7, client=power_client(handler), backoff=0, retries=1)


def test_power_is_cached_by_rounded_coordinates():
    cache, calls = Cache("memory"), []

    def handler(req):
        calls.append(1)
        return httpx.Response(200, json=GOOD)

    c = power_client(handler)
    a = nasa_power.monthly(4.0501, 9.7001, cache=cache, client=c)
    b = nasa_power.monthly(4.0499, 9.6999, cache=cache, client=c)
    assert a == b and len(calls) == 1


def test_power_unusable_answer_is_an_error():
    with pytest.raises(nasa_power.PowerUnavailable):
        nasa_power.monthly(4.05, 9.7, client=power_client(lambda r: httpx.Response(200, json={"nope": 1})))


# ------------------------------------------------------------------ FAQ-first matching and explain text
def test_match_faq_finds_a_common_question_even_when_retyped():
    from backend.app.services.advisor import match_faq

    items = [{"id": "f10", "q": {"en": "What is mulch?", "fr": "Qu'est-ce que le paillage ?"}, "passage": "132"},
             {"id": "f11", "q": {"en": "How do I keep water in the soil?", "fr": "Comment garder l'eau dans le sol ?"}, "passage": "34"}]
    assert match_faq("how do i keep water in the soil", items, "en")["id"] == "f11"
    assert match_faq("Comment garder l eau dans le sol", items, "fr")["id"] == "f11"
    assert match_faq("what is mulch", items, "en")["id"] == "f10"
    assert match_faq("who won the football match", items, "en") is None
    assert match_faq("", items, "en") is None
    assert match_faq("keep water", items, "en") is None  # a loose overlap is not a match: the keyword search handles it


def test_explain_text_does_not_repeat_the_reason(client):
    plans = client.post("/api/rotations", json={"lat": 4.05, "lon": 9.7}).get_json()
    for p in plans:
        text = client.post("/api/explain", json={"plan": p}).get_json()["text"]
        assert text.count(p["reason"]["en"]) == 1, p["id"]


# ------------------------------------------------------------------ the app's request names (docs/API_CONTRACT.md)
def test_snake_case_names_from_the_app_mean_the_same_as_camel_case(client):
    north = {"lat": 13.0, "lon": 2.0}
    snake = client.post("/api/rotations", json={**north, "last_crop": "millet", "can_water": False}).get_json()
    camel = client.post("/api/rotations", json={**north, "lastCrop": "millet", "canWater": False}).get_json()
    plain = client.post("/api/rotations", json=north).get_json()
    assert snake == camel and snake != plain  # last_crop / can_water are really used, not ignored
    assert any(a["rule"] == "same_crop_as_last" for p in snake for a in p["breakdown"]["adjustments"])


def test_the_exact_body_the_app_sends_is_accepted(client):
    body = {"lat": 4.05, "lon": 9.7, "lang": "en", "priorities": ["money", "soil"], "last_crop": "maize",
            "constraints": {"irrigation": False, "fertilizer": None}}
    r = client.post("/api/rotations", json=body)
    assert r.status_code == 200 and all("score" in p for p in r.get_json())
    assert client.post("/api/rotations", json={**body, "last_crop": "pizza"}).status_code == 422  # unknown crop is rejected, not ignored
