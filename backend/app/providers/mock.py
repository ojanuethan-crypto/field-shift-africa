"""MockProvider: answers come from the clearly-labelled fixtures in backend/app/mock/. NOT real agricultural data.

Anything the fixtures cannot answer is returned as None / empty (honest "no data"), never invented:
  * profiles exist for zones 1-3 only; watch months only for zone 3; twins only for zone 3.
  * the zone of a point is the frontend's crude latitude-band guess (mockZoneId in src/api/hooks.js), kept identical
    on purpose so the API and the React mock mode agree. It is NOT a real zone lookup.
"""
from typing import List, Optional

from ..services import mock_data
from .base import DataProvider


def mock_zone_id(lat: float) -> int:
    """Port of mockZoneId() in src/api/hooks.js. Mock only."""
    if lat >= 12:
        return 1
    if lat >= 7.5:
        return 2
    if lat <= -8:
        return 2
    return 3


class MockProvider(DataProvider):
    name = "mock"
    is_mock = True

    def status(self) -> str:
        return "mock"

    def zone_id_for(self, lat: float, lon: float) -> Optional[int]:
        return mock_zone_id(lat)

    def zones_geojson(self) -> dict:
        data = mock_data.load("zones.geojson")
        data["zones"] = mock_data.load("zones_meta.json")["zones"]
        return data

    def profile(self, lat: float, lon: float) -> Optional[dict]:
        return mock_data.load("profiles.json").get(str(mock_zone_id(lat)))

    def watch_months(self, lat: float, lon: float) -> Optional[dict]:
        # The only fixture is the Douala example (zone 3). Other zones: unknown.
        if mock_zone_id(lat) != 3:
            return None
        w = mock_data.load("watch.json")
        return {"dry": w["dry"], "flood": w["flood"], "heat": w["heat"]}

    def crops(self, zone_id: Optional[int]) -> List[dict]:
        crops = mock_data.load("crops.json")["crops"]
        if zone_id is None:
            return crops
        used = {s["crop"] for p in mock_data.load("rotations.json").get(str(zone_id), []) for s in p["sequence"]}
        return [c for c in crops if c["id"] in used]  # mock: "crops that appear in this zone's mock plans"

    def candidate_plans(self, lat: float, lon: float, opts: Optional[dict] = None) -> List[dict]:
        return mock_data.load("rotations.json").get(str(mock_zone_id(lat)), [])

    def twins(self, lat: float, lon: float, n: int) -> dict:
        if mock_zone_id(lat) != 3:
            return {"twins": [], "note": "No twin places in the mock data for this zone."}
        return {"twins": mock_data.load("twins.json")["twins"][:n], "note": None}

    def planting_window(self, lat: float, lon: float) -> Optional[dict]:
        # Mock method: first-season planting months of this zone's mock plans. NOT computed from rainfall.
        months = [p["sequence"][0]["month"] for p in self.candidate_plans(lat, lon)
                  if p["sequence"] and p["sequence"][0].get("month")]
        if not months:
            return None
        return {"start_month": min(months), "end_month": max(months),
                "method": "mock: planting months of the mock plans, not computed from rainfall"}

    def passport(self, lat: float, lon: float) -> dict:
        d = mock_data.load("passport.json")
        d.pop("_note", None)
        return d

    def proof(self) -> dict:
        d = mock_data.load("proof.json")
        d.pop("_note", None)
        return d

    def faq(self, lang: str = "en") -> dict:
        return {"items": mock_data.load("faq.json")["items"]}

    def advice_index(self, lang: Optional[str] = None) -> dict:
        d = mock_data.load("advice-index.json")
        return {"version": d["version"], "passages": d["passages"]}
