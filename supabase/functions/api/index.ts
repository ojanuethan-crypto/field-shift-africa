// @ts-nocheck
// SciFarm public API (no login). One Edge Function, routed by the last path segment.
// GET  profile | window | twins | zones | proof | passport | faq | advice-index | health
// POST rotations | ask | feedback | event
import { createClient } from "npm:@supabase/supabase-js@2";
import { rankRotations } from "./engine.ts";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (body: unknown, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json", ...extra } });
const bad = (msg: string, status = 400) => json({ error: msg }, status);

const round2 = (v: number) => Math.round(v * 100) / 100;
function coords(p: URLSearchParams | any) {
  const lat = Number(p.lat), lon = Number(p.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat: round2(lat), lon: round2(lon) }; // privacy: coordinates are rounded, never stored
}

let refCache: any = null, refAt = 0;
async function reference() {
  if (refCache && Date.now() - refAt < 60_000) return refCache;
  const [crops, reasons] = await Promise.all([
    sb.from("crops").select("slug,family,is_legume,cycle_days,tmin_abs,tmin_opt,tmax_opt,tmax_abs,rain_min_abs,rain_min_opt,rain_max_opt,rain_max_abs,ph_min_abs,ph_min_opt,ph_max_opt,ph_max_abs,kc_avg,drought_tol,flood_tol,heat_tol,cover,income_idx,in_mvp"),
    sb.from("reasons").select("code,text_en,text_fr"),
  ]);
  refCache = { crops: crops.data ?? [], reasons: Object.fromEntries((reasons.data ?? []).map((r: any) => [r.code, { en: r.text_en, fr: r.text_fr }])) };
  refAt = Date.now();
  return refCache;
}

async function rotations(body: any) {
  const c = coords(body); if (!c) return bad("lat and lon are required");
  const { data: cid } = await sb.rpc("nearest_cell", { p_lat: c.lat, p_lon: c.lon });
  if (!cid) return json({ no_data: true, plans: [] });
  const [feat, clim, watch, win, ref, cell] = await Promise.all([
    sb.from("cell_features").select("rain_annual,ph,soc,n_seasons,hz_drought,hz_flood,hz_heat").eq("cell_id", cid).single(),
    sb.from("climate_monthly").select("month,rain_p20,rain_p50,rain_p80,tmean,et0").eq("cell_id", cid).order("month"),
    sb.from("cell_watch_months").select("month").eq("cell_id", cid).eq("is_flood", true),
    sb.from("planting_windows").select("season,start_month").eq("cell_id", cid).not("start_month", "is", null).order("season"),
    reference(),
    sb.from("cells").select("zone_id").eq("cell_id", cid).single(),
  ]);
  const f = feat.data; if (!f) return json({ no_data: true, plans: [] });
  if (cell.data?.zone_id === 10) return json({ low_potential: true, plans: [], reason: "desert" });
  let plantMonths = (win.data ?? []).map((w: any) => w.start_month);
  if (!plantMonths.length) { // steady rain all year: start after the driest month
    const rows = clim.data ?? []; const driest = rows.reduce((a: any, b: any) => (b.rain_p50 < a.rain_p50 ? b : a));
    plantMonths = [(driest.month % 12) + 1];
  }
  const out = rankRotations({
    cell: { cell_id: cid, rain_annual: f.rain_annual, ph: f.ph, soc: f.soc, n_seasons: f.n_seasons, hz: { drought: f.hz_drought, flood: f.hz_flood, heat: f.hz_heat } },
    climate: clim.data ?? [], floodMonths: (watch.data ?? []).map((w: any) => w.month), plantMonths, crops: ref.crops, reasons: ref.reasons,
  }, { lastCrop: body.last_crop ?? null, canWater: !!body.can_water, canBuyFertilizer: !!body.can_buy_fertilizer, priorities: Array.isArray(body.priorities) ? body.priorities.slice(0, 2) : [] });
  return json(out);
}

// ---------------- Advisor (RAG) ----------------
const THR = { en: 0.82, fr: 0.83 };
const IDK = { en: "I don't know. Please ask a local agronomist.", fr: "Je ne sais pas. Demandez à un agronome local." };
const STOP = new Set("the a an is are my i to of in on do how what can and for why with les la le un une des de du est mon ma mes je que qui quoi comment dans et pour sur ne pas quand dois".split(" "));
function extractive(q: string, text: string) {
  const sents = text.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý0-9])/).map((s) => s.trim()).filter((s) => s.split(" ").length >= 6);
  if (!sents.length) return text.slice(0, 300);
  const qt = (q.toLowerCase().match(/[a-zà-ÿ]{4,}/g) ?? []).filter((w) => !STOP.has(w));
  const sc = sents.map((s) => qt.filter((w) => s.toLowerCase().includes(w.slice(0, 5))).length);
  const i = sc.indexOf(Math.max(...sc));
  return sents.slice(i, i + 2).join(" ");
}

