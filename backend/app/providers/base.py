"""The data-provider interface. The engine and the routes only ever talk to this, never to a database or a file.

Every method returns plain dicts/lists (JSON-ready). A method returns None (or an empty list) when there is NO DATA
for the request: callers turn that into an honest "no data" answer, never a guess.
Two implementations: MockProvider (labelled fixtures) and DatabaseProvider (Supabase/Postgres, schema pending).
"""
from abc import ABC, abstractmethod
from typing import List, Optional


class DataProvider(ABC):
    name = "abstract"
    is_mock = False

    @abstractmethod
    def status(self) -> str:
        """Short status for /api/health: 'mock', 'not_configured', 'schema_pending', 'ok'."""

    @abstractmethod
    def zone_id_for(self, lat: float, lon: float) -> Optional[int]:
        """Resilience-zone id for a point, or None when unknown."""

    @abstractmethod
    def zones_geojson(self) -> dict:
        """GeoJSON FeatureCollection of points with properties.zone_id, plus `zones` metadata [{id, color, name{en,fr}}]."""

    @abstractmethod
    def profile(self, lat: float, lon: float) -> Optional[dict]:
        """{zone{id,icon,name}, description, hazards{drought,flood,heat,erosion}, rain_p50[12], soil{en,fr}} or None."""

    @abstractmethod
    def watch_months(self, lat: float, lon: float) -> Optional[dict]:
        """{dry:[months], flood:[months], heat:[months]} from past climate, or None when not available."""

    @abstractmethod
    def crops(self, zone_id: Optional[int]) -> List[dict]:
        """[{id, name{en,fr}, emoji, legume, family|None, season_length|None}] (zone_id None = all crops)."""

    @abstractmethod
    def candidate_plans(self, lat: float, lon: float, opts: Optional[dict] = None) -> List[dict]:
        """`opts` (last_crop, can_water, can_buy_fertilizer) lets a real provider build plans for the farmer's answers; the mock ignores it. Unscored candidate rotation plans for the place: [{id, kind, sequence[{crop,month,water[3]}], sub{...},
        scen{dry,normal,wet}, reason, why, warnings}]. Empty list when none."""

    @abstractmethod
    def twins(self, lat: float, lon: float, n: int) -> dict:
        """{twins: [{name, country, lat, lon, similarity, crops[], reason{en,fr}}], note: str|None}."""

    @abstractmethod
    def planting_window(self, lat: float, lon: float) -> Optional[dict]:
        """{start_month, end_month, method} from past climate (never a forecast), or None."""

    @abstractmethod
    def passport(self, lat: float, lon: float) -> dict:
        """Data Passport: {rows[...], limits[...], validation{...}}."""

    @abstractmethod
    def proof(self) -> dict:
        """Backtest evidence: {events[...], ndvi_correlation, notes}."""

    # Optional: anonymous counts. Providers without durable storage keep the defaults (the API then counts in memory only).
    def record_feedback(self, target: str, value: str, zone: Optional[int] = None, lang: Optional[str] = None) -> bool:
        """Store one anonymous thumb. Returns True only if it was stored durably."""
        return False

    def record_event(self, name: str, zone: Optional[int] = None) -> bool:
        """Store one anonymous usage event. Returns True only if it was stored durably."""
        return False

    def stats(self) -> Optional[dict]:
        """{feedback: {target: {up, down}}, events: {name: {zone: n}}} from durable storage, or None."""
        return None

    @abstractmethod
    def faq(self, lang: str = "en") -> dict:
        """{items[{id, emoji, passage, q{en,fr}, status?}]}; `passage` is the id of the answer passage in `lang`."""

    @abstractmethod
    def advice_index(self, lang: Optional[str] = None) -> dict:
        """{version, passages[{id, doc, page, licence, text{lang: str}, keywords{lang: [...]}}]}; `lang` keeps only passages
        that have text in that language (None = all)."""
