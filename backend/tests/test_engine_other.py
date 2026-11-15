"""Engine tests for suitability, rotation generation, twins and planting window.

All numbers below are SYNTHETIC TEST INPUTS written to exercise the algorithms. They are not crop data and are not
shipped with the API.
"""
import pytest

from backend.app.engine import evaluate_crop, find_similar, generate_sequences, build_plans, planting_window, rank_crops, rank_plans, ScoringConfig

# ---------- suitability ----------
REQ = {"rain": {"abs_min": 100, "opt_min": 200, "opt_max": 300, "abs_max": 400}}


def test_suitability_trapezoid():
    f = lambda v: evaluate_crop(REQ, {"rain": v})["score"]
    assert f(50) == 0 and f(450) == 0
    assert f(250) == 1 and f(200) == 1 and f(300) == 1
    assert f(150) == pytest.approx(0.5) and f(350) == pytest.approx(0.5)


def test_suitability_rectangle_when_only_min_max():
    r = {"ph": {"min": 5, "max": 7}}
    assert evaluate_crop(r, {"ph": 6})["score"] == 1
    assert evaluate_crop(r, {"ph": 8})["score"] == 0


def test_suitability_limiting_factor_and_mean():
    req = {"rain": REQ["rain"], "ph": {"min": 5, "max": 7}}
    c = {"rain": 150, "ph": 6}
    lim = evaluate_crop(req, c)
    assert lim["score"] == pytest.approx(0.5) and lim["limiting"] == "rain"
    assert evaluate_crop(req, c, combine="mean")["score"] == pytest.approx(0.75)


def test_suitability_missing_data_is_unknown_not_guessed():
    r = evaluate_crop(REQ, {})
    assert r["score"] is None and r["missing"] == ["rain"]
    r2 = evaluate_crop({**REQ, "ph": {"min": 5, "max": 7}}, {"rain": 250})
    assert r2["score"] == 1 and r2["missing"] == ["ph"]  # evaluated on what is known, and says what was missing


def test_rank_crops_unknown_last_and_min_score_is_callers_choice():
    crops = [{"id": "a", "requirements": REQ}, {"id": "b", "requirements": {}}, {"id": "c", "requirements": REQ}]
    ranked = rank_crops(crops, {"rain": 150})
    assert ranked[-1]["id"] == "b" and ranked[-1]["score"] is None
    assert [c["id"] for c in rank_crops(crops, {"rain": 50}, min_score=0.1)] == ["b"]


def test_bad_inputs():
    with pytest.raises(ValueError):
        evaluate_crop(REQ, {"rain": 1}, combine="max")
    with pytest.raises(ValueError):
        evaluate_crop({"x": {"opt_min": 1}}, {"x": 1})


# ---------- rotation generation ----------
POOL = [{"id": "maize", "legume": False, "family": "A"}, {"id": "bean", "legume": True, "family": "B"},
        {"id": "yam", "legume": False, "family": "C"}, {"id": "rice", "legume": False, "family": "A"}]


def test_generation_rules():
    seqs = generate_sequences(POOL, n_seasons=3)
    assert seqs, "should find candidates"
    fam = {c["id"]: c["family"] for c in POOL}
    for s in seqs:
        assert any(c == "bean" for c in s), "must include the legume"
        assert all(a != b and fam[a] != fam[b] for a, b in zip(s, s[1:])), "no same crop/family back to back"


def test_generation_respects_last_crop_and_is_repeatable():
    last = POOL[0]  # maize (family A): neither maize nor rice (same family) may start
    seqs = generate_sequences(POOL, last_crop=last)
    assert all(s[0] not in ("maize", "rice") for s in seqs)
    assert seqs == generate_sequences(POOL, last_crop=last)


def test_unknown_family_is_never_guessed_and_legume_rule_skipped_without_legumes():
    pool = [{"id": "a", "legume": False, "family": None}, {"id": "b", "legume": False, "family": None}]
    seqs = generate_sequences(pool, n_seasons=2)
    assert ["a", "b"] in seqs and ["b", "a"] in seqs  # same-crop blocked, unknown families do not block
    assert ["a", "a"] not in seqs


