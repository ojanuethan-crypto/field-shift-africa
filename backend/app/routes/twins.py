from flask import Blueprint

from ..schemas import TwinsQuery, TwinsResponse
from ..services import engine_client
from ._util import ok, query

bp = Blueprint("twins", __name__)


@bp.get("/twins")
def twins():
    """Climate Twins (S11): similar places elsewhere in Africa. ?lat&lon&n (default 5)."""
    q = query(TwinsQuery)
    return ok(TwinsResponse, engine_client.get_twins(q.lat, q.lon, q.n))
