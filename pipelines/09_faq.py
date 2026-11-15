"""Seed the FAQ (F40): 24 farmer questions EN/FR. For each language the best passage is retrieved (search_passages);
the answer is EXTRACTIVE (the 2 sentences of the passage that best match the question), never generated, so it cannot invent facts.
A question is only given an answer in a language if similarity >= threshold AND there is a lexical hit; otherwise the answer stays empty.
status stays 'draft' until a person reviews it (reviewed_by / reviewed_at are only set by a human)."""
import re, pathlib, requests, psycopg

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL = [l.split("=", 1)[1].strip() for l in (ROOT / ".env").read_text().splitlines() if l.startswith("SUPABASE_DB_URL=")][0]
ANON = open(ROOT / "pipelines/08_load_docs.py", encoding="utf-8").read().split('ANON = "')[1].split('"')[0]
FN = "https://ghpkqcyjhqcagbstvpoy.supabase.co/functions/v1/embed"
THR = {"en": 0.82, "fr": 0.83}

QS = [  # id, emoji, en, fr
 ("f1", "🔄", "Why change crops?", "Pourquoi changer de culture ?"),
 ("f2", "🥜", "Which crop feeds the soil?", "Quelle culture nourrit le sol ?"),
 ("f3", "🌱", "My soil is tired. What can I do?", "Mon sol est fatigué. Que faire ?"),
 ("f4", "☀️", "When should I plant?", "Quand dois-je planter ?"),
 ("f5", "🌊", "My field floods. What can I do?", "Mon champ est inondé. Que faire ?"),
 ("f6", "🫘", "How do I choose seeds?", "Comment choisir les semences ?"),
 ("f7", "🏚️", "How do I store grain?", "Comment stocker le grain ?"),
 ("f8", "🐛", "Pests are in my field.", "Des ravageurs sont dans mon champ."),
 ("f9", "⛰️", "Rain washes my soil away.", "La pluie emporte mon sol."),
 ("f10", "🍂", "What is mulch?", "Qu'est-ce que le paillage ?"),
 ("f11", "💧", "How do I keep water in the soil?", "Comment garder l'eau dans le sol ?"),
 ("f12", "💰", "I cannot buy fertilizer.", "Je ne peux pas acheter d'engrais."),
 ("f13", "♻️", "What is compost?", "Qu'est-ce que le compost ?"),
 ("f14", "🌵", "How do I cope with drought?", "Comment faire face à la sécheresse ?"),
 ("f15", "🌾", "What is conservation farming?", "Qu'est-ce que l'agriculture de conservation ?"),
 ("f16", "🏔️", "How do I stop erosion on a slope?", "Comment arrêter l'érosion sur une pente ?"),
 ("f17", "🚿", "How can I use less water?", "Comment utiliser moins d'eau ?"),
 ("f18", "🌿", "What is green manure?", "Qu'est-ce que l'engrais vert ?"),
 ("f19", "🛡️", "Why keep the soil covered?", "Pourquoi garder le sol couvert ?"),
 ("f20", "🪙", "How can I improve poor soil cheaply?", "Comment améliorer un sol pauvre à bas coût ?"),
 ("f21", "🌳", "Why plant trees with crops?", "Pourquoi planter des arbres avec les cultures ?"),
 ("f22", "🦠", "How do I protect crops from disease?", "Comment protéger les cultures contre les maladies ?"),
 ("f23", "🌧️", "How do I save rain water for the dry months?", "Comment garder l'eau de pluie pour la saison sèche ?"),
 ("f24", "🧪", "Why does healthy soil matter?", "Pourquoi un sol sain est-il important ?"),
]
STOP = set("the a an is are my i to of in on do how what can and for why with les la le un une des de du est mon ma mes je que qui quoi comment dans et pour sur ne pas quand dois".split())


def best_sentences(q, text, n=2):
    sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9])", text) if len(s.split()) >= 6]
    qt = {w for w in re.findall(r"[a-zà-ÿ]{4,}", q.lower()) if w not in STOP}
    if not sents:
        return text[:300]
    sc = [sum(1 for w in qt if w[:5] in s.lower()) for s in sents]
    i = max(range(len(sents)), key=lambda k: (sc[k], -k))
    out = sents[i:i + n]
    return " ".join(out)


def main():
    with psycopg.connect(URL, connect_timeout=30) as con, con.cursor() as cur:
        cur.execute("delete from faq_items where faq_id like 'f%'")
        for sort, (fid, emoji, qen, qfr) in enumerate(QS, 1):
            row = {"en": (None, None, None), "fr": (None, None, None)}
            for lang, q in (("en", qen), ("fr", qfr)):
                e = requests.post(FN, headers={"Authorization": f"Bearer {ANON}"}, json={"texts": [q]}, timeout=90).json()["embeddings"][0]
                cur.execute("select chunk_id, text, similarity, lexical_hit from search_passages(%s,%s::vector,%s,1)", (q, "[" + ",".join(map(str, e)) + "]", lang))
                r = cur.fetchone()
                if r and r[2] >= THR[lang] and r[3]:
                    row[lang] = (r[0], best_sentences(q, r[1]), float(r[2]))
            cur.execute("""insert into faq_items(faq_id,emoji,sort,q_en,q_fr,a_en,a_fr,passage_en,passage_fr,sim_en,sim_fr,status)
                           values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'draft')""",
                        (fid, emoji, sort, qen, qfr, row["en"][1], row["fr"][1], row["en"][0], row["fr"][0], row["en"][2], row["fr"][2]))
            print(fid, "en" if row["en"][0] else "--", "fr" if row["fr"][0] else "--", flush=True)
        cur.execute("update data_versions set version=to_char(now(),'YYYYMMDD') where name='faq'")
        con.commit()


if __name__ == "__main__":
    main()
