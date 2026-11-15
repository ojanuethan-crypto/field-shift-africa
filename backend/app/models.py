"""DATABASE models: SQLAlchemy 1.4 (legacy declarative style), NOT 2.x.

These mirror tables of Ojani's Supabase (Postgres) database, as listed in docs/DATABASE.md and read from the live
project's schema. Only the tables and columns this backend READS are declared; the rest (PostGIS `geog`, pgvector
`embedding`, `tsv`, telemetry, advisor tables) are left out on purpose. They are NOT the API contract: the JSON shapes the
frontend receives are in schemas.py, and providers/database.py is the only place that turns rows from here into those
shapes. Nothing in this file creates or changes the database (no migrations): the tables belong to Ojani.

Rules for this file: use `declarative_base()` from sqlalchemy.ext.declarative, `Column(...)`, and `session.query(...)`.
Do not use 2.x features (`DeclarativeBase`, `Mapped[...]`, `mapped_column`, `select()`-only style). Requirements pin
`SQLAlchemy>=1.4,<2.0`. Types are portable (the tests build these tables in SQLite).
"""
import os

# SQLAlchemy 1.4 prints a "not compatible with 2.0" notice on legacy imports. We choose 1.4 on purpose.
os.environ.setdefault("SQLALCHEMY_SILENCE_UBER_WARNING", "1")

from sqlalchemy import JSON, BigInteger, Boolean, Column, Float, Integer, SmallInteger, Text, create_engine  # noqa: E402
from sqlalchemy.dialects.postgresql import ARRAY  # noqa: E402
from sqlalchemy.ext.declarative import declarative_base  # noqa: E402
from sqlalchemy.orm import scoped_session, sessionmaker  # noqa: E402

Base = declarative_base()

TextArray = ARRAY(Text).with_variant(JSON(), "sqlite")  # Postgres text[]; JSON only so the tests can use SQLite


class Zone(Base):
    __tablename__ = "zones"
    zone_id = Column(SmallInteger, primary_key=True)
    slug = Column(Text)
    name_en = Column(Text)
    name_fr = Column(Text)
    desc_en = Column(Text)
    desc_fr = Column(Text)
    icon = Column(Text)
    color = Column(Text)
    typical_crops = Column(TextArray)


class Cell(Base):
    """One 1-degree grid cell (the data's resolution). `geog` (PostGIS) is not mapped: nearest-cell lookup is the database
    function nearest_cell()."""

    __tablename__ = "cells"
    cell_id = Column(Integer, primary_key=True)
    lat = Column(Float)
    lon = Column(Float)
    country = Column(Text)
    place_name = Column(Text)
    zone_id = Column(SmallInteger)


class CellFeature(Base):
    __tablename__ = "cell_features"
    cell_id = Column(Integer, primary_key=True)
    rain_annual = Column(Float)
    n_seasons = Column(SmallInteger)
    ph = Column(Float)
    soc = Column(Float)
    hz_drought = Column(SmallInteger)
    hz_flood = Column(SmallInteger)
    hz_heat = Column(SmallInteger)
    hz_erosion = Column(SmallInteger)


class ClimateMonthly(Base):
    __tablename__ = "climate_monthly"
    cell_id = Column(Integer, primary_key=True)
    month = Column(SmallInteger, primary_key=True)
    rain_p20 = Column(Float)
    rain_p50 = Column(Float)
    rain_p80 = Column(Float)
    tmean = Column(Float)
    et0 = Column(Float)


class CellWatchMonth(Base):
    __tablename__ = "cell_watch_months"
    cell_id = Column(Integer, primary_key=True)
    month = Column(SmallInteger, primary_key=True)
    is_dry = Column(Boolean)
    is_flood = Column(Boolean)
    is_heat = Column(Boolean)


class PlantingWindow(Base):
    __tablename__ = "planting_windows"
    cell_id = Column(Integer, primary_key=True)
    season = Column(SmallInteger, primary_key=True)
    start_month = Column(SmallInteger)
    end_month = Column(SmallInteger)
    method = Column(Text)


class Crop(Base):
    __tablename__ = "crops"
    crop_id = Column(SmallInteger, primary_key=True)
    slug = Column(Text)
    emoji = Column(Text)
    name_en = Column(Text)
    name_fr = Column(Text)
    family = Column(Text)
    is_legume = Column(Boolean)
    cycle_days = Column(SmallInteger)
    tmin_abs = Column(Float)
    tmin_opt = Column(Float)
    tmax_opt = Column(Float)
    tmax_abs = Column(Float)
    rain_min_abs = Column(Float)
    rain_min_opt = Column(Float)
    rain_max_opt = Column(Float)
    rain_max_abs = Column(Float)
    ph_min_abs = Column(Float)
    ph_min_opt = Column(Float)
    ph_max_opt = Column(Float)
    ph_max_abs = Column(Float)
    kc_avg = Column(Float)
    drought_tol = Column(SmallInteger)
    flood_tol = Column(SmallInteger)
    heat_tol = Column(SmallInteger)
    cover = Column(SmallInteger)
    income_idx = Column(Float)
    in_mvp = Column(Boolean)


class Reason(Base):
    """Plain-language reason / warning texts, keyed by the codes the plan rules produce."""

    __tablename__ = "reasons"
    code = Column(Text, primary_key=True)
    text_en = Column(Text)
    text_fr = Column(Text)


class ScoringConfig(Base):
    __tablename__ = "scoring_config"
    key = Column(Text, primary_key=True)
    value = Column(Text)


BigId = BigInteger().with_variant(Integer, "sqlite")  # bigint identity in Postgres; plain integer so SQLite can autoincrement it


class Feedback(Base):
    """Anonymous thumbs. The database CHECKs: target in (plan, answer, app, proof, passport), value in (-1, 1), note <= 280 chars.
    The other columns (id, created_at) are filled by the database."""

    __tablename__ = "feedback"
    id = Column(BigId, primary_key=True, autoincrement=True)
    target = Column(Text)
    value = Column(SmallInteger)
    zone_id = Column(SmallInteger)
    lang = Column(Text)


class UsageEvent(Base):
    """Anonymous usage count. The database CHECKs `name` against a fixed list (see providers/database.py EVENT_NAMES)."""

    __tablename__ = "usage_events"
    id = Column(BigId, primary_key=True, autoincrement=True)
    name = Column(Text)
    zone_id = Column(SmallInteger)


class PassportNote(Base):
    __tablename__ = "passport_notes"
    note_id = Column(Integer, primary_key=True)
    kind = Column(Text)  # assumption | limitation | method
    text_en = Column(Text)
    text_fr = Column(Text)
    sort = Column(SmallInteger)


def make_session_factory(database_url: str):
    """Build a thread-safe session factory (used by the database provider; mock mode never calls it)."""
    engine = create_engine(database_url, pool_pre_ping=True)
    return scoped_session(sessionmaker(bind=engine))
