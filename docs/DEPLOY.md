# Deploying SciFarm (API + app)

What is done and tested here: the API against the live database, the app against the API in a real browser (`backend/scripts/check_frontend.mjs`,
`backend/scripts/browser_check.py`), 270+ backend tests. What is NOT tested because it needs accounts or Docker: the host itself
(`render.yaml`, `backend/Dockerfile`). Do the steps below, then run the smoke script against the public URL.

## 1. Before you deploy (5 minutes)
1. **Rotate the database password** (Supabase > Project settings > Database), because the old one was pasted in a chat.
   Better: create a read-only role for the API (it only reads, plus inserts anonymous thumbs and usage counts into `feedback` and `usage_events`).
2. **Connection string = the Session pooler** (IPv4), not the direct host (IPv6 only):
   `postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres` (Project settings > Database > Connection string).
3. Decide the public names, e.g. API `https://scifarm-api.onrender.com` and app `https://scifarm-app.onrender.com`.

## 2. Deploy on Render (blueprint)
1. Push this repository (branch with the backend and the frontend edits) to GitHub.
2. Render > New > Blueprint > pick the repo (it reads `render.yaml`).
3. Fill the three secrets it asks for:
   - `scifarm-api`: `DATABASE_URL` (pooler string), `ALLOWED_ORIGINS` (the app URL, no trailing slash), optional `ANTHROPIC_API_KEY`.
   - `scifarm-app`: `VITE_API_URL` (the API URL). It is baked into the build, so redeploy the app after changing it.
4. Wait for both to go green. Open `<api>/api/health` (expect `{"db":"ok","mode":"real",...}`).

## 3. Check it
```
bash backend/scripts/smoke.sh https://scifarm-api.onrender.com                 # every endpoint, English + French
python backend/scripts/prewarm.py --base https://scifarm-api.onrender.com      # warm the cache for the demo sites
node backend/scripts/check_frontend.mjs https://scifarm-api.onrender.com       # the app's own adapters on the live answers
python backend/scripts/browser_check.py https://scifarm-app.onrender.com       # the real app in a browser (needs: pip install websocket-client)
```
Then open the app on a phone, on mobile data: language, a place, routes, advisor.

## 4. Keep it alive for the demo
- Free hosts sleep: ping `<api>/api/health` every 5 minutes (UptimeRobot) and wake it 10 minutes before the demo, then run `prewarm.py`.
- Backup run on a laptop: `waitress-serve --listen=127.0.0.1:8000 backend.wsgi:app` (Windows) with `backend/.env`, and the app built with
  `VITE_API_URL=http://127.0.0.1:8000`.

## 5. Docker instead (untested)
```
docker build -f backend/Dockerfile -t scifarm-api .
docker run -p 8000:8000 -e ENGINE_MODE=real -e DATABASE_URL=... -e ALLOWED_ORIGINS=https://<app> scifarm-api
```
`ENV=prod` refuses to start if `ALLOWED_ORIGINS` contains `*`.

## Known limits to say out loud
- Advisor answers are draft: all FAQ items are unreviewed (`docs/FAQ_REVIEW.md` lists the weak links) and answers come from FAO page text.
- The Proof page shows the real backtest including the 2020-22 Horn of Africa miss; the plants (NDVI) check is not computed yet.
- FAO documents are used under FAO's non-commercial terms: confirm before any commercial use.
- Rotation scores compare options; they are not yield or income forecasts. Crop traits are assumptions awaiting agronomist review.
