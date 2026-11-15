"""THE API CONTRACT: pydantic (v1 style) models for what the endpoints return and accept.

These describe the JSON the React screens read (see public/mock/*.json and src/). They are NOT database tables:
tables live in models.py (SQLAlchemy -> the Supabase/Postgres database). Keeping the two apart means a database
column can change without breaking the frontend: services/engine_client.py is the only place that converts
provider data into these schemas.

Responses are validated against these models before they are sent (routes/_util.ok), and tests validate every mock
fixture too, so mock and real answers cannot drift apart. Do not add fields the frontend does not use or the
engine does not provide.
"""
import math
from typing import Dict, List, Optional, Tuple

from pydantic import BaseModel, Field, conint, conlist, constr, root_validator, validator
from typing_extensions import Literal

Lang = Literal["en", "fr"]
Slug = constr(regex=r"^[a-z0-9_-]{1,40}$")


class Contract(BaseModel):
    """Responses: strict. A stray or renamed field fails."""

    class Config:
        extra = "forbid"
        allow_population_by_field_name = True


class Request(BaseModel):
    """Requests: lenient about unknown keys (the frontend may send more), strict about the ones we use."""

    class Config:
        extra = "ignore"


class Bilingual(Contract):
    en: str
    fr: str


# ---------------------------------------------------------------- requests
class LatLon(Request):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    lang: Lang = "en"

    @validator("lat", "lon")
    def _finite(cls, v):
        if not math.isfinite(v):
            raise ValueError("must be a finite number")
        return v


class TwinsQuery(LatLon):
    n: int = Field(5, ge=1, le=10)


class LangQuery(Request):
    lang: Lang = "en"


class PassportQuery(Request):
    """The Passport is about the whole app's data, not one place: lat/lon are accepted (guide) but optional."""

    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)
    lang: Lang = "en"


class AdviceIndexQuery(Request):
    lang: Optional[Lang] = None  # None = passages of every language


class CropsQuery(Request):
    zone_id: Optional[int] = Field(None, ge=1, le=99)
    lang: Lang = "en"


class RotationRequest(LatLon):
    """Roadmap 05 section 6: the frontend sends priorities (1-2 of money/water/soil/safety), optional last crop and
    two yes/no answers. The current frontend sends only lat/lon and ranks client-side, which stays valid."""

    priorities: List[Literal["money", "water", "soil", "safety"]] = []
    lastCrop: Optional[str] = None  # a crop id, 'none', or null
    canWater: Optional[bool] = None
    canBuyFertilizer: Optional[bool] = None
    # Backend Guide section 3/4 form (optional alternative to the fields above). Names map one to one:
    # income=money, water=water, soil=soil, resilience=safety; irrigation=canWater, fertilizer=canBuyFertilizer.
    goals: Optional["Goals"] = None
    constraints: Optional["Constraints"] = None

    @root_validator(pre=True)
    def _snake_case_names(cls, v):
        """The app (docs/API_CONTRACT.md) sends last_crop; the guide-style camelCase names stay valid too."""
        v = dict(v)
        for snake, camel in (("last_crop", "lastCrop"), ("can_water", "canWater"), ("can_buy_fertilizer", "canBuyFertilizer")):
            if camel not in v and snake in v:
                v[camel] = v[snake]
        return v

    @validator("priorities")
    def _max_two(cls, v):
        if len(set(v)) > 2:
            raise ValueError("choose at most 2 priorities")
        return v

    def inputs(self) -> dict:
        """The engine inputs this request means. Explicit fields win over the guide-style `constraints`.
        `goals` (when given) replace the priority weights: each is 0-1 and they are normalised to sum to 1."""
        c = self.constraints
        can_water = self.canWater if self.canWater is not None else (c.irrigation if c else None)
        can_fert = self.canBuyFertilizer if self.canBuyFertilizer is not None else (c.fertilizer if c else None)
        last = None if self.lastCrop in (None, "", "none") else self.lastCrop  # S4 sends 'none' for "no last crop"
        out = {"priorities": self.priorities, "last_crop": last, "can_water": can_water, "can_buy_fertilizer": can_fert}
        if self.goals is not None:
            out["weights"] = self.goals.normalised()
        return out


