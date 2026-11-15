"""Load documents + chunks into Supabase, embedding each chunk with the 'embed' edge function (gte-small, 384 dims).
Run after 05_ingest_docs.py. Idempotent (truncates documents/chunks first; FAQ passages are re-linked by 09_faq.py)."""
import json, pathlib, time, requests, psycopg

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL = [l.split("=", 1)[1].strip() for l in (ROOT / ".env").read_text().splitlines() if l.startswith("SUPABASE_DB_URL=")][0]
FN = "https://ghpkqcyjhqcagbstvpoy.supabase.co/functions/v1/embed"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocGtxY3lqaHFjYWdic3R2cG95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3NDQ0NjksImV4cCI6MjExMDMyMDQ2OX0.4p9j8TVFhUIqgWOEd8qknJWbWQzHKONujmOcVAyvv58"  # public anon key


def embed(texts):
    for attempt in range(5):
        try:
            r = requests.post(FN, headers={"Authorization": f"Bearer {ANON}"}, json={"texts": texts}, timeout=120)
            r.raise_for_status()
            return r.json()["embeddings"]
        except Exception:
            time.sleep(4 * (attempt + 1))
    raise RuntimeError("embed failed")


def main():
    d = json.loads((ROOT / "data/chunks.json").read_text(encoding="utf-8"))
    chunks = d["chunks"]
    vecs = []
    for i in range(0, len(chunks), 1):
        vecs += embed([c["text"] for c in chunks[i:i + 1]])
        if i % 50 == 0:
            print(i, "/", len(chunks), flush=True)
    with psycopg.connect(URL, connect_timeout=30) as con, con.cursor() as cur:
        cur.execute("update faq_items set passage_chunk_id = null")
        cur.execute("truncate document_chunks, documents restart identity cascade")
        for doc in d["documents"]:
            cur.execute("""insert into documents(doc_id,title,publisher,lang,year,licence,licence_url,source_url,page_count,topics,sha256)
                           values (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                        (doc["doc_id"], doc["title"], doc["publisher"], doc["lang"], doc["year"], doc["licence"], doc["licence_url"],
                         doc["source_url"], doc["page_count"], doc["topics"], doc["sha256"]))
        cur.execute("select setval(pg_get_serial_sequence('documents','doc_id'), (select max(doc_id) from documents))")
        for c, v in zip(chunks, vecs):
            cur.execute("""insert into document_chunks(doc_id,page,chunk_idx,lang,text,keywords,token_count,embedding)
                           values (%s,%s,%s,%s,%s,%s,%s,%s::vector)""",
                        (c["doc_id"], c["page"], c["chunk_idx"], c["lang"], c["text"], c["keywords"], c["token_count"], "[" + ",".join(f"{x:.6f}" for x in v) + "]"))
        cur.execute("update data_versions set version=%s, updated_at=now() where name='advice-index'", (time.strftime("%Y%m%d"),))
        con.commit()
    print("loaded", len(d["documents"]), "documents,", len(chunks), "chunks")


if __name__ == "__main__":
    main()