async function ask(body: any) {
  const t0 = Date.now();
  const q = String(body.question ?? "").trim().slice(0, 300), lang = body.lang === "fr" ? "fr" : "en";
  if (q.length < 3) return bad("question is required");
  let zoneName = "", planCrops = Array.isArray(body.plan_crops) ? body.plan_crops.slice(0, 6).map(String) : [];
  if (Number.isInteger(body.zone_id)) { const z = await sb.from("zones").select("name_en,name_fr").eq("zone_id", body.zone_id).maybeSingle(); zoneName = z.data?.[`name_${lang}`] ?? ""; }
  const emb = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/embed`, { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ texts: [q] }) });
  const log = (mode: string, ids: number[], top: number, answered: boolean) => sb.from("advisor_queries").insert({ lang, zone_id: body.zone_id ?? null, mode, top_chunk_ids: ids, top_score: top, answered, latency_ms: Date.now() - t0 });
  if (!emb.ok) { await log("none", [], 0, false); return json({ answer: IDK[lang], sources: [], mode: "none" }); }
  const vec = (await emb.json()).embeddings[0];
  const { data: hits } = await sb.rpc("search_passages", { p_query: q, p_embedding: `[${vec.join(",")}]`, p_lang: lang, p_k: 4 });
  const top = hits?.[0];
  const relevant = top && top.similarity >= THR[lang] && hits.slice(0, 3).some((h: any) => h.lexical_hit);
  if (!relevant) { await log("none", [], top?.similarity ?? 0, false); return json({ answer: IDK[lang], sources: [], mode: "none" }); }
  const good = hits.filter((h: any) => h.similarity >= THR[lang] - 0.02).slice(0, 3);
  const sources = good.map((h: any) => ({ doc: h.doc_title, page: h.page, licence: h.licence, source_url: h.source_url, chunk_id: h.chunk_id }));
  let answer = extractive(q, top.text), mode = "search";
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (key) {
    try {
      const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 8000);
      const sys = `You are a farming advisor for African smallholders. Answer ONLY from the PASSAGES. Reply in ${lang === "fr" ? "French" : "English"}, in at most 4 short plain sentences. Add no facts, numbers or product names that are not in the passages. Give no chemical or pesticide dosages and no medical advice. If the passages do not answer the question, say you do not know. End with: ${lang === "fr" ? "Demandez à un agronome local." : "Ask a local agronomist."}`;
      const user = `Farm zone: ${zoneName || "unknown"}. Plan crops: ${planCrops.join(", ") || "none"}.\nQUESTION: ${q}\nPASSAGES:\n` + good.map((h: any, i: number) => `[${i + 1}] ${h.text.slice(0, 1400)}`).join("\n");
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", signal: ctl.signal, headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 300, system: sys, messages: [{ role: "user", content: user }] }) });
      clearTimeout(timer);
      if (r.ok) { const j = await r.json(); const t = j.content?.[0]?.text?.trim(); if (t) { answer = t; mode = "rag"; } }
    } catch (_) { /* timeout or API error: keep the extractive answer (offline-style search) */ }
  }
  await log(mode, good.map((h: any) => h.chunk_id), top.similarity, true);
  return json({ answer, sources, mode });
}

async function feedback(body: any) {
  const target = String(body.target ?? ""), value = Number(body.value);
  if (!["plan", "answer", "app", "proof", "passport"].includes(target) || ![1, -1].includes(value)) return bad("target and value (1 or -1) are required");
  const note = body.note ? String(body.note).slice(0, 280) : null;
  const { error } = await sb.from("feedback").insert({ target, value, note, zone_id: Number.isInteger(body.zone) ? body.zone : null, lang: body.lang === "fr" ? "fr" : "en" });
  return error ? bad("could not save", 500) : json({ ok: true });
}
async function event(body: any) {
  const names = ["visit", "farm_picked", "plan_viewed", "plan_shared", "advisor_asked", "passport_opened", "proof_opened", "offline_downloaded"];
  if (!names.includes(body.name)) return bad("unknown event");
  const { error } = await sb.from("usage_events").insert({ name: body.name, zone_id: Number.isInteger(body.zone) ? body.zone : null });
  return error ? bad("could not save", 500) : json({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);
  const route = url.pathname.replace(/\/+$/, "").split("/").pop();
  try {
    if (req.method === "GET") {
      const p = Object.fromEntries(url.searchParams);
      const cached = { "Cache-Control": "public, max-age=3600" };
      switch (route) {
        case "health": return json({ ok: true });
        case "profile": { const c = coords(p); if (!c) return bad("lat and lon are required"); const { data } = await sb.rpc("get_profile", { p_lat: c.lat, p_lon: c.lon }); return json(data); }
        case "window": { const c = coords(p); if (!c) return bad("lat and lon are required"); const { data } = await sb.rpc("get_window", { p_lat: c.lat, p_lon: c.lon }); return json(data); }
        case "twins": { const c = coords(p); if (!c) return bad("lat and lon are required"); const { data } = await sb.rpc("get_twins", { p_lat: c.lat, p_lon: c.lon }); data.twins = (data.twins ?? []).filter((t: any) => t.similarity >= 0.4); return json(data); }
        case "zones": { const { data } = await sb.rpc("get_zones_geojson"); const z = await sb.from("zones").select("zone_id,slug,name_en,name_fr,desc_en,desc_fr,icon,color,rain_regime,typical_crops"); return json({ geojson: data, zones: z.data }, 200, cached); }
        case "proof": { const { data } = await sb.rpc("get_proof"); return json(data, 200, cached); }
        case "passport": { const { data } = await sb.rpc("get_passport"); return json(data, 200, cached); }
        case "faq": { const { data } = await sb.rpc("get_faq", { p_lang: p.lang === "fr" ? "fr" : "en" }); return json(data, 200, cached); }
        case "advice-index": { const { data } = await sb.rpc("get_advice_index"); return json(data, 200, cached); }
      }
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      switch (route) {
        case "rotations": return await rotations(body);
        case "ask": return await ask(body);
        case "feedback": return await feedback(body);
        case "event": return await event(body);
      }
    }
    return bad("not found", 404);
  } catch (e) {
    return json({ error: "server error" }, 500);
  }
});