class Goals(Request):
    """Guide section 4. Each value 0-1; normalised server-side so they sum to 1. All zero is rejected."""

    income: float = Field(0.25, ge=0, le=1)
    water: float = Field(0.25, ge=0, le=1)
    soil: float = Field(0.25, ge=0, le=1)
    resilience: float = Field(0.25, ge=0, le=1)

    @root_validator
    def _not_all_zero(cls, v):
        if v.get("income", 0) + v.get("water", 0) + v.get("soil", 0) + v.get("resilience", 0) <= 0:
            raise ValueError("at least one goal must be above 0")
        return v

    def normalised(self) -> dict:
        total = self.income + self.water + self.soil + self.resilience
        if total <= 0:
            raise ValueError("goals: at least one value must be above 0")
        return {"money": self.income / total, "water": self.water / total, "soil": self.soil / total,
                "safety": self.resilience / total}


class Constraints(Request):
    """Guide section 4. `short_season` is accepted but has no effect: the engine has no rule for it yet.
    Unlike the guide, unspecified values are unknown (null), not False, so nothing is penalised by default."""

    irrigation: Optional[bool] = None
    fertilizer: Optional[bool] = None
    short_season: Optional[bool] = None


RotationRequest.update_forward_refs()


class AskRequest(Request):
    question: constr(strip_whitespace=True, min_length=1, max_length=300)
    lang: Lang = "en"
    zone_id: Optional[int] = Field(None, ge=1, le=99)


class FeedbackRequest(Request):
    target: Slug
    value: Literal["up", "down"]
    zone: Optional[int] = Field(None, ge=1, le=99)
    lang: Optional[Lang] = None


class ExplainRequest(RotationRequest):
    """Guide section 3: send the `plan` object (as /api/rotations returned it) + lang. Or send `plan_id` with the same
    inputs as /api/rotations (lat, lon, ...) and the plan is looked up in the rebuilt ranked list."""

    lat: Optional[float] = Field(None, ge=-90, le=90)
    lon: Optional[float] = Field(None, ge=-180, le=180)
    plan: Optional[dict] = None  # validated against the Plan schema in the route
    plan_id: Optional[Slug] = None

    @root_validator
    def _plan_or_id(cls, v):
        if v.get("plan") is None and not (v.get("plan_id") and v.get("lat") is not None and v.get("lon") is not None):
            raise ValueError("send either `plan`, or `plan_id` together with lat and lon")
        return v


class EventRequest(Request):
    name: Slug
    zone: Optional[int] = Field(None, ge=1, le=99)


# ---------------------------------------------------------------- shared response bits
class MockFlag(Contract):
    mock: Optional[bool] = Field(None, alias="_mock")  # present (true) on every object answer served from fixtures


# /api/health
class HealthResponse(Contract):
    status: Literal["ok"]
    version: str
    db: str  # "mock" | "not_configured" | "schema_pending" | "ok"
    mode: str


# /api/zones (S10)
class ZoneProps(Contract):
    zone_id: int


class PointGeometry(Contract):
    type: Literal["Point"]
    coordinates: Tuple[float, float]  # [lon, lat] (GeoJSON order)


class ZoneFeature(Contract):
    type: Literal["Feature"]
    properties: ZoneProps
    geometry: PointGeometry


class ZoneMeta(Contract):
    id: int
    color: str
    name: Bilingual
    description: Optional[Bilingual] = None  # guide section 3; None = not provided (never guessed)
    icon: Optional[str] = None  # emoji of the zone (real database)


class ZonesResponse(MockFlag):
    type: Literal["FeatureCollection"]
    note: Optional[str] = Field(None, alias="_note")
    features: List[ZoneFeature]
    zones: List[ZoneMeta]


