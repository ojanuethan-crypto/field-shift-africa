import os

from dotenv import load_dotenv

load_dotenv()

# Reported by /api/health so you can tell which release is live after a deploy. Bump on each release.
VERSION = "0.1.0"


class Config:
    ENV = os.getenv("ENV", "dev")  # "prod" refuses to start with a wildcard CORS list
    # "mock" = answers come from backend/app/mock/*.json (clearly labelled). "real" = DatabaseProvider, which answers
    # 501 schema_pending until Okani's schema is integrated.
    ENGINE_MODE = os.getenv("ENGINE_MODE", "mock")
    ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

    # Secret. Used only by the (not yet connected) DatabaseProvider. Never logged, never returned.
    DATABASE_URL = os.getenv("DATABASE_URL")

    # Scoring settings: JSON object overriding engine/config.py defaults, e.g. {"same_crop_as_last_penalty": 0.1}
    SCORING_CONFIG_JSON = os.getenv("SCORING_CONFIG_JSON")

    # Optional language model for /api/ask and /api/explain. Without a key both still work (offline search / template).
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")  # secret: never logged, never returned
    LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-5-5")  # the guide's model; check name and price before the event
    LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", 8))
    LLM_DAILY_CAP = int(os.getenv("LLM_DAILY_CAP", 200))  # model calls per day; beyond it the offline fallback answers

    # Cache: 'memory' (default: safe while fixtures change) or 'disk' (diskcache in CACHE_DIR, survives restarts).
    CACHE_BACKEND = os.getenv("CACHE_BACKEND", "memory")
    CACHE_DIR = os.getenv("CACHE_DIR", ".cache")
    CACHE_TTL_PROFILE = int(os.getenv("CACHE_TTL_PROFILE", 86400))  # seconds
    CACHE_TTL_ROTATIONS = int(os.getenv("CACHE_TTL_ROTATIONS", 3600))
    CACHE_TTL_STATIC = int(os.getenv("CACHE_TTL_STATIC", 86400))

    # Rate limits (flask-limiter syntax). Switch everything off with RATELIMIT_ENABLED=false.
    RATELIMIT_ENABLED = os.getenv("RATELIMIT_ENABLED", "true").lower() != "false"
    RATELIMIT_ROTATIONS = os.getenv("RATELIMIT_ROTATIONS", "60 per minute")
    RATELIMIT_ASK = os.getenv("RATELIMIT_ASK", "30 per minute")  # also used by /api/explain
    RATELIMIT_WRITES = os.getenv("RATELIMIT_WRITES", "60 per minute")  # feedback + event