def test_generation_cap_and_empty_pool():
    assert len(generate_sequences(POOL, n_seasons=4, max_candidates=3)) <= 3
    assert generate_sequences([], n_seasons=3) == []


def test_generated_plans_without_subscores_are_unscored_and_last():
    plans = build_plans([["bean", "maize", "yam"], ["bean", "yam", "maize"]],
                        lambda seq: {"money": 0.5, "water": 0.5, "soil": 0.9, "safety": 0.5} if seq[1] == "maize" else None)
    ranked = rank_plans(plans, {}, ScoringConfig())
    assert ranked[0]["score"] is not None and ranked[-1]["score"] is None
    assert ranked[-1]["statuses"] == ["unknown"] * 3


# ---------- twins ----------
def test_twins_ranks_by_similarity_and_reports_skipped_features():
    origin = {"rain": 1000, "temp": 25}
    cands = [{"id": "near", "features": {"rain": 1010, "temp": 25}},
             {"id": "far", "features": {"rain": 300, "temp": 35}},
             {"id": "partial", "features": {"rain": 1000}}]
    r = find_similar(origin, cands)
    assert r[0]["id"] in ("near", "partial")
    assert [c["id"] for c in r].index("near") < [c["id"] for c in r].index("far")
    partial = next(c for c in r if c["id"] == "partial")
    assert partial["skipped_features"] == ["temp"] and partial["used_features"] == ["rain"]
    assert all(0 <= c["similarity"] <= 1 for c in r)


def test_twins_identical_place_is_1_and_n_limits():
    r = find_similar({"a": 1.0}, [{"id": str(i), "features": {"a": 1.0 + i}} for i in range(10)], n=3)
    assert len(r) == 3 and r[0]["similarity"] == 1.0


def test_twins_weights_change_the_order():
    origin = {"a": 0, "b": 0}
    cands = [{"id": "x", "features": {"a": 0, "b": 10}}, {"id": "y", "features": {"a": 10, "b": 0}}]
    # x differs from the origin only in b, y only in a: whichever feature weighs more makes ITS differing place farther
    assert find_similar(origin, cands, weights={"a": 1, "b": 0.01})[0]["id"] == "x"
    assert find_similar(origin, cands, weights={"a": 0.01, "b": 1})[0]["id"] == "y"


def test_twins_nothing_comparable():
    assert find_similar({}, [{"id": "x", "features": {"a": 1}}]) == []
    assert find_similar({"a": 1}, [{"id": "x", "features": {}}]) == []


# ---------- planting window ----------
def test_window_finds_onset_and_wraps_the_year():
    rain = [0, 0, 0, 50, 80, 90, 0, 0, 0, 0, 0, 0]
    et0 = [100] * 12
    w = planting_window(rain, et0, rain_share=0.4, window_months=2)
    assert w == {"start_month": 4, "end_month": 5, "onset_months": [4]}
    wrap = planting_window([0] * 11 + [90], et0, rain_share=0.4, window_months=2)
    assert wrap["start_month"] == 12 and wrap["end_month"] == 1


def test_window_none_when_no_onset():
    assert planting_window([0] * 12, [100] * 12, 0.4, 2) is None  # never reaches the share
    assert planting_window([100] * 12, [100] * 12, 0.4, 2) is None  # always above: no onset to find


def test_window_requires_explicit_parameters_and_valid_input():
    with pytest.raises(ValueError):
        planting_window([0] * 11, [1] * 11, 0.4, 2)
    with pytest.raises(ValueError):
        planting_window([0] * 12, [1] * 12, 0, 2)
    with pytest.raises(ValueError):
        planting_window([0] * 12, [1] * 12, 0.4, 13)
    assert planting_window([1] * 12, [0] * 12, 0.4, 2) is None  # zero evaporative demand is not usable data
