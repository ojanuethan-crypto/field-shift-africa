"""The agricultural engine: pure, database-independent functions.

Nothing in this package imports Flask, SQLAlchemy or any data source. Data arrives as plain dicts from a provider
(see backend/app/providers), so the same code runs on mock fixtures today and on the real database later.
(Plan explanation text / LLM answers are NOT here: they belong to Ojani's RAG system.)
"""
from .config import CRITERIA, ScoringConfig
from .rotation import build_plans, generate_sequences
from .scenarios import scenario_report
from .scoring import rank_plans, score_plan, season_statuses, weights_from_priorities
from .suitability import evaluate_crop, rank_crops
from .twins import find_similar
from .window import planting_window

__all__ = [
    "CRITERIA", "ScoringConfig", "build_plans", "generate_sequences", "scenario_report",
    "rank_plans", "score_plan", "season_statuses", "weights_from_priorities", "evaluate_crop", "rank_crops",
    "find_similar", "planting_window",
]
