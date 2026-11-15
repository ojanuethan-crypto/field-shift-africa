"""Transparent plan scoring and ranking. Pure functions: no Flask, no database.

A plan's score is   sum(weight[c] * plan.sub[c])  +  adjustments,  clamped to 0..1.
The weights come from the farmer's priorities; every adjustment and every contribution is returned in `breakdown`
so the result can be explained and audited. Matches the frontend's src/data/scoring.js (a parity test checks it).
"""
from typing import Optional

from .config import CRITERIA, ScoringConfig


def weights_from_priorities(priorities, cfg: ScoringConfig) -> dict:
    chosen = []
    for p in priorities or []:
        if p not in CRITERIA:
            raise ValueError(f"unknown priority: {p!r}")
        if p not in chosen:
            chosen.append(p)
    if len(chosen) > 2:
        raise ValueError("at most 2 priorities")
    if not chosen:
        return {c: cfg.neutral_weight for c in CRITERIA}
    hi, lo = (cfg.two_priorities_high, cfg.two_priorities_low) if len(chosen) == 2 else (cfg.one_priority_high, cfg.one_priority_low)
    return {c: (hi if c in chosen else lo) for c in CRITERIA}


def season_statuses(plan: dict, last_crop: Optional[str] = None) -> list:
    """'good' | 'warn' | 'bad' per season (tick / triangle / cross), from the normal-year water status.
    'unknown' when the plan carries no water information."""
    out = []
    for i, s in enumerate(plan["sequence"]):
        if i == 0 and last_crop and last_crop == s["crop"]:
            out.append("warn")  # same crop twice in a row
            continue
        water = s.get("water")
        if not water:
            out.append("unknown")
        else:
            w = water[1]
            out.append("good" if w == "enough" else "warn" if w == "risky" else "bad")
    return out


def score_plan(plan: dict, ctx: dict, cfg: ScoringConfig) -> dict:
    """ctx: priorities (list), can_water (True/False/None), last_crop (id/None), can_buy_fertilizer (accepted, no effect)."""
    sub = plan.get("sub")
    if not sub or any(c not in sub or sub[c] is None for c in CRITERIA):
        return {"score": None, "breakdown": {"note": "plan has no complete sub-scores, so it cannot be scored"}}
    weights = ctx.get("weights") or weights_from_priorities(ctx.get("priorities"), cfg)  # explicit goals win
    contributions = {c: round(weights[c] * sub[c], 6) for c in CRITERIA}
    raw = sum(weights[c] * sub[c] for c in CRITERIA)
    adjustments = []
    if ctx.get("can_water") is False:
        n = sum(1 for s in plan["sequence"] if s.get("water") and s["water"][1] == "not_enough")
        if n:
            adjustments.append({"rule": "cannot_water", "delta": -cfg.unwatered_season_penalty * n,
                                "detail": f"{n} season(s) need more water than normal rain gives"})
    last = ctx.get("last_crop")
    if last and plan["sequence"] and last == plan["sequence"][0]["crop"]:
        adjustments.append({"rule": "same_crop_as_last", "delta": -cfg.same_crop_as_last_penalty,
                            "detail": f"first crop equals the last crop ({last})"})
    score = max(0.0, min(1.0, raw + sum(a["delta"] for a in adjustments)))
    breakdown = {"weights": weights, "contributions": contributions, "raw": round(raw, 6), "adjustments": adjustments}
    if ctx.get("can_buy_fertilizer") is not None:
        breakdown["ignored_inputs"] = [{"input": "can_buy_fertilizer",
                                        "note": "accepted but has no effect until crop data defines how fertilizer changes a score"}]
    return {"score": score, "breakdown": breakdown}


def rank_plans(plans: list, ctx: dict, cfg: ScoringConfig) -> list:
    """Return copies of the plans with score, statuses and breakdown, best first (stable for ties; unscored last)."""
    ranked = []
    for p in plans:
        r = score_plan(p, ctx, cfg)
        ranked.append({**p, "score": r["score"], "statuses": season_statuses(p, ctx.get("last_crop")), "breakdown": r["breakdown"]})
    return sorted(ranked, key=lambda p: (p["score"] is None, -(p["score"] or 0)))
