"""DatabaseProvider: reads Ojani's Supabase (Postgres) database. Used when ENGINE_MODE=real and DATABASE_URL is set.

How it reads (all read-only, nothing is ever written, no migrations, no SQL string built from user input):
  * the database's own functions, called by fixed name with bound parameters: nearest_cell, get_profile, get_twins,
    get_zones_geojson, get_passport, get_proof. They answer the "which cell is this point in" and "what is its profile"
    questions (PostGIS lives in the database, not here);
  * the tables mirrored in models.py (zones, cells, cell_features, climate_monthly, cell_watch_months, planting_windows,
    crops, reasons, scoring_config, passport_notes) through SQLAlchemy 1.4 `session.query`;
  * engine/plans.py to build rotation candidates from those rows (the rules are Ojani's, ported from engine/rotations.mjs).

Every method returns the same dict shapes as MockProvider. Unknown stays None/empty.

The Advisor corpus (FAO documents cut into page-level passages) is stored ONE LANGUAGE PER PASSAGE, so a real passage has
text for one language only: `text` is {"en": ...} or {"fr": ...}, never a made-up translation. faq(lang) points each question
at its answer passage in `lang` (questions with no passage in that language are left out), and advice_index(lang) keeps only
the passages in `lang`. Search over the passages is done by this backend (services/advisor.py): the database's own vector search
needs an embedding model that runs in Ojani's Edge Function, which is a separate RAG system plugged in via app.extensions["rag"].

`database_url` is a secret: never logged, never returned. Tests inject `session_factory` and `rpc` instead of a URL.
"""
import logging
from contextlib import contextmanager
from typing import Callable, List, Optional

from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from .. import models
from ..engine import plans as plan_engine
from ..errors import ApiError
from ..geo import round_coord
from .base import DataProvider

log = logging.getLogger("fieldshift")

# The only database functions this provider may call, and their parameters. Names and parameters are fixed here,
# so no part of a request can ever become SQL text.
RPC_PARAMS = {
    "nearest_cell": ("p_lat", "p_lon"),
    "get_profile": ("p_lat", "p_lon"),
    "get_twins": ("p_lat", "p_lon"),
    "get_zones_geojson": (),
    "get_passport": (),
    "get_proof": (),
    "get_faq": ("p_lang",),
    "get_advice_index": (),
}

# Display rule from Ojani's Edge Function: climate twins below this similarity are not shown.
TWIN_MIN_SIMILARITY = 0.4
DEFAULT_WINDOW_METHOD = "past-climate rain onset from the database (never a forecast)"

# What the database accepts for anonymous counts (CHECK constraints on feedback and usage_events). The app's own target names are
# mapped onto these; anything else is counted in memory only, never stored and never an error for the farmer.
FEEDBACK_TARGETS = {"plan": "plan", "answer": "answer", "advisor-answer": "answer", "app": "app", "proof": "proof", "passport": "passport"}
EVENT_NAMES = ("visit", "farm_picked", "plan_viewed", "plan_shared", "advisor_asked", "passport_opened", "proof_opened", "offline_downloaded")

# Kept for the hand-off report and a test: what each method reads.
REQUIRED_FROM_OKANI = {
    "zone_id_for": "function nearest_cell + table cells (zone_id)",
    "zones_geojson": "function get_zones_geojson + table zones",
    "profile": "function get_profile",
    "watch_months": "table cell_watch_months",
    "crops": "table crops (in_mvp) + zones.typical_crops",
    "candidate_plans": "tables crops, cell_features, climate_monthly, cell_watch_months, planting_windows, reasons, scoring_config",
    "twins": "function get_twins",
    "planting_window": "table planting_windows",
    "passport": "function get_passport",
    "proof": "function get_proof + table passport_notes",
    "faq": "function get_faq (question + answer passage id per language)",
    "advice_index": "function get_advice_index (passages, one language each, with document, page and licence)",
}


