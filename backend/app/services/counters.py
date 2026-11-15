"""Anonymous counts only (Roadmap F50, F54): thumbs per target and events per zone. No identifiers, no coordinates, no
free text. In memory: counts reset when the server restarts. Durable storage needs a table in the real database
(pending from Okani); until then the API says so in /api/stats."""
import threading
from collections import defaultdict


class Counters:
    def __init__(self):
        self._lock = threading.Lock()
        self._feedback = defaultdict(lambda: {"up": 0, "down": 0})
        self._events = defaultdict(lambda: defaultdict(int))

    def feedback(self, target: str, value: str):
        with self._lock:
            self._feedback[target][value] += 1

    def event(self, name: str, zone):
        with self._lock:
            self._events[name]["none" if zone is None else str(zone)] += 1

    def snapshot(self) -> dict:
        with self._lock:
            return {"feedback": {k: dict(v) for k, v in self._feedback.items()},
                    "events": {k: dict(v) for k, v in self._events.items()}}
