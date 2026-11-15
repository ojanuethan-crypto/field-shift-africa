import { useEffect, useState } from 'react'
import { api } from './client.js'
import { USE_MOCK } from './config.js'
import { normalizeProfile, normalizeRotations } from './adapters.js'

// Rough Africa bounding box. Real edge cases (ocean, desert, no data) belong to S26.
export function isInsideAfrica(lat, lon) {
  return lat >= -35 && lat <= 37.5 && lon >= -18 && lon <= 52
}

// MOCK ONLY: crude latitude-band zone guess. The real backend returns the zone.
export function mockZoneId(lat) {
  if (lat >= 10) return 1
  if (lat >= 7.5) return 2
  if (lat <= -8) return 2
  return 3
}

function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch((error) => live && setState({ data: null, error, loading: false }))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

// Small in-memory cache so S7, S8, S18 and S19 do not each hit the backend for the same request.
const cache = new Map()
function cached(key, load, bypass) {
  if (!bypass && cache.has(key)) return cache.get(key)
  const promise = load().catch((e) => {
    cache.delete(key)
    throw e
  })
  cache.set(key, promise)
  return promise
}

// Land summary for S3. Returns { zone, description, hazards, rain_p50, soil } (texts as {en,fr}),
// { outside: true } or { state } (desert / ocean / nodata ...). Real API: GET /api/profile.
export function useProfile(farm, retryKey = 0, lang = 'en') {
  const langKey = USE_MOCK ? '' : lang // mock texts hold both languages: no refetch on language change
  return useAsync(async () => {
    if (!farm) return null
    if (!isInsideAfrica(farm.lat, farm.lon)) return { outside: true }
    return cached(`profile:${farm.lat},${farm.lon},${langKey}`, async () => {
      if (USE_MOCK) {
        const all = await api('', { mockFile: 'profiles.json' })
        return normalizeProfile(all[mockZoneId(farm.lat)])
      }
      return normalizeProfile(await api(`/api/profile?lat=${farm.lat}&lon=${farm.lon}&lang=${lang}`))
    }, retryKey > 0)
  }, [farm?.lat, farm?.lon, retryKey, langKey])
}

// Candidate plans for S7 / S8 / S18 / S19. Real API: POST /api/rotations with the farmer's answers
// (Roadmap section 6: priorities, last_crop, constraints). Mock: 3 plans for the zone, ranked in the browser.
export function useRotations(farm, retryKey = 0, answers = {}, lang = 'en') {
  const body = {
    lat: farm?.lat,
    lon: farm?.lon,
    lang,
    priorities: answers.priorities ?? [],
    last_crop: answers.lastCrop && answers.lastCrop !== 'none' ? answers.lastCrop : null,
    constraints: { irrigation: answers.canWater ?? null, fertilizer: answers.canBuyFertilizer ?? null },
  }
  const key = USE_MOCK ? '' : JSON.stringify(body) // mock ignores the answers: no refetch when they change
  return useAsync(async () => {
    if (!farm) return null
    return cached(`rotations:${farm.lat},${farm.lon},${key}`, async () => {
      if (USE_MOCK) {
        const all = await api('', { mockFile: 'rotations.json' })
        return normalizeRotations(all[mockZoneId(farm.lat)])
      }
      return normalizeRotations(await api('/api/rotations', { method: 'POST', body: JSON.stringify(body) }))
    }, retryKey > 0)
  }, [farm?.lat, farm?.lon, retryKey, key])
}
