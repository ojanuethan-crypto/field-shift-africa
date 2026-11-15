"""Rotation candidate GENERATION under structural rules. Pure functions: no Flask, no database.

Rules (Master Guide section 8, step 6): no same crop twice in a row; no same crop FAMILY back to back (only when
both families are known: unknown families are never guessed); include a legume when the pool has one; the first
crop must differ from the crop grown last season.

This module only produces sequences. Scoring a sequence needs per-crop attributes (income, water need, soil effect,
tolerance) that must come from the data provider, so `subscore_fn` is supplied by the caller and may return None
(then the plan is marked unscored and ranked last). Sequences are generated in a fixed order so results are repeatable.
"""
from typing import Callable, List, Optional


def _same_group(a: dict, b: dict) -> bool:
    if a["id"] == b["id"]:
        return True
    return bool(a.get("family") and b.get("family") and a["family"] == b["family"])


def generate_sequences(crops: List[dict], n_seasons: int = 3, last_crop: Optional[dict] = None,
                       require_legume: bool = True, max_candidates: int = 200) -> List[List[str]]:
    """crops: [{id, legume: bool, family: str|None}]. last_crop: a crop dict from the same list (or None).
    Returns up to max_candidates sequences of crop ids."""
    pool = sorted(crops, key=lambda c: c["id"])
    needs_legume = require_legume and any(c.get("legume") for c in pool)
    out: List[List[str]] = []

    def extend(seq: List[dict]):
        if len(out) >= max_candidates:
            return
        if len(seq) == n_seasons:
            if not needs_legume or any(c.get("legume") for c in seq):
                out.append([c["id"] for c in seq])
            return
        prev = seq[-1] if seq else last_crop
        for c in pool:
            if prev is not None and _same_group(prev, c):
                continue
            extend(seq + [c])

    extend([])
    return out


def build_plans(sequences: List[List[str]], subscore_fn: Callable[[List[str]], Optional[dict]]) -> List[dict]:
    """Turn crop-id sequences into plan dicts (same shape the scorer reads). sub is None when not computable."""
    plans = []
    for i, seq in enumerate(sequences):
        plans.append({"id": f"gen-{i + 1}", "kind": "generated",
                      "sequence": [{"crop": c} for c in seq], "sub": subscore_fn(seq)})
    return plans
