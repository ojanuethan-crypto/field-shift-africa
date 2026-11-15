"""Small geography helpers (pure)."""

COORD_DECIMALS = 2  # coordinates are rounded to 2 decimals (about 1 km): privacy + better cache hits


def round_coord(v: float) -> float:
    return round(v, COORD_DECIMALS)


def inside_africa(lat: float, lon: float) -> bool:
    """Rough Africa bounding box. Same box as the frontend's isInsideAfrica (src/api/hooks.js), so the frontend and
    the API agree on what is 'outside'. Real edge cases (ocean, desert) belong to the data, not to this box."""
    return -35 <= lat <= 37.5 and -18 <= lon <= 52
