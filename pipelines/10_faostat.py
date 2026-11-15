"""FAOSTAT 'Crops and livestock products' (Africa) -> africa_stats (area harvested, yield, production per country/crop/year).
Source: https://www.fao.org/faostat/en/#data/QCL  (bulk: bulks-faostat.fao.org/production/Production_Crops_Livestock_E_Africa.zip), CC BY-NC-SA 3.0 IGO.
Phase 1 (untrusted zip, stdlib only):  python -I pipelines/10_faostat.py parse
Phase 2 (database load):               python pipelines/10_faostat.py load
"""
import sys, io, csv, json, zipfile, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
D = ROOT / "data/faostat"
ITEMS = {"Maize (corn)": "maize", "Sorghum": "sorghum", "Millet": "millet", "Rice": "rice", "Groundnuts, excluding shelled": "groundnut",
         "Cow peas, dry": "cowpea", "Soya beans": "soybean", "Beans, dry": "beans", "Pigeon peas, dry": "pigeonpea", "Cassava, fresh": "cassava",
         "Yams": "yam", "Taro": "cocoyam", "Sweet potatoes": "sweetpotato", "Plantains and cooking bananas": "plantain",
         "Seed cotton, unginned": "cotton", "Tomatoes": "tomato", "Potatoes": "potato"}
ELEMENTS = {"Area harvested": ("area_harvested", "ha"), "Yield": ("yield", "kg/ha"), "Production": ("production", "t")}
M49 = {12: "DZA", 24: "AGO", 204: "BEN", 72: "BWA", 854: "BFA", 108: "BDI", 132: "CPV", 120: "CMR", 140: "CAF", 148: "TCD", 174: "COM", 178: "COG",
       384: "CIV", 180: "COD", 262: "DJI", 818: "EGY", 226: "GNQ", 232: "ERI", 748: "SWZ", 231: "ETH", 266: "GAB", 270: "GMB", 288: "GHA", 324: "GIN",
       624: "GNB", 404: "KEN", 426: "LSO", 430: "LBR", 434: "LBY", 450: "MDG", 454: "MWI", 466: "MLI", 478: "MRT", 480: "MUS", 504: "MAR", 508: "MOZ",
       516: "NAM", 562: "NER", 566: "NGA", 646: "RWA", 678: "STP", 686: "SEN", 690: "SYC", 694: "SLE", 706: "SOM", 710: "ZAF", 728: "SSD", 729: "SDN",
       834: "TZA", 768: "TGO", 788: "TUN", 800: "UGA", 894: "ZMB", 716: "ZWE"}


def parse():
    z = zipfile.ZipFile(D / "fao.zip")
    rows = csv.DictReader(io.StringIO(z.read("Production_Crops_Livestock_E_Africa.csv").decode("latin-1")))
    out, skipped = [], set()
    for r in rows:
        if r["Item"] not in ITEMS or r["Element"] not in ELEMENTS:
            continue
        code = int(r["Area Code (M49)"].strip("'"))
        iso = M49.get(code)
        if not iso:
            skipped.add(r["Area"]); continue
        ind, unit = ELEMENTS[r["Element"]]
        div = 10.0 if r["Unit"].strip() == "hg/ha" else 1.0     # FAOSTAT older files give hg/ha
        for k, v in r.items():
            if k.startswith("Y") and k[1:].isdigit() and v not in ("", None):
                out.append((iso, r["Area"], ind, ITEMS[r["Item"]], int(k[1:]), float(v) / (div if ind == "yield" else 1), unit))
    (D / "stats.json").write_text(json.dumps(out))
    print(len(out), "rows; skipped areas:", sorted(skipped))


def load():
    import psycopg
    URL = [l.split("=", 1)[1].strip() for l in (ROOT / ".env").read_text().splitlines() if l.startswith("SUPABASE_DB_URL=")][0]
    rows = json.loads((D / "stats.json").read_text())
    with psycopg.connect(URL, connect_timeout=30) as con, con.cursor() as cur:
        cur.execute("select slug, crop_id from crops"); cid = dict(cur.fetchall())
        cur.execute("delete from africa_stats where source like 'FAOSTAT%'")
        with cur.copy("copy africa_stats (iso3,country,indicator,crop_id,year,value,unit,source,source_url) from stdin") as cp:
            for iso, country, ind, slug, year, val, unit in ((r[0], r[1], r[2], r[3], r[4], r[5], r[6]) for r in rows):
                cp.write_row((iso, country, ind, cid[slug], year, val, unit, "FAOSTAT Crops and livestock products (QCL)", "https://www.fao.org/faostat/en/#data/QCL"))
        cur.execute("delete from passport_sources where variable='yields'")
        cur.execute("""insert into passport_sources(variable,dataset,version,resolution,period,accessed,how,caveat,url,licence,pipeline,label_en,label_fr,sort)
          values ('yields','FAOSTAT Crops and livestock products (Africa)','QCL bulk file','Country level, annual','1961-latest','2026-11-15',
          'Area harvested, yield and production per country and crop; shown to the Advisor as context across years.',
          'National averages hide local differences; FAOSTAT yields mix methods and some years are estimates.',
          'https://www.fao.org/faostat/en/#data/QCL','CC BY-NC-SA 3.0 IGO','10_faostat.py','Crop yields over the years','Rendements au fil des ans',80)""")
        con.commit()
    print("loaded", len(rows))


if __name__ == "__main__":
    {"parse": parse, "load": load}[sys.argv[1]]()
