from .base import DataProvider
from .database import DatabaseProvider
from .mock import MockProvider


def build_provider(config) -> DataProvider:
    mode = config["ENGINE_MODE"]
    if mode == "mock":
        return MockProvider()
    if mode == "real":
        return DatabaseProvider(config.get("DATABASE_URL"))
    raise ValueError(f"ENGINE_MODE must be 'mock' or 'real', got {mode!r}")
