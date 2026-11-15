import os

# Tests never touch a real database or read backend/.env secrets: pin the environment BEFORE the app is imported.
# (load_dotenv does not override variables that are already set, even to an empty value.)
os.environ["ENGINE_MODE"] = "mock"
os.environ["DATABASE_URL"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""

import pytest

os.environ.setdefault("SQLALCHEMY_SILENCE_UBER_WARNING", "1")  # SQLAlchemy 1.4 on purpose

from backend.app import create_app
from backend.app.extensions import limiter

TEST_CONFIG = {"TESTING": True, "ENGINE_MODE": "mock", "CACHE_BACKEND": "memory", "RATELIMIT_ENABLED": False}


def _build(**extra):
    app = create_app({**TEST_CONFIG, **extra})
    if app.config["RATELIMIT_ENABLED"]:
        limiter.reset()  # the limiter is shared by all apps in the process: start each test with empty counters
    return app


@pytest.fixture()
def app():
    return _build()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def make_app():
    """Build an app with extra settings, for tests that change the config."""
    return _build
