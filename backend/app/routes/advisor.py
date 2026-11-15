from flask import Blueprint, current_app

from ..errors import ApiError
from ..extensions import limiter
from ..schemas import AdviceIndexQuery, AdviceIndexResponse, AskRequest, AskResponse, ExplainRequest, ExplainResponse, FaqResponse, LangQuery, Plan
from ..services import engine_client
from ._util import body, ok, query

bp = Blueprint("advisor", __name__)


@bp.get("/faq")
def faq():
    """Common questions (S15). `lang` picks which language's passage each item's `passage` id points at."""
    return ok(FaqResponse, engine_client.get_faq(query(LangQuery).lang))


@bp.get("/advice-index")
def advice_index():
    """The bundled passages (S14-S16). The app keeps a copy for offline search. Optional `lang` keeps one language only
    (real documents are stored one language per passage, so the app should pass its language)."""
    return ok(AdviceIndexResponse, engine_client.get_advice_index(query(AdviceIndexQuery).lang))


@bp.post("/ask")
@limiter.limit(lambda: current_app.config["RATELIMIT_ASK"])
def ask():
    """Ask the Advisor (S14). Body: question, lang, optional zone_id.
    mode 'llm' = model answer grounded in the matched passages, 'search' = the best passage itself (no model / model failed),
    'none' = no good match (answer null), 'rag' = Ojani's RAG, when connected."""
    req = body(AskRequest)
    return ok(AskResponse, engine_client.ask(req.question, req.lang, req.zone_id))


@bp.post("/explain")
@limiter.limit(lambda: current_app.config["RATELIMIT_ASK"])
def explain():
    """Plain-language explanation of one plan (S8). Body: `plan` (as /api/rotations returned it) + lang, or `plan_id` with
    the /api/rotations inputs. source 'llm' = model wording of the plan's own facts, 'template' = fixed wording."""
    req = body(ExplainRequest)
    if req.plan is not None:
        plan = Plan.parse_obj(req.plan).dict(by_alias=True)  # must be a complete plan: 422 otherwise
        return ok(ExplainResponse, engine_client.explain_given_plan(plan, req.lang))
    inputs = req.inputs()
    if inputs["last_crop"] is not None and inputs["last_crop"] not in engine_client.known_crop_ids():
        raise ApiError(422, "invalid_request", f"lastCrop: unknown crop {inputs['last_crop']!r}")
    return ok(ExplainResponse, engine_client.explain_plan(req.lat, req.lon, req.plan_id, inputs, req.lang))
