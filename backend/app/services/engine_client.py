"""Orchestration: routes call THIS, and this calls the data provider + the pure engine + the cache.

    route  ->  engine_client  ->  provider (mock fixtures today, database later)
                              ->  engine   (pure scoring / scenarios / twins / window logic)

It is the only place that turns provider data into API answers. Function names follow Backend Guide section 5.1.
Swapping mock for real is a provider change (ENGINE_MODE), not a change here or in the routes.
"""
import hashlib
import json
from typing import Optional

from flask import current_app, g

from .. import engine
from ..errors import NoData, OutsideCoverage
from ..geo import inside_africa, round_coord
from ..months import month_name
from . import advisor, explain


# ------------------------------------------------------------------ plumbing
def mode() -> str:
    return current_app.config["ENGINE_MODE"]


def provider():
    return current_app.extensions["provider"]


def is_mock() -> bool:
    return provider().is_mock


def db_status() -> str:
    return provider().status()


def scoring_config() -> engine.ScoringConfig:
    return current_app.extensions["scoring"]


def _cached(key: str, ttl: int, producer):
    value, hit = current_app.extensions["cache"].get_or_set(f"{provider().name}|{key}", producer, ttl)
    g.cache_hit = hit
    return value


def _label(data: dict) -> dict:
    if is_mock():
        data["_mock"] = True
    return data


def _check_coverage(lat: float, lon: float):
    if not inside_africa(lat, lon):
        raise OutsideCoverage()


def _key(lat: float, lon: float) -> str:
    return f"{round_coord(lat)}:{round_coord(lon)}"


# ------------------------------------------------------------------ endpoints' logic
def zones_geojson() -> dict:
    ttl = current_app.config["CACHE_TTL_STATIC"]
    return _label(_cached("zones", ttl, lambda: provider().zones_geojson()))


def get_profile(lat: float, lon: float) -> dict:
    """S3 'Your land' + S12 watch months. Outside Africa: {outside: true} (S3 already handles that)."""
    if not inside_africa(lat, lon):
        return _label({"outside": True, "message": {"en": "This place is outside the farmland we cover.",
                                                    "fr": "Cet endroit est hors des terres agricoles couvertes."}})

    def build():
        p = provider()
        base = p.profile(lat, lon)
        if base is None:
            return {"data_quality": "no_data"}  # no data cell near this point (e.g. open sea): the app shows its own screen
        if base.get("low_farming_potential"):
            return {"data_quality": "desert"}  # almost no rain: the app shows its desert screen
        wm = p.watch_months(lat, lon)
        base["watch_months"] = wm
        base["data_quality"] = "mock" if p.is_mock else ("ok" if wm is not None else "partial")
        return base

    return _label(_cached(f"profile:{_key(lat, lon)}", current_app.config["CACHE_TTL_PROFILE"], build))


def list_crops(zone_id: Optional[int]) -> dict:
    crops = _cached(f"crops:{zone_id}", current_app.config["CACHE_TTL_STATIC"], lambda: provider().crops(zone_id))
    return _label({"zone_id": zone_id, "crops": crops})


def rank_rotations(lat: float, lon: float, req: dict) -> list:
    """S7/S8. req: priorities, last_crop, can_water, can_buy_fertilizer. Returns plans best first, each with score,
    statuses, breakdown (why this score) and scenarios (dry/normal/wet comparison)."""
    _check_coverage(lat, lon)
    cfg = scoring_config()
    ctx = {"priorities": req.get("priorities") or [], "last_crop": req.get("last_crop"),
           "can_water": req.get("can_water"), "can_buy_fertilizer": req.get("can_buy_fertilizer"),
           "weights": req.get("weights")}  # weights: explicit goals (already normalised), else None -> from priorities
    cfg_hash = hashlib.sha1(json.dumps(cfg.as_dict(), sort_keys=True).encode()).hexdigest()[:8]
    key = f"rot:{_key(lat, lon)}:{json.dumps(ctx, sort_keys=True)}:{cfg_hash}"

    def build():
        p = provider()
        plans = p.candidate_plans(lat, lon, ctx)
        if not plans:
            raise NoData("rotation plans")
        ranked = engine.rank_plans(plans, ctx, cfg)
        for plan in ranked:
            plan["scenarios"] = engine.scenario_report(plan, cfg)
        return ranked

    return _cached(key, current_app.config["CACHE_TTL_ROTATIONS"], build)


def no_plans_state(lat: float, lon: float) -> str:
    """Why a place has no rotation plans, in the words the app has screens for: 'desert' or 'no_data'."""
    return "desert" if get_profile(lat, lon).get("data_quality") == "desert" else "no_data"


def known_crop_ids() -> set:
    return {c["id"] for c in provider().crops(None)}


def get_twins(lat: float, lon: float, n: int) -> dict:
    _check_coverage(lat, lon)

    def build():
        p = provider()
        found = p.twins(lat, lon, n)
        return {"origin": {"lat": round_coord(lat), "lon": round_coord(lon), "name": None, "zone_id": p.zone_id_for(lat, lon)},
                "twins": found["twins"], "note": found.get("note")}

    return _label(_cached(f"twins:{_key(lat, lon)}:{n}", current_app.config["CACHE_TTL_STATIC"], build))


