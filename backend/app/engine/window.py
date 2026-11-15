"""Planting window from past climate. Pure function: no Flask, no database. Never a forecast.

Method (Roadmap 05 section 6): the onset is the first month whose median rainfall reaches a set share of the
evaporative demand, after a month that did not. The window is `window_months` months starting at the onset.

`rain_share` and `window_months` are REQUIRED arguments. The roadmap says "a set share" without giving a value and
this code does not invent one: the value must be chosen (and justified against known planting calendars) and then
passed in through configuration.
"""
from typing import Optional


def planting_window(rain_p50: list, et0: list, rain_share: float, window_months: int) -> Optional[dict]:
    """rain_p50 and et0: 12 monthly values (January first), same units. Returns {start_month, end_month, onset_months}
    with months numbered 1-12, or None when no onset exists (never or always above the share)."""
    if len(rain_p50) != 12 or len(et0) != 12:
        raise ValueError("rain_p50 and et0 need 12 monthly values")
    if not (0 < rain_share) or window_months < 1 or window_months > 12:
        raise ValueError("rain_share must be > 0 and window_months 1-12")
    ok = [r is not None and e is not None and e > 0 and r >= rain_share * e for r, e in zip(rain_p50, et0)]
    onsets = [m for m in range(12) if ok[m] and not ok[m - 1]]  # m - 1 wraps to December for January
    if not onsets:
        return None
    start = onsets[0]
    return {"start_month": start + 1, "end_month": (start + window_months - 1) % 12 + 1,
            "onset_months": [m + 1 for m in onsets]}
