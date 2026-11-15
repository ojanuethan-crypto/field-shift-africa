# Backend (Flask)

Mock-backed Flask API for Field Navigator, ready for real Supabase data. Endpoints: see [API.md](API.md).

## Run
```
python -m venv backend/.venv
backend/.venv/Scripts/python -m pip install -r backend/requirements.txt     # Windows
backend/.venv/Scripts/python -m flask --app backend.app:create_app run --port 8000
backend/.venv/Scripts/python -m pytest backend/tests                         # tests
```
Run from the repository root. Copy `backend/.env.example` to `backend/.env` to change settings.

## Deploy, warm up, check
```
docker build -f backend/Dockerfile -t fieldshift-api .            # from the repository root
docker run -p 8000:8000 --env-file backend/.env fieldshift-api    # needs ALLOWED_ORIGINS=<your frontend URL> (ENV=prod refuses *)
gunicorn backend.wsgi:app --bind 0.0.0.0:8000                      # without Docker, Linux/macOS
waitress-serve --listen=127.0.0.1:8000 backend.wsgi:app            # Windows (use this, not `flask run`, with real data: Flask's dev server resets responses over ~250 kB there)
python backend/scripts/prewarm.py --base https://your-api         # warm the cache for the demo sites
bash backend/scripts/smoke.sh https://your-api                    # every endpoint, English + French; exit 1 on failure
```
Use `127.0.0.1`, not `localhost`, when testing on Windows (`localhost` adds about 2 s per call). Ping `/api/health` every 5 minutes
on a free host so it stays awake. The Dockerfile has not been built on this machine. Optional: `ANTHROPIC_API_KEY` turns on model wording for `/ask` and `/explain`.

## Connecting to the live database
Put the Supabase connection string in `backend/.env` (gitignored) as `DATABASE_URL`, with `ENGINE_MODE=real`. The direct host
`db.<ref>.supabase.co` is IPv6-only: on a network without IPv6 use the pooler instead (Project settings > Database > Connection
string > Session pooler), e.g. `postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres`. The tests never read
`.env` (conftest pins mock mode and an empty URL).

## Run the app against this API
```
backend/.venv/Scripts/python -m waitress --listen=127.0.0.1:8000 --call backend.app:create_app    # Windows; real data needs backend/.env
printf 'VITE_USE_MOCK=false\nVITE_API_URL=http://127.0.0.1:8000\n' > .env.local                    # repository root, gitignored
npm run dev                                                                                       # http://localhost:5173
node backend/scripts/check_frontend.mjs                                                           # the app's own adapters + ranking on the live answers
python backend/scripts/browser_check.py                                                           # the real app in headless Edge/Chrome (npm run build && npm run preview first; pip install websocket-client)
python backend/scripts/faq_review.py                                                              # writes docs/FAQ_REVIEW.md (weak FAQ links, for Ojani)
```
Use `127.0.0.1` in `VITE_API_URL` (on Windows `localhost` adds about 2 s per call). `ALLOWED_ORIGINS` must contain the page's origin (default
`http://localhost:5173`; add the LAN address when testing from a phone). What the app sends and reads: `docs/API_CONTRACT.md`; how this API
answers it: `API.md`. Where they differ, `src/api/adapters.js` bridges them (it uses the server's `score`, accepts `{en,fr}` texts, and turns
`{data_quality: "desert" | "no_data"}` and `{outside: true}` into the friendly screens).

## Layers (each only talks to the one below)
```
routes/        thin Flask blueprints: parse + validate input, call engine_client, validate output (schemas.py)
services/      engine_client.py (orchestration + cache), cache.py, counters.py, advisor.py (keyword search), llm.py + explain.py (optional model, template fallback), nasa_power.py (optional live climate, unused by endpoints)
engine/        PURE logic, no Flask/database: scoring, scenarios, suitability, rotation generation, twins, planting window
providers/     the only source of data: MockProvider (labelled fixtures) | DatabaseProvider (Supabase, schema pending)
schemas.py     API contract (pydantic v1).   models.py: database tables (SQLAlchemy 1.4), intentionally empty.
mock/          labelled fixtures. Mirrors of public/mock/*.json: refresh with scripts/sync_mocks.py (a test detects drift).
```

## What is real and what is mock
- **Real logic, mock data:** ranking and scoring (matches the frontend's `scoring.js`, tested for parity), dry/normal/wet scenario
  report, input validation, caching, rate limiting, error handling. Every scoring number is configurable and says where it came from
  (`engine/config.py`).
- **Implemented and unit-tested, but not used by the mock endpoints** (they need data the fixtures do not have): crop suitability
  (`engine/suitability.py`), rotation generation under structural rules (`engine/rotation.py`), Climate Twins matching
  (`engine/twins.py`), planting window from rainfall (`engine/window.py`; its rain share is a required setting, not guessed).
- **Mock only:** zone of a point (the frontend's latitude-band guess), profiles for zones 1-3, plans, twins (zone 3 only), watch months
  (zone 3 only), crops, passport and proof (all values `null`), advice passages (samples), feedback/event counts (memory).
- Nothing in the mock fixtures is real agricultural data, and unknown stays `null`/empty instead of being guessed.

## Real data (ENGINE_MODE=real)
Set `ENGINE_MODE=real` and `DATABASE_URL` (the Supabase Postgres connection string). `providers/database.py` then reads Ojani's
database, read-only: his SQL functions (`nearest_cell`, `get_profile`, `get_twins`, `get_zones_geojson`, `get_passport`, `get_proof`)
and the tables mirrored in `models.py`. Rotation plans are generated by `engine/plans.py`, a port of Ojani's `engine/rotations.mjs`
(a test runs his JS and checks identical plans), then scored and ranked by this backend's own engine.
- No `DATABASE_URL`: `503 database_not_configured`. Database down: `503 database_unavailable` (no secrets in the message).
- Advisor in real mode: `/api/faq`, `/api/advice-index` and `/api/ask` read Ojani's FAO passages (`get_faq`, `get_advice_index`). The corpus is
  stored one language per passage, so a passage has text in one language only (never a made-up translation): `/faq?lang=` points each
  question at its passage in that language, `/advice-index?lang=` keeps that language only (the app should pass its language), and
  `/ask` searches the passages of the question's language with the keyword search in `services/advisor.py`, trims long pages to the
  best sentences, and cites document, page, licence and link. The optional model (ANTHROPIC_API_KEY) words the answer from the top 3
  passages. Ojani's vector search (embeddings) is a separate RAG system: plug it into `app.extensions["rag"]` and it answers first.
  Every FAQ item is still a `draft` in the database (status is returned so the app can say so).
- Tested with a SQLite copy of the tables and answers recorded from the live database; a real connection has not been run from this repo.
