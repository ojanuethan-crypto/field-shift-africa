"""/api/ask (model path) and /api/explain. A fake model client is injected: no network, no key."""
import pytest

from backend.app.schemas import AskResponse, ExplainResponse
from backend.app.services.llm import LLM, contains_dosage


class FakeClient:
    """Mimics anthropic.Anthropic().messages.create()."""

    def __init__(self, reply="A short answer.", fail=False):
        self.reply, self.fail, self.calls = reply, fail, []
        self.messages = self

    def create(self, **kw):
        self.calls.append(kw)
        if self.fail:
            raise TimeoutError("boom")
        block = type("B", (), {"text": self.reply})()
        return type("M", (), {"content": [block]})()


def with_llm(make_app, client, cap=200):
    app = make_app()
    app.extensions["llm"] = LLM(None, "test-model", 1, cap, client=client)
    return app.test_client()


ROT = {"lat": 4.05, "lon": 9.7}


def plan_ids(client):
    return [p["id"] for p in client.post("/api/rotations", json=ROT).get_json()]


# ------------------------------------------------------------------ dosage guard
@pytest.mark.parametrize("text,bad", [
    ("Apply 2 kg/ha of urea", True), ("Use 50 ml per litre of water", True), ("200 g par hectare", True),
    ("3 L / ha", True), ("Rotate maize with groundnut every 3 seasons", False), ("Wait 2 weeks", False),
])
def test_contains_dosage(text, bad):
    assert contains_dosage(text) is bad


# ------------------------------------------------------------------ ask
def test_ask_without_model_is_unchanged(client):
    body = client.post("/api/ask", json={"question": "my field floods"}).get_json()
    assert body["mode"] == "search"


def test_ask_uses_model_grounded_in_matched_passages(make_app):
    fake = FakeClient("Water can pool. Raise your beds.")
    c = with_llm(make_app, fake)
    r = c.post("/api/ask", json={"question": "my field floods"})
    body = r.get_json()
    AskResponse.parse_obj(body)
    assert body["mode"] == "llm" and body["answer"] == "Water can pool. Raise your beds." and body["sources"]
    prompt = fake.calls[0]["messages"][0]["content"]
    assert "my field floods" in prompt and "[1]" in prompt  # the model got the passages, numbered


def test_ask_no_match_never_calls_the_model(make_app):
    fake = FakeClient()
    c = with_llm(make_app, fake)
    body = c.post("/api/ask", json={"question": "zzzz qqqq"}).get_json()
    assert body["mode"] == "none" and body["answer"] is None and fake.calls == []


@pytest.mark.parametrize("client_", [FakeClient(fail=True), FakeClient("Use 2 kg/ha of urea"), FakeClient("NO_ANSWER")])
def test_ask_falls_back_to_search_when_model_fails_or_breaks_a_rule(make_app, client_):
    body = with_llm(make_app, client_).post("/api/ask", json={"question": "my field floods"}).get_json()
    assert body["mode"] == "search" and body["sources"][0]["id"] == "p5"


def test_daily_cap_stops_model_calls(make_app):
    fake = FakeClient()
    c = with_llm(make_app, fake, cap=1)
    modes = [c.post("/api/ask", json={"question": "my field floods"}).get_json()["mode"] for _ in range(3)]
    assert modes == ["llm", "search", "search"] and len(fake.calls) == 1


# ------------------------------------------------------------------ explain
def test_explain_template_without_model(client):
    pid = plan_ids(client)[0]
    r = client.post("/api/explain", json={**ROT, "plan_id": pid})
    body = r.get_json()
    assert r.status_code == 200
    ExplainResponse.parse_obj(body)
    assert body["source"] == "template" and body["text"] and body["_mock"] is True


def test_explain_template_is_french_on_request(client):
    pid = plan_ids(client)[0]
    text = client.post("/api/explain", json={**ROT, "plan_id": pid, "lang": "fr"}).get_json()["text"]
    assert "sur 100" in text


def test_explain_template_states_only_plan_facts(client):
    plans = client.post("/api/rotations", json=ROT).get_json()
    p = plans[0]
    text = client.post("/api/explain", json={**ROT, "plan_id": p["id"]}).get_json()["text"]
    assert p["reason"]["en"] in text and f"{round(p['score'] * 100)} out of 100" in text
    assert all(w["en"] in text for w in p["warnings"])


def test_explain_mentions_adjustment_when_cannot_water(client):
    north = {"lat": 13.0, "lon": 2.0}  # mock zone 1 has plans with a water-short season
    plans = client.post("/api/rotations", json={**north, "canWater": False}).get_json()
    hit = next(p for p in plans if any(a["rule"] == "cannot_water" for a in p["breakdown"]["adjustments"]))
    text = client.post("/api/explain", json={**north, "canWater": False, "plan_id": hit["id"]}).get_json()["text"]
    assert "more water than you can give" in text


def test_explain_uses_model_wording_and_sends_only_plan_facts(make_app):
    fake = FakeClient("Plant in March. It copes with rain.")
    c = with_llm(make_app, fake)
    pid = plan_ids(c)[0]
    body = c.post("/api/explain", json={**ROT, "plan_id": pid}).get_json()
    assert body["source"] == "llm" and body["text"] == "Plant in March. It copes with rain."
    sent = fake.calls[0]["messages"][0]["content"]
    assert sent.startswith("Facts:") and "score_out_of_100" in sent


@pytest.mark.parametrize("client_", [FakeClient(fail=True), FakeClient("Spray 3 L/ha of herbicide")])
def test_explain_falls_back_to_template(make_app, client_):
    c = with_llm(make_app, client_)
    body = c.post("/api/explain", json={**ROT, "plan_id": plan_ids(c)[0]}).get_json()
    assert body["source"] == "template"


def test_explain_unknown_plan_is_404(client):
    r = client.post("/api/explain", json={**ROT, "plan_id": "nope"})
    assert r.status_code == 404 and r.get_json()["error"] == "no_data"


@pytest.mark.parametrize("payload,status", [
    ({"lat": 4.05, "lon": 9.7}, 422),                                # plan_id required
    ({"lat": 4.05, "lon": 9.7, "plan_id": "3-safest", "lang": "de"}, 422),
    ({"lat": 60, "lon": 9.7, "plan_id": "3-safest"}, 422),            # invalid latitude
    ({"lat": 4.05, "lon": 9.7, "plan_id": "3-safest", "lastCrop": "pizza"}, 422),
    ({"lat": 4.05, "lon": 9.7, "plan_id": "3-safest", "priorities": ["money", "water", "soil"]}, 422),
])
def test_explain_rejects_bad_input(client, payload, status):
    assert client.post("/api/explain", json=payload).status_code == status


def test_explain_real_mode_without_a_database_says_so(make_app):
    c = make_app(ENGINE_MODE="real").test_client()
    r = c.post("/api/explain", json={**ROT, "plan_id": "3-safest"})
    assert r.status_code == 503 and r.get_json()["error"] == "database_not_configured"


def test_api_key_is_never_exposed(make_app):
    app = make_app(ANTHROPIC_API_KEY="sk-secret-123")
    c = app.test_client()
    assert app.extensions["llm"].available
    for path in ("/api/health", "/api/stats"):
        assert "sk-secret-123" not in c.get(path).get_data(as_text=True)
