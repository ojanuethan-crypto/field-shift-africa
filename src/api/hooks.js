import { useEffect, useState } from 'react'
import { api } from './client.js'
import { USE_MOCK } from './config.js'

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

// Land summary for S3. Returns { zone, description, hazards, rain_p50, soil } (texts as {en,fr}).
export function useProfile(farm, retryKey = 0) {
  return useAsync(async () => {
    if (!farm) return null
    if (!isInsideAfrica(farm.lat, farm.lon)) return { outside: true }
    const id = mockZoneId(farm.lat)
    if (USE_MOCK) {
      const all = await api('', { mockFile: 'profiles.json' })
      return all[id]
    }
    return api(`/api/profile?lat=${farm.lat}&lon=${farm.lon}`)
  }, [farm?.lat, farm?.lon, retryKey])
}

// Candidate plans for S7/S8. Mock returns 3 plans for the zone; real API is POST /api/rotations.
export function useRotations(farm, retryKey = 0) {
  return useAsync(async () => {
    if (!farm) return null
    const id = mockZoneId(farm.lat)
    if (USE_MOCK) {
      const all = await api('', { mockFile: 'rotations.json' })
      return all[id]
    }
    return api('/api/rotations', {
      method: 'POST',
      body: JSON.stringify({ lat: farm.lat, lon: farm.lon }),
    })
  }, [farm?.lat, farm?.lon, retryKey])
}
