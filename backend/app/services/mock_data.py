"""Loader for the clearly-labelled MOCK data in backend/app/mock/.

Every payload built from these files carries `_mock: true` (see engine_client.mock_label) and the HTTP
header `X-Data-Source: mock`. Nothing here is real agricultural data.
"""
import json
from functools import lru_cache
from pathlib import Path

MOCK_DIR = Path(__file__).resolve().parent.parent / "mock"


@lru_cache(maxsize=None)
def _load(name: str):
    with open(MOCK_DIR / name, encoding="utf-8") as f:
        return json.load(f)


def load(name: str):
    """Return a deep copy so callers can mutate the result safely."""
    return json.loads(json.dumps(_load(name)))
