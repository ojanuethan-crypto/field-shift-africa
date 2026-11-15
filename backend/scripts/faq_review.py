"""Writes docs/FAQ_REVIEW.md: for every FAQ question, the passage it is linked to, how well that passage matches the question, and the
passage the search would pick instead. A human (Ojani / an agronomist) uses it to fix weak links and mark items reviewed.

    backend/.venv/Scripts/python backend/scripts/faq_review.py        # reads backend/.env (real database), read-only

Overlap = share of the question's content words that appear in the linked passage (accents ignored). It is a hint, not a verdict.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from backend.app import create_app  # noqa: E402
from backend.app.services import advisor, engine_client  # noqa: E402


def overlap(question: str, passage_text: str) -> float:
    q = set(advisor._tokens(question))
    body = set(advisor.normalize(passage_text).split())
    if not q:
        return 0.0
    hits = sum(1 for w in q if w in body or any(b.startswith(w[:5]) for b in body if len(w) > 4))
    return hits / len(q)


def main() -> int:
    app = create_app()
    if app.config["ENGINE_MODE"] != "real":
        print("ENGINE_MODE is not real: set it (and DATABASE_URL) in backend/.env")
        return 1
    lines = ["# FAQ review (generated)", "",
             "Every FAQ item in the database is still `draft`. For each question: is the linked passage a real answer?",
             "If not, relink it or remove the item; then set `faq_items.status` to `reviewed`. Weakest links first.", ""]
    with app.test_request_context():
        for lang in ("en", "fr"):
            faq = engine_client.get_faq(lang)["items"]
            passages = engine_client.get_advice_index(lang)["passages"]
            by_id = {p["id"]: p for p in passages}
            rows = []
            for it in faq:
                p = by_id.get(it["passage"])
                q = it["q"][lang]
                text = p["text"][lang] if p else ""
                alt = advisor.rank_passages(q, passages, lang, k=1)
                rows.append((overlap(q, text), it, q, p, text, alt[0] if alt else None))
            rows.sort(key=lambda r: r[0])
            lines += [f"## {lang.upper()} ({len(rows)} questions with a passage in this language)", ""]
            lines += ["| Question | Linked passage (id, doc, page) | Overlap | Search would pick |", "|---|---|---|---|"]
            for ov, it, q, p, text, alt in rows:
                link = f"{p['id']}, {p['doc']}, p.{p['page']}" if p else "(missing)"
                pick = "same" if alt and p and alt["id"] == p["id"] else (f"{alt['id']}, p.{alt['page']}" if alt else "nothing")
                lines.append(f"| {q} | {link} | {round(ov * 100)}% | {pick} |")
            lines.append("")
            for ov, it, q, p, text, alt in rows:
                if ov < 0.5 and p:
                    lines += [f"**{it['id']} - {q}** (overlap {round(ov * 100)}%) is linked to:", f"> {text[:300].strip()}...", ""]
    out = ROOT / "docs" / "FAQ_REVIEW.md"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote {out} ({len(lines)} lines)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
