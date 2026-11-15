"""Optional language-model client (Backend Guide: services/llm.py). The API works with NO key and NO model installed.

`LLM.complete()` returns the model's text, or None when the model is not configured, the daily cap is reached, the call
fails or times out. Callers then use their offline fallback (search for /ask, a template for /explain), so a model outage
never becomes an API outage.

Safety net `contains_dosage()`: answers that state an amount of a product per area/volume are rejected by the callers,
because the product rule is "never give chemical dosages" (ask an agronomist).
"""
import logging
import re
import threading
from datetime import date
from typing import Optional

log = logging.getLogger("fieldshift")

# "2 kg/ha", "50 ml per litre", "3 L / ha", "200 g par hectare" ...
_DOSAGE = re.compile(
    r"\d+(?:[.,]\d+)?\s*(?:kg|g|mg|ml|cl|l|litres?|liters?|cc)\s*(?:/|per\b|par\b|a\b|à\b)\s*"
    r"(?:\d+\s*)?(?:ha|hectares?|acres?|l|litres?|liters?|plants?|m2|m²|pump|pompe)",
    re.IGNORECASE,
)


def contains_dosage(text: str) -> bool:
    return bool(_DOSAGE.search(text or ""))


class LLM:
    def __init__(self, api_key: Optional[str], model: str, timeout: float = 8.0, daily_cap: int = 200, client=None):
        self.model, self.timeout, self.daily_cap = model, timeout, daily_cap
        self._api_key = api_key  # secret: never logged, never returned
        self._client = client  # injected in tests; otherwise built lazily from the optional `anthropic` package
        self._lock = threading.Lock()
        self._day, self._used = date.today(), 0

    @property
    def available(self) -> bool:
        return self._client is not None or bool(self._api_key)

    def _take_slot(self) -> bool:
        with self._lock:
            today = date.today()
            if today != self._day:
                self._day, self._used = today, 0
            if self._used >= self.daily_cap:
                return False
            self._used += 1
            return True

    def _get_client(self):
        if self._client is None:
            try:
                import anthropic  # optional dependency
            except ImportError:
                log.warning("ANTHROPIC_API_KEY is set but the 'anthropic' package is not installed: using offline fallback")
                return None
            self._client = anthropic.Anthropic(api_key=self._api_key, timeout=self.timeout, max_retries=0)
        return self._client

    def complete(self, system: str, user: str, max_tokens: int = 350) -> Optional[str]:
        if not self.available or not self._take_slot():
            return None
        try:
            client = self._get_client()
            if client is None:
                return None
            msg = client.messages.create(
                model=self.model, max_tokens=max_tokens, system=system,
                messages=[{"role": "user", "content": user}],
            )
            text = "".join(getattr(b, "text", "") for b in msg.content).strip()
            return text or None
        except Exception as e:  # network, timeout, auth, quota...: never break the endpoint
            log.warning("LLM call failed (%s): using offline fallback", type(e).__name__)
            return None
