"""Dry / normal / wet year comparison for one plan. Pure functions."""
from .config import ScoringConfig

SCENARIOS = ("dry", "normal", "wet")  # index order of each season's `water` list


def _status(score: float, cfg: ScoringConfig) -> str:
    return "good" if score >= cfg.status_good_at else "warn" if score >= cfg.status_warn_at else "bad"


def scenario_report(plan: dict, cfg: ScoringConfig):
    """Per scenario: score (from plan.scen), change vs a normal year, status, and the water status count.
    Returns None when the plan has no scenario scores (nothing is estimated)."""
    scen = plan.get("scen")
    if not scen or any(k not in scen for k in SCENARIOS):
        return None
    report = {}
    for i, k in enumerate(SCENARIOS):
        counts = {"enough": 0, "risky": 0, "not_enough": 0}
        for s in plan["sequence"]:
            if s.get("water"):
                counts[s["water"][i]] += 1
        report[k] = {"score": scen[k], "delta_vs_normal": round(scen[k] - scen["normal"], 6),
                     "status": _status(scen[k], cfg), "water": counts}
    return report
