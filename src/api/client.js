import { API_URL, USE_MOCK } from './config.js'

// Generic fetch. With USE_MOCK, reads /public/mock/<mockFile> instead.
export async function api(path, { mockFile, ...init } = {}) {
  const url = USE_MOCK && mockFile ? `/mock/${mockFile}` : API_URL + path
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
