from flask import Blueprint

from ..schemas import LatLon, OutsideResponse, ProfileResponse, ProfileState
from ..services import engine_client
from ._util import ok, query

bp = Blueprint("profile", __name__)


@bp.get("/profile")
def profile():
    """Everything about a place (S3 Your land, S12 Months to watch). Places we cannot advise on are normal 200 answers that
    the app turns into friendly screens: {outside: true} (outside the covered area), {data_quality: "no_data"} (no data cell
    near the point) and {data_quality: "desert"} (almost no rain)."""
    q = query(LatLon)
    data = engine_client.get_profile(q.lat, q.lon)
    model = OutsideResponse if data.get("outside") else ProfileState if "zone" not in data else ProfileResponse
    return ok(model, data)
