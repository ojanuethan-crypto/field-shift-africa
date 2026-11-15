"""Response cache. Backends: 'memory' (tests, simple runs) or 'disk' (diskcache; survives restarts).
Values must be JSON-serialisable. Every read returns a fresh copy, so callers can mutate results safely."""
import json
import time
from typing import Callable, Tuple


class Cache:
    def __init__(self, backend: str = "memory", directory: str = None):
        self.backend = backend
        if backend == "disk":
            from diskcache import Cache as DiskCache

            self._disk = DiskCache(directory or ".cache")
        elif backend == "memory":
            self._mem = {}
        else:
            raise ValueError("CACHE_BACKEND must be 'memory' or 'disk'")

    def _get(self, key):
        if self.backend == "disk":
            return self._disk.get(key)
        hit = self._mem.get(key)
        if hit and hit[0] > time.monotonic():
            return hit[1]
        return None

    def _set(self, key, raw, ttl):
        if self.backend == "disk":
            self._disk.set(key, raw, expire=ttl)
        else:
            self._mem[key] = (time.monotonic() + ttl, raw)

    def get(self, key: str):
        """The cached value or None (no hit/miss bookkeeping). Use with set() when only some results should be cached."""
        raw = self._get(key)
        return None if raw is None else json.loads(raw)

    def set(self, key: str, value, ttl: int):
        self._set(key, json.dumps(value), ttl)

    def get_or_set(self, key: str, producer: Callable[[], object], ttl: int) -> Tuple[object, bool]:
        """Return (value, was_hit). The producer runs only on a miss; its errors are never cached."""
        raw = self._get(key)
        if raw is not None:
            return json.loads(raw), True
        value = producer()
        self._set(key, json.dumps(value), ttl)
        return json.loads(json.dumps(value)), False

    def clear(self):
        if self.backend == "disk":
            self._disk.clear()
        else:
            self._mem.clear()