def get_window(lat: float, lon: float) -> dict:
    """F10 'Planting usually starts in ...'. Past climate, never a forecast."""
    _check_coverage(lat, lon)

    def build():
        w = provider().planting_window(lat, lon)
        if w is None:
            raise NoData("planting window")
        s, e = w["start_month"], w["end_month"]
        def span(lang):
            a, b = month_name(s, lang), month_name(e, lang)
            return a if s == e else f"{a}-{b}"

        text = {"en": f"Planting usually starts in: {span('en')}",
                "fr": f"Les semis commencent en général en : {span('fr')}"}
        return {"start_month": s, "end_month": e, "text": text, "method": w["method"]}

    return _label(_cached(f"window:{_key(lat, lon)}", current_app.config["CACHE_TTL_STATIC"], build))


def get_passport(lat: Optional[float] = None, lon: Optional[float] = None) -> dict:
    where = "all" if lat is None or lon is None else _key(lat, lon)
    return _label(_cached(f"passport:{where}", current_app.config["CACHE_TTL_STATIC"], lambda: provider().passport(lat, lon)))


def get_proof() -> dict:
    return _label(_cached("proof", current_app.config["CACHE_TTL_STATIC"], lambda: provider().proof()))


def get_faq(lang: str = "en") -> dict:
    return _label(_cached(f"faq:{lang}", current_app.config["CACHE_TTL_STATIC"], lambda: provider().faq(lang)))


def get_advice_index(lang: Optional[str] = None) -> dict:
    return _label(_cached(f"advice-index:{lang}", current_app.config["CACHE_TTL_STATIC"], lambda: provider().advice_index(lang)))


def ask(question: str, lang: str, zone_id: Optional[int]) -> dict:
    """S14. Order: (1) Ojani's RAG, if plugged into app.extensions['rag']; (2) the model, grounded ONLY in the passages
    the keyword search found (mode 'llm'); (3) the best passage itself (mode 'search'). No match: answer None, mode 'none'.
    A model outage or a rejected answer silently falls back to (3), and no match never calls the model."""
    rag = current_app.extensions.get("rag")
    if rag is not None:
        out = rag.answer(question=question, lang=lang, zone_id=zone_id)
        if out:
            return _label({"answer": out["answer"], "sources": out.get("sources", []), "mode": "rag"})
    passages = get_advice_index(lang)["passages"]  # cached; in the real database only passages in this language
    hits = advisor.rank_passages(question, passages, lang)
    faq_item = advisor.match_faq(question, get_faq(lang)["items"], lang)  # a common question: use the passage the FAQ links to
    if faq_item is not None:
        linked = next((p for p in passages if p["id"] == faq_item["passage"]), None)
        if linked is not None:
            hits = [linked] + [h for h in hits if h["id"] != linked["id"]][:2]
    if not hits:
        return _label({"answer": None, "sources": [], "mode": "none"})
    def src(p):
        out = {"id": p["id"], "doc": p["doc"], "page": p["page"]}
        for k in ("licence", "source_url"):  # real documents carry their licence and link: show them with the answer
            if p.get(k):
                out[k] = p[k]
        return out

    llm = current_app.extensions.get("llm")
    if llm is not None and llm.available:
        text = advisor.llm_answer(llm, question, hits, lang)
        if text:
            return _label({"answer": text, "sources": [src(p) for p in hits], "mode": "llm"})
    hit = hits[0]
    return _label({"answer": advisor.extract_answer(question, hit["text"][lang]), "sources": [src(hit)], "mode": "search"})


def explain_plan(lat: float, lon: float, plan_id: str, req: dict, lang: str) -> dict:
    """S8. Explain one plan of the ranked list for this place and answers. Raises NoData when the plan is not among them."""
    plan = next((p for p in rank_rotations(lat, lon, req) if p["id"] == plan_id), None)
    if plan is None:
        raise NoData(f"plan {plan_id!r}")
    return explain_given_plan(plan, lang)


def explain_given_plan(plan: dict, lang: str) -> dict:
    """Model text when available and safe, otherwise the template (source 'template'). Model texts are cached by plan
    content + language (guide section 6); template texts are not, so a model that comes back is used again at once."""
    crops = provider().crops(None)
    cache = current_app.extensions["cache"]
    key = "explain:" + hashlib.sha1(json.dumps([lang, explain.facts(plan, crops, lang)], sort_keys=True).encode()).hexdigest()
    cached = cache.get(key)
    if cached is not None:
        g.cache_hit = True
        return _label({"text": cached["text"], "source": "llm"})
    g.cache_hit = False
    text = explain.llm_text(current_app.extensions.get("llm"), plan, crops, lang)
    if text:
        cache.set(key, {"text": text}, current_app.config["CACHE_TTL_ROTATIONS"])
        return _label({"text": text, "source": "llm"})
    return _label({"text": explain.template_text(plan, crops, lang), "source": "template"})
