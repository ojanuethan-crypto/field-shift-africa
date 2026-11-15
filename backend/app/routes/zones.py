from flask import Blueprint, request

from ..errors import ApiError
from ..schemas import ZonesResponse
from ..services import engine_client
from ._util import ok

bp = Blueprint("zones", __name__)


def _parse_bbox(raw: str):
    try:
        min_lon, min_lat, max_lon, max_lat = (float(x) for x in raw.split(","))
    except ValueError:
        raise ApiError(422, "invalid_request", "bbox: expected minLon,minLat,maxLon,maxLat") from None
    if min_lon > max_lon or min_lat > max_lat:
        raise ApiError(422, "invalid_request", "bbox: min must be smaller than max")
    return min_lon, min_lat, max_lon, max_lat


@bp.get("/zones")
def zones():
    """Zone layer for the map (S10). Optional ?bbox=minLon,minLat,maxLon,maxLat filters the points."""
    data = engine_client.zones_geojson()
    raw = request.args.get("bbox")
    if raw:
        min_lon, min_lat, max_lon, max_lat = _parse_bbox(raw)
        data["features"] = [
            f for f in data["features"]
            if min_lon <= f["geometry"]["coordinates"][0] <= max_lon
            and min_lat <= f["geometry"]["coordinates"][1] <= max_lat
        ]
    return ok(ZonesResponse, data)
