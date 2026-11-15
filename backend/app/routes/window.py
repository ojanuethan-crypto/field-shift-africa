from flask import Blueprint

from ..schemas import LatLon, WindowResponse
from ..services import engine_client
from ._util import ok, query

bp = Blueprint("window", __name__)


@bp.get("/window")
def window():
    """Planting window (F10) from past climate, never a forecast. ?lat&lon"""
    q = query(LatLon)
    return ok(WindowResponse, engine_client.get_window(q.lat, q.lon))
