from flask import Blueprint, current_app

from ..extensions import limiter
from ..schemas import EventRequest, FeedbackRequest, OkResponse, StatsResponse
from ._util import body, ok

bp = Blueprint("feedback", __name__)


def _counters():
    return current_app.extensions["counters"]


@bp.post("/feedback")
@limiter.limit(lambda: current_app.config["RATELIMIT_WRITES"])
def feedback():
    """Thumbs up/down (S14, S25). Stores a COUNT only: no identifiers, no free text."""
    req = body(FeedbackRequest)
    _counters().feedback(req.target, req.value)  # always counted in memory (the app never waits for storage)
    current_app.extensions["provider"].record_feedback(req.target, req.value, req.zone, req.lang)  # and stored if the provider can
    return ok(OkResponse, {"ok": True})


@bp.post("/event")
@limiter.limit(lambda: current_app.config["RATELIMIT_WRITES"])
def event():
    """Anonymous usage count (F54): event name + zone id. No identifiers, no coordinates."""
    req = body(EventRequest)
    _counters().event(req.name, req.zone)
    current_app.extensions["provider"].record_event(req.name, req.zone)
    return ok(OkResponse, {"ok": True})


@bp.get("/stats")
def stats():
    """Counts for slides. From the database when the provider has one, otherwise in memory (resets on restart)."""
    durable = current_app.extensions["provider"].stats()
    if durable is not None:
        return ok(StatsResponse, {**durable, "storage": "database"})
    data = _counters().snapshot()
    data["storage"] = "memory (resets on restart)"
    return ok(StatsResponse, data)
