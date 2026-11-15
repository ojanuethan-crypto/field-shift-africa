from flask import Blueprint

from ..schemas import PassportQuery, PassportResponse
from ..services import engine_client
from ._util import ok, query

bp = Blueprint("passport", __name__)


@bp.get("/passport")
def passport():
    """Data Passport (S20): where each number comes from. ?lat&lon are optional (the Passport is not place-specific)."""
    q = query(PassportQuery)
    return ok(PassportResponse, engine_client.get_passport(q.lat, q.lon))
