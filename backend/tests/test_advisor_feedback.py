"""Tests for /api/faq, /api/advice-index, /api/ask, /api/feedback, /api/event, /api/stats."""
import pytest

from backend.app.schemas import AdviceIndexResponse, AskResponse, FaqResponse, StatsResponse


def ask(client, question, lang="en", **extra):
    return client.post("/api/ask", json={"question": question, "lang": lang, **extra})


# ---------------------------------------------------------------- faq + index
def test_faq_and_index_match_contract(client):
    faq = client.get("/api/faq").get_json()
    index = client.get("/api/advice-index").get_json()
    FaqResponse.parse_obj(faq)
    AdviceIndexResponse.parse_obj(index)
    assert len(faq["items"]) == 12 and index["passages"]


def test_every_faq_item_points_at_a_real_passage(client):
    ids = {p["id"] for p in client.get("/api/advice-index").get_json()["passages"]}
    assert all(i["passage"] in ids for i in client.get("/api/faq").get_json()["items"])


def test_passages_are_labelled_as_samples_until_real_documents_exist(client):
    assert all(p["sample"] is True for p in client.get("/api/advice-index").get_json()["passages"])


# ---------------------------------------------------------------- ask
def test_ask_finds_a_source_and_cites_it(client):
    r = ask(client, "my field floods")
    assert r.status_code == 200
    body = r.get_json()
    AskResponse.parse_obj(body)
    assert body["mode"] == "search" and body["sources"][0]["id"] == "p5"
    passage = next(p for p in client.get("/api/advice-index").get_json()["passages"] if p["id"] == "p5")
    assert body["answer"] == passage["text"]["en"]  # the answer IS the cited passage, nothing added


@pytest.mark.parametrize("q,lang,ok_ids", [
    ("how to store grain", "en", {"p7"}),
    ("mon sol est fatigué", "fr", {"p1", "p8"}),
    ("pourquoi alterner les cultures", "fr", {"p2"}),
])
def test_ask_in_both_languages(client, q, lang, ok_ids):
    body = ask(client, q, lang).get_json()
    assert body["mode"] == "search" and body["sources"][0]["id"] in ok_ids


def test_ask_french_answer_is_french(client):
    body = ask(client, "comment stocker le grain", "fr").get_json()
    passage = next(p for p in client.get("/api/advice-index").get_json()["passages"] if p["id"] == body["sources"][0]["id"])
    assert body["answer"] == passage["text"]["fr"]


def test_ask_with_no_match_says_so_and_does_not_make_something_up(client):
    body = ask(client, "price of bitcoin").get_json()
    assert body == {"answer": None, "sources": [], "mode": "none", "_mock": True}


@pytest.mark.parametrize("payload", [{}, {"question": ""}, {"question": "   "}, {"question": "x" * 301},
                                     {"question": "ok", "lang": "de"}, {"question": "ok", "zone_id": 0}])
def test_ask_bad_input(client, payload):
    r = client.post("/api/ask", json=payload)
    assert r.status_code == 422 and r.get_json()["error"] == "invalid_request"


def test_ask_get_not_allowed(client):
    assert client.get("/api/ask").status_code == 405


def test_rag_hook_answers_first_and_search_is_the_fallback(app):
    class FakeRag:
        def __init__(self, out):
            self.out = out
            self.calls = []

        def answer(self, question, lang, zone_id):
            self.calls.append((question, lang, zone_id))
            return self.out

    app.extensions["rag"] = FakeRag({"answer": "from rag", "sources": [{"doc": "d", "page": 3}]})
    c = app.test_client()
    body = ask(c, "my field floods", zone_id=3).get_json()
    assert body["mode"] == "rag" and body["answer"] == "from rag" and body["sources"] == [{"doc": "d", "page": 3}]
    assert app.extensions["rag"].calls == [("my field floods", "en", 3)]
    app.extensions["rag"] = FakeRag(None)  # RAG has no answer -> offline search takes over
    assert ask(c, "my field floods").get_json()["mode"] == "search"


def test_ask_is_rate_limited(make_app):
    c = make_app(RATELIMIT_ENABLED=True, RATELIMIT_ASK="2 per minute").test_client()
    assert [ask(c, "floods").status_code for _ in range(3)] == [200, 200, 429]


# ---------------------------------------------------------------- feedback / events / stats
def test_feedback_counts_up_and_down(client):
    for v in ("up", "up", "down"):
        assert client.post("/api/feedback", json={"target": "advisor-answer", "value": v}).get_json() == {"ok": True}
    stats = client.get("/api/stats").get_json()
    StatsResponse.parse_obj(stats)
    assert stats["feedback"]["advisor-answer"] == {"up": 2, "down": 1}
    assert "memory" in stats["storage"]


def test_events_are_counted_per_zone(client):
    client.post("/api/event", json={"name": "plan-viewed", "zone": 3})
    client.post("/api/event", json={"name": "plan-viewed", "zone": 3})
    client.post("/api/event", json={"name": "plan-viewed"})
    assert client.get("/api/stats").get_json()["events"]["plan-viewed"] == {"3": 2, "none": 1}


def test_stats_hold_counts_only_no_identifiers(client):
    client.post("/api/feedback", json={"target": "t", "value": "up"}, headers={"User-Agent": "secret-agent"},
                environ_overrides={"REMOTE_ADDR": "9.9.9.9"})
    text = client.get("/api/stats").get_data(as_text=True)
    assert "secret-agent" not in text and "9.9.9.9" not in text


@pytest.mark.parametrize("payload", [{}, {"target": "x"}, {"target": "x", "value": "meh"}, {"target": "Bad Target!", "value": "up"},
                                     {"target": "x" * 41, "value": "up"}])
def test_feedback_bad_input(client, payload):
    assert client.post("/api/feedback", json=payload).status_code == 422


@pytest.mark.parametrize("payload", [{}, {"name": "Has Space"}, {"name": "ok", "zone": 0}, {"name": "ok", "zone": "x"}])
def test_event_bad_input(client, payload):
    assert client.post("/api/event", json=payload).status_code == 422


def test_counters_are_isolated_between_apps(make_app):
    a, b = make_app().test_client(), make_app().test_client()
    a.post("/api/feedback", json={"target": "t", "value": "up"})
    assert b.get("/api/stats").get_json()["feedback"] == {}
