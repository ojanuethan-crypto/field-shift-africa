"""Candidate rotation plans from crop traits, climate, hazards and soil. Pure functions: no Flask, no database.

This is a Python port of the rule-based generator Ojani wrote in engine/rotations.mjs ("rules-1.0", transparent
multi-criteria rules, NOT machine learning, no yield prediction). A parity test runs his JS on his own test data and
checks that this module returns the same plans. Every number below is a rule of that engine; the two that also live
in the database (`scoring_config`) can be overridden from there. All of them are assumptions that an agronomist still
has to review (the Data Passport says so). Nothing here is a scientific claim made by this backend.

Output plans have the shape the rest of the API uses (id, kind, sequence, sub, scen, reason, why, warnings), except that
`why` / `warnings` items also carry their `code`; the provider strips it before the API contract is applied.
"""
import math
from dataclasses import dataclass, replace
from decimal import ROUND_HALF_UP, Decimal
from typing import Dict, List, Optional

KINDS = ("safest", "soil", "money")
# How each named plan weighs the four criteria when its best sequence is picked (rules-1.0).
KIND_FOCUS = {
    "safest": {"safety": 0.5, "water": 0.2, "soil": 0.15, "money": 0.15},
    "soil": {"soil": 0.5, "safety": 0.2, "water": 0.15, "money": 0.15},
    "money": {"money": 0.5, "water": 0.2, "soil": 0.15, "safety": 0.15},
}


@dataclass(frozen=True)
class PlanRules:
    effective_rain: float = 0.8  # share of rain a crop can use. DB scoring_config key: effective_rain_share
    suit_min: float = 0.4  # crops below this suitability are dropped. DB scoring_config key: suitability_min
    long_cycle_days: int = 180  # a longer cycle is counted as 180 days (6 months) of water need
    max_cycle_months: int = 6
    min_cycle_months: int = 2
    water_enough: float = 0.9  # water ratio at or above: "enough"
    water_risky: float = 0.5  # at or above: "risky", below: "not_enough"
    irrigation_lift: float = 0.4  # irrigated ratio = min(1.4, 0.5 + 0.5 * ratio + lift)
    irrigation_cap: float = 1.4
    flood_hazard_level: int = 4  # flood hazard at or above this excludes flood-intolerant crops (flood_tol = 1)
    pool_size: int = 8  # best suited crops kept for sequence building
    min_candidates: int = 3  # fewer candidates than this: relax suitability to the first season only
    soil_w_legume: float = 0.4
    soil_w_diversity: float = 0.3
    soil_w_cover: float = 0.3
    legume_factor_with_fertilizer: float = 2.0
    legume_factor_without_fertilizer: float = 2.4  # without fertilizer soil depends more on legumes
    drought_tol_good: float = 3.3  # mean drought tolerance for the DROUGHT_TOLERANT reason
    cover_good: float = 3.4  # mean ground cover for COVER_PROTECTS_SOIL
    income_good: float = 0.7  # income sub-score for HIGH_INCOME_CROP
    water_good: float = 0.9  # water sub-score for WATER_ENOUGH
    low_soc: float = 10.0  # soil organic carbon below this (no fertilizer) warns LOW_FERTILITY

    def with_db_config(self, rows: Dict[str, str]) -> "PlanRules":
        """Override the two values that live in the database's scoring_config table (when present and numeric)."""
        out = self
        for key, field in (("effective_rain_share", "effective_rain"), ("suitability_min", "suit_min")):
            try:
                out = replace(out, **{field: float(rows[key])})
            except (KeyError, TypeError, ValueError):
                pass
        return out


