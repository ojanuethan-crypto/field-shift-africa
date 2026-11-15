from flask import Blueprint, jsonify

from ..config import VERSION
from ..services import engine_client

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    """Uptime check. `db` is "mock" until the real database exists."""
    return jsonify({"status": "ok", "version": VERSION, "db": engine_client.db_status(), "mode": engine_client.mode()})
