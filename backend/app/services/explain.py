"""POST /api/explain: a plain-language explanation of one ranked plan (S8).

`template_text()` is the always-available version: it only re-words facts already in the plan (reason, why, warnings,
score, dry-year check). `llm_text()` asks the model to say the same facts more simply, and is accepted only if it passes
the guardrails; otherwise the template is used. Nothing here adds agricultural facts of its own.
"""
import json
from typing import Dict, List, Optional

from .llm import LLM, contains_dosage

_T = {
    "en": {
        "crops": "Plan: {crops}.",
        "score": "Overall fit for your priorities: {pct} out of 100.",
        "no_score": "This plan has no complete scores yet, so it is not ranked.",
        "dry": "In a dry year this plan scores {pct} out of 100.",
        "cant_water": "Some seasons need more water than you can give, so the score is lowered.",
        "same_crop": "It repeats the crop you just grew, so the score is lowered.",
        "warn": "Watch out: ",
        "agro": "Ask a local agronomist.",
    },
    "fr": {
        "crops": "Plan : {crops}.",
        "score": "Adéquation globale avec vos priorités : {pct} sur 100.",
        "no_score": "Ce plan n'a pas encore de scores complets, il n'est donc pas classé.",
        "dry": "En année sèche, ce plan obtient {pct} sur 100.",
        "cant_water": "Certaines saisons demandent plus d'eau que vous ne pouvez en donner, le score est donc réduit.",
        "same_crop": "Il répète la culture que vous venez de faire, le score est donc réduit.",
        "warn": "Attention : ",
        "agro": "Demandez à un agronome local.",
    },
}

SYSTEM = (
    "You rewrite a crop rotation plan for a smallholder farmer. Use ONLY the facts in the JSON. Do not add numbers, "
    "products, chemicals, doses or promises. Past climate is not a forecast. 4 short sentences maximum, plain words, "
    "no jargon, plain text with no markdown. Write in {language}. The last sentence must tell the farmer to ask a local "
    "agronomist."
)


def _pct(x) -> int:
    return round(x * 100)


def _crop_names(plan: dict, crops: List[dict], lang: str) -> List[str]:
    names: Dict[str, str] = {c["id"]: c["name"].get(lang) or c["id"] for c in crops}
    return [names.get(s["crop"], s["crop"]) for s in plan["sequence"]]


def facts(plan: dict, crops: List[dict], lang: str) -> dict:
    """The only information the explanation may use."""
    adj = [a["rule"] for a in plan.get("breakdown", {}).get("adjustments", [])]
    dry = (plan.get("scenarios") or {}).get("dry")
    return {
        "language": lang,
        "crops_in_order": _crop_names(plan, crops, lang),
        "reason": plan["reason"][lang],
        "why": [w[lang] for w in plan["why"]],
        "warnings": [w[lang] for w in plan["warnings"]],
        "score_out_of_100": None if plan.get("score") is None else _pct(plan["score"]),
        "dry_year_score_out_of_100": None if not dry else _pct(dry["score"]),
        "score_lowered_because": adj,
    }


def template_text(plan: dict, crops: List[dict], lang: str) -> str:
    t = _T[lang]
    parts = [t["crops"].format(crops=" → ".join(_crop_names(plan, crops, lang))), plan["reason"][lang]]
    parts += [w[lang] for w in plan["why"] if w[lang] != plan["reason"][lang]]  # the reason is usually also the first "why"
    if plan.get("score") is None:
        parts.append(t["no_score"])
    else:
        parts.append(t["score"].format(pct=_pct(plan["score"])))
    dry = (plan.get("scenarios") or {}).get("dry")
    if dry:
        parts.append(t["dry"].format(pct=_pct(dry["score"])))
    rules = {a["rule"] for a in plan.get("breakdown", {}).get("adjustments", [])}
    if "cannot_water" in rules:
        parts.append(t["cant_water"])
    if "same_crop_as_last" in rules:
        parts.append(t["same_crop"])
    parts += [t["warn"] + w[lang] for w in plan["warnings"]]
    parts.append(t["agro"])  # guide section 6: always end by sending the farmer to a local agronomist
    return " ".join(parts)


def llm_text(llm: Optional[LLM], plan: dict, crops: List[dict], lang: str) -> Optional[str]:
    if llm is None or not llm.available:
        return None
    text = llm.complete(SYSTEM.format(language="French" if lang == "fr" else "English"), "Facts:\n" + json.dumps(facts(plan, crops, lang), ensure_ascii=False), max_tokens=300)
    if not text or contains_dosage(text):
        return None
    return text