# /api/profile (S3, S12)
class ZoneInfo(Contract):
    id: int
    icon: str
    name: Bilingual
    pic: Optional[str] = None  # frontend picture key (added to the frontend mock; passed through unchanged)
    color: Optional[str] = None  # zone colour (real database)


class Hazards(Contract):
    drought: conint(ge=1, le=5)
    flood: conint(ge=1, le=5)
    heat: conint(ge=1, le=5)
    erosion: conint(ge=1, le=5)


class WatchMonths(Contract):
    dry: List[conint(ge=1, le=12)]
    flood: List[conint(ge=1, le=12)]
    heat: List[conint(ge=1, le=12)]


class ProfileData(Contract):
    """Exactly what the profile fixture and the S3 screen use."""

    zone: ZoneInfo
    description: Bilingual
    hazards: Hazards
    rain_p50: conlist(float, min_items=12, max_items=12)
    soil: Bilingual
    rain_p20: Optional[conlist(float, min_items=12, max_items=12)] = None  # guide section 3: p20/p50/p80 (real database only)
    rain_p80: Optional[conlist(float, min_items=12, max_items=12)] = None
    low_farming_potential: Optional[bool] = None  # real database: almost no rain (desert); the app shows a friendly screen


class ProfileResponse(ProfileData, MockFlag):
    watch_months: Optional[WatchMonths] = None  # None = no data (S12 shows "not available")
    data_quality: Literal["mock", "ok", "partial"]


class ProfileState(MockFlag):
    """A place the app cannot advise on, as a normal 200 answer (docs/API_CONTRACT.md section 1): the app shows a friendly
    spoken screen for each. no_data = no data cell near this point (open sea, or too far from any cell)."""

    data_quality: Literal["desert", "no_data"]


class OutsideResponse(MockFlag):
    outside: Literal[True]
    message: Bilingual


# /api/rotations (S7, S8): the answer is a bare ARRAY of plans because the frontend maps over it directly.
class SeasonStep(Contract):
    crop: str
    month: Optional[conint(ge=1, le=12)] = None
    water: Optional[conlist(Literal["enough", "risky", "not_enough"], min_items=3, max_items=3)] = None  # dry, normal, wet


class SubScores(Contract):
    money: float = Field(..., ge=0, le=1)
    water: float = Field(..., ge=0, le=1)
    soil: float = Field(..., ge=0, le=1)
    safety: float = Field(..., ge=0, le=1)


class ScenScores(Contract):
    dry: float = Field(..., ge=0, le=1)
    normal: float = Field(..., ge=0, le=1)
    wet: float = Field(..., ge=0, le=1)


class PlanFixture(Contract):
    """A candidate plan as the provider supplies it (and as public/mock/rotations.json has it)."""

    id: str
    kind: str
    sequence: List[SeasonStep]
    sub: SubScores
    scen: ScenScores
    reason: Bilingual
    why: List[Bilingual]
    warnings: List[Bilingual]


class ScenarioLine(Contract):
    score: float
    delta_vs_normal: float
    status: Literal["good", "warn", "bad"]
    water: Dict[str, int]


class Plan(PlanFixture):
    score: Optional[float] = Field(None, ge=0, le=1)
    statuses: List[Literal["good", "warn", "bad", "unknown"]]
    breakdown: dict  # weights, contributions, adjustments: see engine/scoring.py
    scenarios: Optional[Dict[str, ScenarioLine]] = None


class LowPotentialResponse(MockFlag):
    """No rotation plans for this place (desert, no data cell, or no crop that suits it): a normal answer the app turns into
    the same friendly screen as the profile states, not an error."""

    low_potential: Literal[True]
    state: Literal["desert", "no_data"]
    plans: List[Plan] = []


# /api/twins (S11)
class TwinOrigin(Contract):
    lat: float
    lon: float
    name: Optional[str] = None
    zone_id: Optional[int] = None


