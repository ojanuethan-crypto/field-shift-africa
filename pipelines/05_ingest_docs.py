"""Advisor corpus: PDF -> page-aware chunks (~300 words, 40-word overlap, never crossing a page) + keywords.
Run isolated:  python -I pipelines/05_ingest_docs.py     (PDFs are untrusted input; text extraction by poppler pdftotext)
Output: data/chunks.json  {documents:[...], chunks:[...]}   (embeddings are added by the loader via the 'embed' edge function)
"""
import json, math, pathlib, re, subprocess, hashlib, collections

ROOT = pathlib.Path(__file__).resolve().parents[1]
DOCS = ROOT / "data/docs"

FAO_TERMS = "FAO website terms: non-commercial use with attribution (https://www.fao.org/contact-us/terms/en/). Confirm before launch."
CORPUS = [
    dict(dir="sg02", lang="en", title="Save and Grow, Chapter 3: Soil health", publisher="FAO", year=2011,
         source_url="https://fao.org/4/i2215e/i2215e02.pdf", topics=["soil", "rotation", "legumes", "fertility"]),
    dict(dir="sg03", lang="en", title="Save and Grow, Chapter 5: Water management", publisher="FAO", year=2011,
         source_url="https://fao.org/4/i2215e/i2215e03.pdf", topics=["water", "drought", "irrigation"]),
    dict(dir="d5", lang="en", title="Save and Grow, Chapter 1: The challenge", publisher="FAO", year=2011,
         source_url="https://fao.org/4/i2215e/i2215e01.pdf", topics=["intensification", "smallholders"]),
    dict(dir="d1", lang="fr", title="Fiche d'information n°1: Intensification durable des cultures", publisher="FAO", year=2011,
         source_url="https://openknowledge.fao.org/server/api/core/bitstreams/851e17e4-0e6e-4e32-beb4-91e24a6fa807/content",
         topics=["intensification", "rotation", "légumineuses"]),
    dict(dir="fr_i2215f03", lang="fr", title="Produire plus avec moins, Chapitre 5: La gestion de l'eau", publisher="FAO", year=2011,
         source_url="https://fao.org/4/i2215f/i2215f03.pdf", topics=["eau", "sécheresse", "irrigation"]),
    dict(dir="fr_i1861f02", lang="fr", title="Gestion durable des terres en Afrique subsaharienne: Principes de bonnes pratiques de GDT",
         publisher="FAO / TerrAfrica (hébergé par la FAO)", year=2011, source_url="https://fao.org/4/i1861f/i1861f02.pdf",
         topics=["sol", "érosion", "gestion des terres"]),
    dict(dir="d2", lang="fr", title="Gestion durable des terres en Afrique subsaharienne: Bonnes pratiques de GDT (2e partie)",
         publisher="FAO / TerrAfrica (hébergé par la FAO)", year=2011, source_url="https://fao.org/4/i1861f/i1861f04.pdf",
         topics=["sol", "cultures", "Afrique"]),
]

STOP = set("""the and for that with this are from have has was were will can not but all any their they them its our your you which when
where what who how also more most other such than then these those into over under between through during each both only same very
may might should would could been being does did done use used using per one two three about after before while within without
les des une que qui dans pour par sur avec est sont aux ces cette ses leur leurs plus mais comme aussi entre sans sous tout tous
toutes ont être fait peut peuvent ainsi donc dont car elle elles nous vous ils lui eux très bien même autre autres afin lors puis
selon chez vers depuis alors encore """.split())
tok = lambda s: [w for w in re.findall(r"[a-zà-ÿ]{4,}", s.lower()) if w not in STOP]


def pages_of(pdf):
    txt = subprocess.run(["pdftotext", "-enc", "UTF-8", str(pdf), "-"], capture_output=True, check=True).stdout.decode("utf-8", "replace")
    return txt.split("\f")


def clean(s):
    s = re.sub(r"[-]", " ", s)          # private-use bullets from PDF fonts
    s = re.sub(r"-\n(\w)", r"\1", s)
    s = re.sub(r"\s*\n\s*", " ", s)
    return re.sub(r"\s{2,}", " ", s).strip()


def chunk_page(text, size=300, overlap=40):
    words = text.split()
    if len(words) < 40:
        return []
    out, i = [], 0
    while i < len(words):
        out.append(" ".join(words[i:i + size]))
        if i + size >= len(words):
            break
        i += size - overlap
    return [c for c in out if len(c.split()) >= 40]


def main():
    documents, chunks = [], []
    for d_id, spec in enumerate(CORPUS, 1):
        pdf = DOCS / spec["dir"] / "doc.pdf"
        pgs = pages_of(pdf)
        documents.append(dict(doc_id=d_id, title=spec["title"], publisher=spec["publisher"], lang=spec["lang"], year=spec["year"],
                              licence=FAO_TERMS, licence_url="https://www.fao.org/contact-us/terms/en/", source_url=spec["source_url"],
                              page_count=len(pgs) - 1 if pgs and not pgs[-1].strip() else len(pgs), topics=spec["topics"],
                              sha256=hashlib.sha256(pdf.read_bytes()).hexdigest()))
        idx = 0
        for pno, ptxt in enumerate(pgs, 1):
            for c in chunk_page(clean(ptxt)):
                chunks.append(dict(doc_id=d_id, page=pno, chunk_idx=idx, lang=spec["lang"], text=c))
                idx += 1
    # keywords by tf-idf within language
    for lang in ("en", "fr"):
        sub = [c for c in chunks if c["lang"] == lang]
        df = collections.Counter(w for c in sub for w in set(tok(c["text"])))
        n = max(len(sub), 1)
        for c in sub:
            tf = collections.Counter(tok(c["text"]))
            c["keywords"] = [w for w, _ in sorted(((w, f * math.log(n / df[w])) for w, f in tf.items()), key=lambda x: -x[1])[:8]]
            c["token_count"] = len(c["text"].split())
    (ROOT / "data/chunks.json").write_text(json.dumps(dict(documents=documents, chunks=chunks), ensure_ascii=False), encoding="utf-8")
    print(len(documents), "documents,", len(chunks), "chunks;", collections.Counter(c["lang"] for c in chunks))


if __name__ == "__main__":
    main()