class DatabaseProvider(DataProvider):
    name = "database"

    def __init__(self, database_url: Optional[str] = None, session_factory=None, rpc: Optional[Callable] = None,
                 twin_min_similarity: float = TWIN_MIN_SIMILARITY):
        self.database_url = database_url  # secret
        self._factory = session_factory
        self._rpc_override = rpc
        self.twin_min_similarity = twin_min_similarity

    # ------------------------------------------------------------------ plumbing
    @property
    def configured(self) -> bool:
        return bool(self.database_url or self._factory)

    def _sessions(self):
        if self._factory is None:
            self._factory = models.make_session_factory(self.database_url)
        return self._factory

    @contextmanager
    def _session(self):
        if not self.configured:
            raise ApiError(503, "database_not_configured", "The database is not configured (set DATABASE_URL).")
        session = self._sessions()()
        try:
            yield session
        except IntegrityError:
            session.rollback()
            raise  # a constraint said no (for example an unknown zone id): the caller decides, it is not an outage
        except SQLAlchemyError as e:
            log.error("database error: %s", type(e).__name__)  # never the message: it can contain the connection string
            raise ApiError(503, "database_unavailable", "The data service is not available right now. Please try again.") from e
        finally:
            session.close()

    def _rpc(self, session, name: str, **params):
        if name not in RPC_PARAMS or set(params) != set(RPC_PARAMS[name]):
            raise ValueError(f"unknown database function call: {name}")
        if self._rpc_override is not None:
            return self._rpc_override(name, **params)
        args = ", ".join(f":{p}" for p in RPC_PARAMS[name])
        return session.execute(text(f"select {name}({args})"), params).scalar()

    def _cell_id(self, session, lat: float, lon: float) -> Optional[int]:
        """The grid cell for a point (within the database's own max distance), or None."""
        return self._rpc(session, "nearest_cell", p_lat=round_coord(lat), p_lon=round_coord(lon))

    def status(self) -> str:
        if not self.configured:
            return "not_configured"
        try:
            with self._session() as s:
                s.execute(text("select 1"))
            return "ok"
        except ApiError:
            return "unreachable"

    # ------------------------------------------------------------------ geography
    def zone_id_for(self, lat, lon) -> Optional[int]:
        with self._session() as s:
            cid = self._cell_id(s, lat, lon)
            if cid is None:
                return None
            row = s.query(models.Cell.zone_id).filter(models.Cell.cell_id == cid).first()
            return None if row is None else row[0]

    def zones_geojson(self) -> dict:
        with self._session() as s:
            raw = self._rpc(s, "get_zones_geojson")
            zones = s.query(models.Zone).order_by(models.Zone.zone_id).all()
        features = [{"type": "Feature", "properties": {"zone_id": f["properties"]["zone_id"]}, "geometry": f["geometry"]}
                    for f in raw["features"] if f["properties"].get("zone_id") is not None]
        meta = []
        for z in zones:
            item = {"id": z.zone_id, "color": z.color or "", "name": {"en": z.name_en, "fr": z.name_fr}}
            if z.icon:
                item["icon"] = z.icon
            if z.desc_en and z.desc_fr:
                item["description"] = {"en": z.desc_en, "fr": z.desc_fr}
            meta.append(item)
        return {"type": "FeatureCollection", "features": features, "zones": meta}

    def profile(self, lat, lon) -> Optional[dict]:
        with self._session() as s:
            raw = self._rpc(s, "get_profile", p_lat=round_coord(lat), p_lon=round_coord(lon))
        if not raw or raw.get("no_data"):
            return None
        z = raw["zone"]
        return {
            "zone": {"id": z["id"], "icon": z.get("icon") or "", "name": z["name"], "color": z.get("color")},
            "description": raw["description"], "hazards": raw["hazards"], "soil": raw["soil"],
            "rain_p20": raw.get("rain_p20"), "rain_p50": raw["rain_p50"], "rain_p80": raw.get("rain_p80"),
            "low_farming_potential": bool(raw.get("low_farming_potential")),
        }

    def watch_months(self, lat, lon) -> Optional[dict]:
        with self._session() as s:
            cid = self._cell_id(s, lat, lon)
            rows = [] if cid is None else s.query(models.CellWatchMonth).filter(models.CellWatchMonth.cell_id == cid).order_by(models.CellWatchMonth.month).all()
        if not rows:
            return None
        return {"dry": [r.month for r in rows if r.is_dry], "flood": [r.month for r in rows if r.is_flood],
                "heat": [r.month for r in rows if r.is_heat]}

    # ------------------------------------------------------------------ crops and plans
    @staticmethod
    def _crop_dict(c) -> dict:
        return {"id": c.slug, "name": {"en": c.name_en, "fr": c.name_fr}, "emoji": c.emoji or "", "legume": bool(c.is_legume),
                "family": c.family, "season_length": c.cycle_days}

    def crops(self, zone_id) -> List[dict]:
        with self._session() as s:
            rows = s.query(models.Crop).filter(models.Crop.in_mvp.is_(True)).order_by(models.Crop.crop_id).all()
            typical = None
            if zone_id is not None:
                z = s.query(models.Zone).filter(models.Zone.zone_id == zone_id).first()
                typical = list(z.typical_crops or []) if z is not None else []
        if typical:  # a zone with no typical crops listed shows all of them (unknown is not "none")
            rows = [c for c in rows if c.slug in typical]
        return [self._crop_dict(c) for c in rows]

    def candidate_plans(self, lat, lon, opts: Optional[dict] = None) -> List[dict]:
        opts = opts or {}
        with self._session() as s:
            cid = self._cell_id(s, lat, lon)
            if cid is None:
                return []
            f = s.query(models.CellFeature).filter(models.CellFeature.cell_id == cid).first()
            clim = s.query(models.ClimateMonthly).filter(models.ClimateMonthly.cell_id == cid).order_by(models.ClimateMonthly.month).all()
            flood = [r.month for r in s.query(models.CellWatchMonth).filter(models.CellWatchMonth.cell_id == cid, models.CellWatchMonth.is_flood.is_(True))]
            wins = s.query(models.PlantingWindow).filter(models.PlantingWindow.cell_id == cid, models.PlantingWindow.start_month.isnot(None)).order_by(models.PlantingWindow.season).all()
            crop_rows = s.query(models.Crop).filter(models.Crop.in_mvp.is_(True)).order_by(models.Crop.crop_id).all()
            reasons = {r.code: {"en": r.text_en, "fr": r.text_fr} for r in s.query(models.Reason)}
            cfg = {r.key: r.value for r in s.query(models.ScoringConfig)}
        # Places with almost no rain (desert zone) get no plans from the suitability rules: too few suitable crops.
        if f is None or len(clim) != 12 or any(v is None for v in (f.hz_drought, f.hz_flood, f.hz_heat, f.rain_annual)):
            return []  # incomplete data for this cell: no plans rather than guessed ones
        if any(None in (r.rain_p20, r.rain_p50, r.rain_p80, r.tmean, r.et0) for r in clim):
            return []
        crops = [self._trait_dict(c) for c in crop_rows]
        crops = [c for c in crops if c is not None]  # a crop missing a trait the rules need cannot be placed in a plan
        plant_months = [w.start_month for w in wins]
        if not plant_months:  # steady rain all year: start after the driest month (same rule as Ojani's Edge Function)
            driest = min(clim, key=lambda r: r.rain_p50)
            plant_months = [(driest.month % 12) + 1]
        cell = {"cell_id": cid, "rain_annual": f.rain_annual, "ph": f.ph, "soc": f.soc, "n_seasons": f.n_seasons,
                "hz": {"drought": f.hz_drought, "flood": f.hz_flood, "heat": f.hz_heat}}
        climate = [{"month": r.month, "rain_p20": r.rain_p20, "rain_p50": r.rain_p50, "rain_p80": r.rain_p80, "tmean": r.tmean, "et0": r.et0} for r in clim]
        rules = plan_engine.PlanRules().with_db_config(cfg)
        out = plan_engine.generate_plans(cell, climate, crops, reasons, flood, plant_months, {
            "last_crop": opts.get("last_crop"), "can_water": opts.get("can_water"), "can_buy_fertilizer": opts.get("can_buy_fertilizer")}, rules)
        return [{**p, "why": [{"en": w["en"], "fr": w["fr"]} for w in p["why"]],
                 "warnings": [{"en": w["en"], "fr": w["fr"]} for w in p["warnings"]]} for p in out["plans"]]

    @staticmethod
    def _trait_dict(c) -> Optional[dict]:
        needed = (c.slug, c.family, c.is_legume, c.cycle_days, c.kc_avg, c.drought_tol, c.flood_tol, c.heat_tol, c.cover, c.income_idx)
        if any(v is None for v in needed):
            return None
        return {k: getattr(c, k) for k in ("slug", "family", "is_legume", "cycle_days", "tmin_abs", "tmin_opt", "tmax_opt", "tmax_abs",
                                           "rain_min_abs", "rain_min_opt", "rain_max_opt", "rain_max_abs", "ph_min_abs", "ph_min_opt",
                                           "ph_max_opt", "ph_max_abs", "kc_avg", "drought_tol", "flood_tol", "heat_tol", "cover",
                                           "income_idx", "in_mvp")}

    # ------------------------------------------------------------------ twins, window
    def twins(self, lat, lon, n) -> dict:
        with self._session() as s:
            raw = self._rpc(s, "get_twins", p_lat=round_coord(lat), p_lon=round_coord(lon))
        found = [t for t in ((raw or {}).get("twins") or []) if t.get("similarity") is not None and t["similarity"] >= self.twin_min_similarity]
        twins = [{"name": t["name"], "country": t["country"], "lat": t["lat"], "lon": t["lon"], "similarity": t["similarity"],
                  "crops": t.get("crops") or [], "reason": t["reason"]} for t in found[:n]]
        note = None if twins else f"No similar place found (twins below {self.twin_min_similarity} similarity are not shown)."
        return {"twins": twins, "note": note}

    def planting_window(self, lat, lon) -> Optional[dict]:
        with self._session() as s:
            cid = self._cell_id(s, lat, lon)
            row = None if cid is None else s.query(models.PlantingWindow).filter(
                models.PlantingWindow.cell_id == cid, models.PlantingWindow.season == 1).first()
        if row is None or row.start_month is None or row.end_month is None:
            return None  # e.g. steady rain all year: the database has no onset to report
        return {"start_month": row.start_month, "end_month": row.end_month, "method": row.method or DEFAULT_WINDOW_METHOD}

    # ------------------------------------------------------------------ trust pages
    def passport(self, lat, lon) -> dict:
        with self._session() as s:
            raw = self._rpc(s, "get_passport")
        rows = [{"variable": {"en": r["label_en"] or r["variable"], "fr": r["label_fr"] or r["variable"]}, "value": None,
                 "dataset": r["dataset"], "version": r.get("version"), "resolution": r.get("resolution"),
                 "period": r.get("period"), "accessed": r.get("accessed"), "status": "sourced", "how": r.get("how"),
                 "caveat": r.get("caveat"), "licence": r.get("licence"), "url": r.get("url")} for r in raw["sources"]]
        keep = ("limitation", "assumption")  # what the Passport page lists as limits
        limits = [{"en": n["en"], "fr": n["fr"]} for n in raw["notes"] if n["kind"] in keep]
        validation = {"methods": [{"en": n["en"], "fr": n["fr"]} for n in raw["notes"] if n["kind"] == "method"],
                      "scoring_config": raw.get("config", []),
                      "note": "values per place are not part of the Passport yet (value is null)"}
        return {"rows": rows, "limits": limits, "validation": validation}

    def proof(self) -> dict:
        with self._session() as s:
            raw = self._rpc(s, "get_proof")
            note = s.query(models.PassportNote).filter(models.PassportNote.kind == "method", models.PassportNote.text_en.like("Backtest%")).first()
        events = []
        for e in raw["events"]:
            hit, chance = e.get("hit"), e.get("chance")  # the database reports both as percentages of flagged cells
            events.append({
                "id": e["id"], "name": {"en": e["name"], "fr": e.get("name_fr") or e["name"]},
                "hit_rate": None if hit is None else hit / 100, "baseline": None if chance is None else chance / 100,
                "status": "not_computed" if hit is None else ("above_chance" if hit > (chance or 0) else "miss"),
                "kind": e.get("kind"), "years": e.get("years"), "cells_total": e.get("of"), "misses": e.get("misses"),
                "misses_note": e.get("misses_note"), "reference": e.get("reference"),
            })
        if raw.get("ndvi"):
            log.warning("get_proof returned NDVI results, which this provider does not map yet; ndvi_correlation stays null")
        notes = {"en": note.text_en, "fr": note.text_fr} if note else {"en": "No backtest note is stored yet.", "fr": "Aucune note de test n'est encore enregistrée."}
        return {"events": events, "ndvi_correlation": None, "notes": notes}

    # ------------------------------------------------------------------ anonymous counts (the only thing this provider writes)
    def _insert(self, make_row, with_zone: Optional[int]) -> bool:
        """Insert one row. A zone id that does not exist is dropped (the count is still kept). Never raises: a failed write must not
        break the app, and the caller still counts in memory."""
        for zone in ([with_zone, None] if with_zone is not None else [None]):
            try:
                with self._session() as s:
                    s.add(make_row(zone))
                    s.commit()
                return True
            except IntegrityError:
                continue  # unknown zone id: retry without it
            except ApiError:
                return False  # database unreachable (already logged)
            except Exception as e:  # noqa: BLE001
                log.error("anonymous count not stored (%s)", type(e).__name__)
                return False
        return False

    def record_feedback(self, target, value, zone=None, lang=None) -> bool:
        mapped = FEEDBACK_TARGETS.get(target)
        if mapped is None or value not in ("up", "down"):
            return False
        return self._insert(lambda z: models.Feedback(target=mapped, value=1 if value == "up" else -1, zone_id=z, lang=lang), zone)

    def record_event(self, name, zone=None) -> bool:
        if name not in EVENT_NAMES:
            return False
        return self._insert(lambda z: models.UsageEvent(name=name, zone_id=z), zone)

    def stats(self) -> Optional[dict]:
        try:
            with self._session() as s:
                fb = s.query(models.Feedback.target, models.Feedback.value, func.count()).group_by(models.Feedback.target, models.Feedback.value).all()
                ev = s.query(models.UsageEvent.name, models.UsageEvent.zone_id, func.count()).group_by(models.UsageEvent.name, models.UsageEvent.zone_id).all()
        except ApiError:
            return None
        feedback, events = {}, {}
        for target, value, n in fb:
            feedback.setdefault(target, {"up": 0, "down": 0})["up" if value == 1 else "down"] = n
        for name, zone, n in ev:
            events.setdefault(name, {})["none" if zone is None else str(zone)] = n
        return {"feedback": feedback, "events": events}

    # ------------------------------------------------------------------ advisor corpus (FAQ + passages)
    def faq(self, lang: str = "en") -> dict:
        with self._session() as s:
            raw = self._rpc(s, "get_faq", p_lang=lang)
        items = []
        for it in raw["items"]:
            passage = (it.get("passage") or {}).get(lang)
            if passage is None:
                continue  # no answer passage in this language: the app could not show an answer, so the question is not offered
            items.append({"id": it["id"], "emoji": it.get("emoji") or "", "passage": str(passage),
                          "q": {"en": it["q"]["en"], "fr": it["q"]["fr"]}, "status": it.get("status")})
        return {"items": items}

    def advice_index(self, lang: Optional[str] = None) -> dict:
        with self._session() as s:
            raw = self._rpc(s, "get_advice_index")
        passages = []
        for p in raw["passages"]:
            text = {k: v for k, v in (p.get("text") or {}).items() if k in ("en", "fr") and v}
            if not text or (lang is not None and lang not in text):
                continue
            passages.append({"id": str(p["id"]), "doc": p["doc"], "page": p["page"], "licence": p["licence"], "text": text,
                             "keywords": {k: v for k, v in (p.get("keywords") or {}).items() if k in text},
                             "lang": p.get("lang"), "source_url": p.get("source_url")})
        return {"version": str(raw["version"]), "passages": passages}