class Twin(Contract):
    name: str
    country: str
    lat: float
    lon: float
    similarity: float = Field(..., ge=0, le=1)
    crops: List[str]
    reason: Bilingual
    zone_id: Optional[int] = None  # guide section 3; None = not provided


class TwinsResponse(MockFlag):
    origin: TwinOrigin
    twins: List[Twin]
    note: Optional[str] = None


# /api/window
class WindowResponse(MockFlag):
    start_month: conint(ge=1, le=12)
    end_month: conint(ge=1, le=12)
    text: Bilingual
    method: str


# /api/crops
class Crop(Contract):
    id: str
    name: Bilingual
    emoji: str
    legume: bool
    family: Optional[str] = None  # None = unknown (never guessed)
    season_length: Optional[int] = None


class CropsResponse(MockFlag):
    zone_id: Optional[int] = None
    crops: List[Crop]


# /api/passport (S20), /api/proof (S21)
class PassportRow(Contract):
    variable: Bilingual
    value: Optional[float] = None
    dataset: str
    version: Optional[str] = None
    resolution: Optional[str] = None
    period: Optional[str] = None
    accessed: Optional[str] = None
    status: str
    how: Optional[str] = None  # how the dataset is used (real database; English text)
    caveat: Optional[str] = None  # what to be careful about
    licence: Optional[str] = None
    url: Optional[str] = None


class PassportResponse(MockFlag):
    rows: List[PassportRow]
    limits: List[Bilingual]
    validation: dict


class ProofEvent(Contract):
    id: str
    name: Bilingual
    hit_rate: Optional[float] = None
    baseline: Optional[float] = None
    status: str
    kind: Optional[str] = None  # drought | flood (real database)
    years: Optional[str] = None
    cells_total: Optional[int] = None
    misses: Optional[int] = None  # number of cells the rule did not flag during the event
    misses_note: Optional[Bilingual] = None  # the misses are shown, not hidden
    reference: Optional[str] = None


class ProofResponse(MockFlag):
    events: List[ProofEvent]
    ndvi_correlation: Optional[float] = None
    notes: Bilingual


# /api/faq, /api/advice-index, /api/ask (S14-S16)
class FaqItem(Contract):
    id: str
    emoji: str
    passage: str  # id of the passage (in the requested language) that answers the question
    q: Bilingual
    status: Optional[str] = None  # real database: draft | reviewed | published (a draft has not been reviewed by a person)


class FaqResponse(MockFlag):
    items: List[FaqItem]


class Passage(Contract):
    id: str
    doc: str
    page: int
    licence: str
    sample: Optional[bool] = None
    text: Dict[str, str]  # {en, fr} for the sample passages; real documents are stored one language per passage: one key
    keywords: Dict[str, List[str]]
    lang: Optional[str] = None  # the language of a one-language passage (real database)
    source_url: Optional[str] = None

    @validator("text")
    def _has_text(cls, v):
        if not v or not set(v) <= {"en", "fr"} or not all(isinstance(t, str) and t for t in v.values()):
            raise ValueError("text must have an en and/or fr string")
        return v


class AdviceIndexResponse(MockFlag):
    version: str
    passages: List[Passage]


class Source(Contract):
    id: Optional[str] = None
    doc: str
    page: int
    licence: Optional[str] = None
    source_url: Optional[str] = None


class AskResponse(MockFlag):
    answer: Optional[str] = None  # None = no good match: the app says "ask an agronomist"
    sources: List[Source]
    mode: Literal["search", "none", "llm", "rag"]


# /api/explain
class ExplainResponse(MockFlag):
    text: str
    source: Literal["llm", "template"]


# /api/feedback, /api/event, /api/stats
class OkResponse(Contract):
    ok: Literal[True]


class StatsResponse(Contract):
    feedback: Dict[str, Dict[str, int]]
    events: Dict[str, Dict[str, int]]
    storage: str
