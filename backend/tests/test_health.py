from backend.app import create_app
from backend.app.schemas import HealthResponse


def test_health_ok_and_matches_contract(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = HealthResponse.parse_obj(r.get_json())  # raises if shape drifts
    assert body.status == "ok"
    assert body.db == "mock"  # no real database yet
    assert body.mode == "mock"


def test_every_api_answer_is_labelled_mock(client):
    r = client.get("/api/health")
    assert r.headers["X-Data-Source"] == "mock"


def test_unknown_route_returns_json_error(client):
    r = client.get("/api/nope")
    assert r.status_code == 404
    assert r.is_json
    assert set(r.get_json()) == {"error", "message"}


def test_wrong_method_returns_json_error(client):
    r = client.post("/api/health")
    assert r.status_code == 405
    assert set(r.get_json()) == {"error", "message"}


def test_cors_allows_the_frontend_origin(client):
    r = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert r.headers.get("Access-Control-Allow-Origin") == "http://localhost:5173"


def test_cors_blocks_other_origins(client):
    r = client.get("/api/health", headers={"Origin": "http://evil.example"})
    assert "Access-Control-Allow-Origin" not in r.headers


def test_real_mode_is_not_connected_and_says_so():
    app = create_app({"TESTING": True, "ENGINE_MODE": "real"})
    r = app.test_client().get("/api/health")
    assert r.get_json()["db"] == "not_configured"  # real mode, no DATABASE_URL
    unreachable = create_app({"TESTING": True, "ENGINE_MODE": "real", "DATABASE_URL": "postgresql://u:p@127.0.0.1:1/db"})
    assert unreachable.test_client().get("/api/health").get_json()["db"] == "unreachable"  # configured but cannot connect
    assert "X-Data-Source" not in r.headers
