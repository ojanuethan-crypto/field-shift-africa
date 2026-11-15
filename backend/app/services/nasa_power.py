"""OPTIONAL live monthly climate from NASA POWER (Backend Guide section 5.2). No endpoint depends on it: the demo path
never needs a live NASA call. It is here for a future "fresh data" feature, with a timeout, retry/backoff on 429/5xx,
a small concurrency limit and a cached fallback.

`monthly()` returns {parameter: {"YYYYMM": value}} with missing values (-999) and the annual key (YYYY13) removed,
or raises PowerUnavailable (callers then use their cached or precomputed data).
"""
import logging
import threading
import time
from typing import Optional

import httpx

log = logging.getLogger("fieldshift")

URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
MAX_CONCURRENT = 2  # be polite: the guide says 2-3
_slots = threading.BoundedSemaphore(MAX_CONCURRENT)


class PowerUnavailable(Exception):
    pass


def _clean(data: dict) -> dict:
    return {k: {m: v for m, v in d.items() if v != -999 and not m.endswith("13")} for k, d in data.items()}


def monthly(lat: float, lon: float, start: int = 2015, end: int = 2025, cache=None, ttl: int = 30 * 86400,
            client: Optional[httpx.Client] = None, retries: int = 2, backoff: float = 1.0, timeout: float = 8.0) -> dict:
    """`cache` is the app Cache (optional). A cached answer is returned without calling NASA; a fresh one is stored."""
    key = f"power:{round(lat, 2)}:{round(lon, 2)}:{start}:{end}"
    if cache is not None:
        hit = cache.get(key)
        if hit is not None:
            return hit
    params = {"parameters": "PRECTOTCORR,T2M", "community": "AG", "latitude": round(lat, 2), "longitude": round(lon, 2),
              "start": start, "end": end, "format": "JSON"}
    own = client is None
    client = client or httpx.Client(timeout=timeout)
    last = "unknown error"
    try:
        with _slots:
            for attempt in range(retries + 1):
                try:
                    r = client.get(URL, params=params)
                    if r.status_code == 429 or r.status_code >= 500:
                        last = f"HTTP {r.status_code}"
                    else:
                        r.raise_for_status()
                        data = _clean(r.json()["properties"]["parameter"])
                        if cache is not None:
                            cache.set(key, data, ttl)
                        return data
                except (httpx.TimeoutException, httpx.TransportError) as e:
                    last = type(e).__name__
                except (httpx.HTTPStatusError, KeyError, ValueError) as e:
                    raise PowerUnavailable(f"NASA POWER answered with something unusable ({type(e).__name__})") from e
                if attempt < retries:
                    time.sleep(backoff * 2 ** attempt)
    finally:
        if own:
            client.close()
    log.warning("NASA POWER unavailable after retries: %s", last)
    raise PowerUnavailable(f"NASA POWER unavailable ({last})")
