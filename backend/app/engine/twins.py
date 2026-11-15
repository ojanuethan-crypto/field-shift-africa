"""Climate Twins: profile matching by feature similarity. Pure function: no Flask, no database.

Each place is a dict of numeric features (for example annual rain, dry-season length, mean temperature, soil pH).
Features are scaled to 0..1 using the min and max over the origin plus all candidates, then compared with a
weighted Euclidean distance. similarity = 1 - distance / max possible distance, so 1.0 means identical.

The feature list and the weights come from the caller (they must be justified by data from the provider). Features
missing on a candidate (or the origin) are skipped for that comparison and reported, never filled in.
"""
import math
from typing import Optional


def find_similar(origin: dict, candidates: list, weights: Optional[dict] = None, n: int = 5) -> list:
    """origin: {feature: value}. candidates: [{id, features: {feature: value}, ...extra}].
    weights: {feature: weight}; defaults to equal weight for every origin feature.
    Returns up to n of {**candidate, similarity, used_features, skipped_features}, most similar first."""
    feats = [f for f, v in origin.items() if v is not None]
    if not feats:
        return []
    weights = weights or {f: 1.0 for f in feats}
    lo, hi = {}, {}
    for f in feats:
        vals = [origin[f]] + [c["features"][f] for c in candidates if c["features"].get(f) is not None]
        lo[f], hi[f] = min(vals), max(vals)

    def scaled(f, v):
        return 0.0 if hi[f] == lo[f] else (v - lo[f]) / (hi[f] - lo[f])

    out = []
    for c in candidates:
        used, skipped = [], []
        d2 = wsum = 0.0
        for f in feats:
            v = c["features"].get(f)
            if v is None:
                skipped.append(f)
                continue
            w = weights.get(f, 0.0)
            d2 += w * (scaled(f, origin[f]) - scaled(f, v)) ** 2
            wsum += w
            used.append(f)
        if not used or wsum == 0:
            continue  # nothing comparable: not a twin we can claim
        out.append({**c, "similarity": round(1 - math.sqrt(d2 / wsum), 6), "used_features": used, "skipped_features": skipped})
    return sorted(out, key=lambda r: -r["similarity"])[:n]
