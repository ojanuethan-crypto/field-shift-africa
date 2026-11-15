"""Scoring configuration. Every default says where it comes from. Nothing here is an agronomic finding.

Override at runtime with the SCORING_CONFIG_JSON environment variable (a JSON object of field names), for example:
    SCORING_CONFIG_JSON={"same_crop_as_last_penalty": 0.1}
"""
import json
from dataclasses import dataclass, fields, replace
from typing import Optional

CRITERIA = ("money", "water", "soil", "safety")  # the four priority cards (Roadmap F06)


@dataclass(frozen=True)
class ScoringConfig:
    # Priority -> weights. Source: Roadmap 05, section 6 "Priority mapping".
    one_priority_high: float = 0.55
    one_priority_low: float = 0.15
    two_priorities_high: float = 0.40
    two_priorities_low: float = 0.10
    # No priority chosen: equal weights. Source: frontend src/data/scoring.js (weightsFromPriorities).
    neutral_weight: float = 0.25
    # Score adjustments. Source: frontend src/data/scoring.js (mock-era values, provisional, NOT agronomic findings).
    unwatered_season_penalty: float = 0.04  # per season whose normal-year water status is "not_enough", if canWater is false
    same_crop_as_last_penalty: float = 0.08  # first crop equals the crop grown last
    # Status display thresholds on a 0-1 score. Source: frontend S8RouteDetail.jsx (UI colouring, not agronomic).
    status_good_at: float = 0.70
    status_warn_at: float = 0.50

    @classmethod
    def from_mapping(cls, data: Optional[dict]) -> "ScoringConfig":
        data = data or {}
        allowed = {f.name for f in fields(cls)}
        unknown = set(data) - allowed
        if unknown:
            raise ValueError(f"unknown scoring settings: {sorted(unknown)}")
        return replace(cls(), **{k: float(v) for k, v in data.items()})

    @classmethod
    def from_env_json(cls, raw: Optional[str]) -> "ScoringConfig":
        return cls.from_mapping(json.loads(raw) if raw else None)

    def as_dict(self) -> dict:
        return {f.name: getattr(self, f.name) for f in fields(self)}