def _mean(xs) -> float:
    xs = list(xs)
    return sum(xs) / max(len(xs), 1)


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _fixed2(x: float) -> float:
    """Same rounding as JavaScript's toFixed(2) (exact binary value, ties up)."""
    return float(Decimal(x).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def trapezoid(v, amin, omin, omax, amax) -> float:
    """Suitability of a value for a crop range: 0 outside the absolute range, 1 inside the optimal range, linear between."""
    if v is None or amin is None:
        return 1.0  # no range for this crop (e.g. fallow) or no data: not limiting
    if v <= amin or v >= amax:
        return 0.0
    if omin <= v <= omax:
        return 1.0
    return (v - amin) / (omin - amin) if v < omin else (amax - v) / (amax - omax)


def cycle_months(crop: dict, month: int, r: PlanRules) -> List[int]:
    """0-based month indexes a crop planted in `month` (1-12) occupies, capped for long cycles."""
    n = max(r.min_cycle_months, min(r.max_cycle_months, math.ceil(min(crop["cycle_days"], r.long_cycle_days) / 30)))
    return [(month - 1 + i) % 12 for i in range(n)]


def water_ratio(crop, month, rain_by_month, et0_by_month, irrigated, r: PlanRules) -> float:
    idx = cycle_months(crop, month, r)
    rain = sum(rain_by_month[i] for i in idx) * r.effective_rain
    etc = max(1.0, crop["kc_avg"] * sum(et0_by_month[i] for i in idx))
    ratio = rain / etc
    return min(r.irrigation_cap, 0.5 + 0.5 * ratio + r.irrigation_lift) if irrigated else ratio


def water_label(ratio: float, r: PlanRules) -> str:
    return "enough" if ratio >= r.water_enough else "risky" if ratio >= r.water_risky else "not_enough"


def crop_suitability(crop, cell, tmean_by_month, month, r: PlanRules) -> float:
    if crop["tmin_abs"] is None:
        return 1.0
    t = _mean(tmean_by_month[i] for i in cycle_months(crop, month, r))
    s_t = trapezoid(t, crop["tmin_abs"], crop["tmin_opt"], crop["tmax_opt"], crop["tmax_abs"])
    s_r = trapezoid(cell["rain_annual"], crop["rain_min_abs"], crop["rain_min_opt"], crop["rain_max_opt"], crop["rain_max_abs"])
    s_p = 1.0 if cell["ph"] is None else trapezoid(cell["ph"], crop["ph_min_abs"], crop["ph_min_opt"], crop["ph_max_opt"], crop["ph_max_abs"])
    return min(s_t, s_r, s_p)


def soil_score(seq, can_buy_fertilizer: bool, r: PlanRules) -> float:
    legume = sum(1 for c in seq if c["is_legume"]) / len(seq)
    diversity = len({c["family"] for c in seq}) / len(seq)
    cover = sum(c["cover"] for c in seq) / (5 * len(seq))
    factor = r.legume_factor_with_fertilizer if can_buy_fertilizer else r.legume_factor_without_fertilizer
    return r.soil_w_legume * min(legume * factor, 1) + r.soil_w_diversity * diversity + r.soil_w_cover * cover


def resilience(seq, hz) -> float:
    tol = {"drought": "drought_tol", "flood": "flood_tol", "heat": "heat_tol"}
    num = sum(hz[h] * (sum(c[tol[h]] for c in seq) / (5 * len(seq))) for h in tol)
    den = sum(hz[h] for h in tol)
    return num / den


def generate_plans(cell: dict, climate: List[dict], crops: List[dict], reasons: Dict[str, dict], flood_months: List[int],
                   plant_months: List[int], opts: Optional[dict] = None, rules: Optional[PlanRules] = None) -> dict:
    """cell: {cell_id, rain_annual, ph, soc, n_seasons, hz{drought,flood,heat}}; climate: 12 rows {month, rain_p20, rain_p50,
    rain_p80, tmean, et0}; crops: rows with the trait columns; reasons: {code: {en, fr}}; plant_months: 1-2 planting months.
    opts: last_crop (slug|None|'none'), can_water, can_buy_fertilizer.
    Returns {low_potential, plans[...]} (plans empty when the place or the crop pool cannot support rotations)."""
    r = rules or PlanRules()
    opts = opts or {}
    rows = sorted(climate, key=lambda x: x["month"])
    rain = {"dry": [x["rain_p20"] for x in rows], "normal": [x["rain_p50"] for x in rows], "wet": [x["rain_p80"] for x in rows]}
    et0 = [x["et0"] for x in rows]
    tmean = [x["tmean"] for x in rows]
    if not plant_months:
        return {"low_potential": True, "plans": []}
    bimodal = (cell["n_seasons"] or 0) >= 2 and len(plant_months) >= 2
    n_slots = 4 if bimodal else 3

    def slot_month(i):
        return plant_months[i % 2] if bimodal else plant_months[0]

    irrigated = bool(opts.get("can_water"))
    can_fert = bool(opts.get("can_buy_fertilizer"))
    last_slug = opts.get("last_crop")
    last = next((c for c in crops if c["slug"] == last_slug), None) if last_slug and last_slug != "none" else None
    hz = cell["hz"]

    pool = [c for c in crops if c["in_mvp"]]
    suit_by = lambda c, i: crop_suitability(c, cell, tmean, slot_month(i), r)  # noqa: E731
    flooded = lambda c, i: (hz["flood"] >= r.flood_hazard_level and c["flood_tol"] == 1  # noqa: E731
                            and any(mi + 1 in flood_months for mi in cycle_months(c, slot_month(i), r)))
    cand = [c for c in pool if all(suit_by(c, i) >= r.suit_min and not flooded(c, i) for i in range(n_slots))]
    if len(cand) < r.min_candidates:
        cand = [c for c in pool if suit_by(c, 0) >= r.suit_min and not flooded(c, 0)]  # relaxed: first season only
    if len(cand) < 2:
        return {"low_potential": True, "plans": []}
    scored_c = sorted(((c, _mean(suit_by(c, i) for i in range(n_slots))) for c in cand), key=lambda t: -t[1])
    cand = [c for c, _ in scored_c[: r.pool_size]]

    seqs: List[list] = []

    def rec(acc):
        if len(acc) == n_slots:
            if any(c["is_legume"] for c in acc):
                seqs.append(list(acc))
            return
        for c in cand:
            prev = acc[-1] if acc else last
            if prev and (prev["slug"] == c["slug"] or prev["family"] == c["family"]):
                continue  # never the same crop or family back to back (and not the farmer's last crop's family first)
            acc.append(c)
            rec(acc)
            acc.pop()

    rec([])
    if not seqs:
        return {"low_potential": False, "plans": [], "note": "NO_VALID_SEQUENCE"}

    def water_fit(seq, scenario):
        return _mean(_clamp01(water_ratio(c, slot_month(i), rain[scenario], et0, irrigated, r)) for i, c in enumerate(seq))

    scored = []
    for seq in seqs:
        sub = {"money": _mean(c["income_idx"] for c in seq) / 5, "water": water_fit(seq, "normal"),
               "soil": soil_score(seq, can_fert, r), "safety": resilience(seq, hz)}
        scored.append({"seq": seq, "sub": sub, "water_scen": {"dry": water_fit(seq, "dry"), "normal": sub["water"], "wet": water_fit(seq, "wet")}})

    def total(s, w, scenario="normal"):
        wat = s["sub"]["water"] if scenario == "normal" else s["water_scen"][scenario]
        return w["money"] * s["sub"]["money"] + w["water"] * wat + w["soil"] * s["sub"]["soil"] + w["safety"] * s["sub"]["safety"]

    def text(code):
        return reasons.get(code) or {"en": code, "fr": code}

    plans, used = [], []
    for kind in KINDS:
        w = KIND_FOCUS[kind]
        ranked = sorted(scored, key=lambda s: -total(s, w))
        pick = next((s for s in ranked if all(sum(1 for i, c in enumerate(u) if c["slug"] == s["seq"][i]["slug"]) <= n_slots - 2 for u in used)), ranked[0])
        used.append(pick["seq"])
        seq = pick["seq"]
        steps = [{"crop": c["slug"], "month": slot_month(i),
                  "water": [water_label(water_ratio(c, slot_month(i), rain[sc], et0, irrigated, r), r) for sc in ("dry", "normal", "wet")]}
                 for i, c in enumerate(seq)]
        why: Dict[str, None] = {}
        warn: Dict[str, None] = {}
        if any(i > 0 and c["is_legume"] and seq[i - 1]["family"] == "Poaceae" for i, c in enumerate(seq)):
            why["LEGUME_AFTER_CEREAL"] = None
        if len({c["family"] for c in seq}) == len(seq):
            why["FAMILY_BREAK"] = None
        if last:
            why["LAST_CROP_AVOIDED"] = None
        if hz["flood"] >= 4 and all(c["flood_tol"] >= 2 for c in seq):
            why["AVOIDS_FLOOD_PEAK" if flood_months else "FLOOD_TOLERANT"] = None
        if hz["drought"] >= 4 and _mean(c["drought_tol"] for c in seq) >= r.drought_tol_good:
            why["DROUGHT_TOLERANT"] = None
        if _mean(c["cover"] for c in seq) >= r.cover_good:
            why["COVER_PROTECTS_SOIL"] = None
        if kind == "money" and pick["sub"]["money"] >= r.income_good:
            why["HIGH_INCOME_CROP"] = None
        if irrigated and hz["drought"] >= 3:
            why["IRRIGATION_HELPS"] = None
        if pick["sub"]["water"] >= r.water_good:
            why["WATER_ENOUGH"] = None
        if any(s["water"][0] != "enough" for s in steps):
            warn["FAILS_DRY_YEAR"] = None
        if any(s["water"][2] == "not_enough" for s in steps) or (hz["flood"] >= 4 and any(s["water"][2] == "risky" for s in steps)):
            warn["WET_YEAR_WEAK"] = None
        if any(c["cycle_days"] > r.long_cycle_days for c in seq):
            warn["LONG_CYCLE_WARNING"] = None
        if any(c["heat_tol"] <= 2 for c in seq) and hz["heat"] >= 4:
            warn["HEAT_RISK"] = None
        if cell.get("soc") is not None and cell["soc"] < r.low_soc and not can_fert:
            warn["LOW_FERTILITY"] = None
        warn["LOW_CONFIDENCE"] = None  # always: the crop traits are assumptions pending review
        why_list = list(why)[:3]
        plans.append({
            "id": f"{cell['cell_id']}-{kind}", "kind": kind, "sequence": steps,
            "sub": {k: _fixed2(_clamp01(v)) for k, v in pick["sub"].items()},
            "scen": {sc: _fixed2(_clamp01(total(pick, w, sc))) for sc in ("dry", "normal", "wet")},
            "reason": text(why_list[0] if why_list else "FAMILY_BREAK"),
            "why": [{"code": c, **text(c)} for c in why_list],
            "warnings": [{"code": c, **text(c)} for c in warn],
        })
    return {"low_potential": False, "plans": plans, "season_count": n_slots}
