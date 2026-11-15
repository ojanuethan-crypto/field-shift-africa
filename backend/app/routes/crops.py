from flask import Blueprint

from ..schemas import CropsQuery, CropsResponse
from ..services import engine_client
from ._util import ok, query

bp = Blueprint("crops", __name__)


@bp.get("/crops")
def crops():
    """Crop list. ?zone_id narrows it to the crops used in that zone."""
    q = query(CropsQuery)
    return ok(CropsResponse, engine_client.list_crops(q.zone_id))
