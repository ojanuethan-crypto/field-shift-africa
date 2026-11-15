from flask import Blueprint, current_app

from ..errors import ApiError, NoData
from ..extensions import limiter
from ..schemas import LowPotentialResponse, Plan, RotationRequest
from ..services import engine_client
from ._util import body, ok

bp = Blueprint("rotations", __name__)


@bp.post("/rotations")
@limiter.limit(lambda: current_app.config["RATELIMIT_ROTATIONS"])
def rotations():
    """Ranked rotation plans (S7, S8). Answer is a bare ARRAY of plans because the frontend maps over it directly.
    Body: lat, lon, and optionally priorities (max 2), lastCrop, canWater, canBuyFertilizer, or the guide's goals{income,
    water,soil,resilience} (normalised to sum 1) and constraints{irrigation,fertilizer,short_season}."""
    req = body(RotationRequest)
    inputs = req.inputs()
    last = inputs["last_crop"]
    if last is not None and last not in engine_client.known_crop_ids():
        raise ApiError(422, "invalid_request", f"lastCrop: unknown crop {last!r}")
    try:
        return ok(Plan, engine_client.rank_rotations(req.lat, req.lon, inputs))
    except NoData:  # desert, no data cell, or no crop that suits the place: say so in a way the app can show
        state = engine_client.no_plans_state(req.lat, req.lon)
        return ok(LowPotentialResponse, engine_client._label({"low_potential": True, "state": state, "plans": []}))
