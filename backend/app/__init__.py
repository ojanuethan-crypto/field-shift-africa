import logging
import time

from flask import Flask, g, request
from flask_cors import CORS

from . import engine
from .config import Config
from .errors import register_error_handlers
from .extensions import limiter
from .providers import build_provider
from .services.cache import Cache
from .services.counters import Counters
from .services.llm import LLM


def create_app(overrides: dict = None) -> Flask:
    """App factory: tests call create_app({...}) to get an isolated app; `flask run` calls it with no arguments."""
    app = Flask(__name__)
    app.config.from_object(Config)
    if overrides:
        app.config.update(overrides)
    if app.config["ENV"] == "prod" and "*" in app.config["ALLOWED_ORIGINS"]:
        raise RuntimeError("ENV=prod: ALLOWED_ORIGINS must list your real frontend URL(s), not *")
    app.json.ensure_ascii = False  # keep accents (French) readable in responses

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    CORS(app, resources={r"/api/*": {"origins": app.config["ALLOWED_ORIGINS"]}})
    register_error_handlers(app)
    limiter.init_app(app)

    # Everything the routes need lives in app.extensions, so each app (and each test) is fully isolated.
    app.extensions["provider"] = build_provider(app.config)  # mock fixtures today, database later
    app.extensions["scoring"] = engine.ScoringConfig.from_env_json(app.config["SCORING_CONFIG_JSON"])
    app.extensions["cache"] = Cache(app.config["CACHE_BACKEND"], app.config["CACHE_DIR"])
    app.extensions["counters"] = Counters()
    app.extensions["llm"] = LLM(app.config["ANTHROPIC_API_KEY"], app.config["LLM_MODEL"],
                                app.config["LLM_TIMEOUT_SECONDS"], app.config["LLM_DAILY_CAP"])  # optional: no key = offline
    app.extensions["rag"] = None  # hook for Ojani's RAG system: an object with answer(question, lang, zone_id) -> dict|None

    from .routes import advisor, crops, feedback, health, passport, profile, proof, rotations, twins, window, zones

    for module in (health, zones, profile, rotations, twins, window, crops, passport, proof, advisor, feedback):
        app.register_blueprint(module.bp, url_prefix="/api")

    @app.before_request
    def _start():
        g.t0 = time.perf_counter()

    @app.after_request
    def _finish(resp):
        # Log method, path, status, duration. Query strings (which can hold coordinates) are NOT logged.
        ms = (time.perf_counter() - g.get("t0", time.perf_counter())) * 1000
        hit = g.get("cache_hit")
        cache = "" if hit is None else (" cache=hit" if hit else " cache=miss")
        logging.getLogger("fieldshift").info("%s %s %s %.0fms%s", request.method, request.path, resp.status_code, ms, cache)
        if request.path.startswith("/api/"):
            if app.extensions["provider"].is_mock:
                resp.headers["X-Data-Source"] = "mock"  # every answer says it is mock data
            if hit is not None:
                resp.headers["X-Cache"] = "hit" if hit else "miss"
        return resp

    return app
