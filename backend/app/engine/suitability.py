"""Crop suitability against conditions at a place. Pure function: no Flask, no database, no built-in crop data.

Method: for each factor (for example rainfall, temperature, pH) a crop supplies four points
(abs_min, opt_min, opt_max, abs_max). The factor score is 0 outside [abs_min, abs_max], rises linearly to 1 at
opt_min, stays 1 up to opt_max, then falls linearly to 0 at abs_max (the usual trapezoid used by crop-requirement
tables such as FAO EcoCrop). If only min/max are given the shape is a rectangle (1 inside, 0 outside).
Factors are combined by the LIMITING factor (the lowest score) by default, or by the mean.

NO crop requirement numbers are defined here: they must come from the data provider (Okani's crop table). When a
condition or a requirement is missing the factor is skipped and listed in `missing`; if nothing could be
evaluated the score is None (unknown), never a guess.
"""
from typing import Optional


def _factor_score(req: dict, value: float) -> float:
    lo, hi = req.get("abs_min", req.get("min")), req.get("abs_max", req.get("max"))
    opt_lo, opt_hi = req.get("opt_min", lo), req.get("opt_max", hi)
    if lo is None or hi is None:
        raise ValueError("requirement needs min/max (or abs_min/abs_max)")
    if value < lo or value > hi:
        return 0.0
    if opt_lo <= value <= opt_hi:
        return 1.0
    if value < opt_lo:
        return (value - lo) / (opt_lo - lo)
    return (hi - value) / (hi - opt_hi)


def evaluate_crop(requirements: dict, conditions: dict, combine: str = "min") -> dict:
    if combine not in ("min", "mean"):
        raise ValueError("combine must be 'min' or 'mean'")
    factors, missing = {}, []
    for name, req in requirements.items():
        value = conditions.get(name)
        if value is None or not req:
            missing.append(name)
            continue
        factors[name] = {"value": value, "score": round(_factor_score(req, value), 6)}
    if not factors:
        return {"score": None, "factors": {}, "missing": missing, "limiting": None}
    scores = {n: f["score"] for n, f in factors.items()}
    limiting = min(scores, key=scores.get)
    score = scores[limiting] if combine == "min" else sum(scores.values()) / len(scores)
    return {"score": round(score, 6), "factors": factors, "missing": missing, "limiting": limiting}


def rank_crops(crops: list, conditions: dict, combine: str = "min", min_score: Optional[float] = None) -> list:
    """crops: [{id, requirements}]. Returns [{id, score, ...}] best first; unknown (None) scores last.
    min_score filters out crops below it (caller's choice, no default threshold)."""
    out = []
    for c in crops:
        r = evaluate_crop(c.get("requirements") or {}, conditions, combine)
        if min_score is not None and r["score"] is not None and r["score"] < min_score:
            continue
        out.append({"id": c["id"], **r})
    return sorted(out, key=lambda r: (r["score"] is None, -(r["score"] or 0)))
