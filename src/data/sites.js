// Quick-pick regions for the home map (picture chips). Coordinates are already rounded.
// `pic` = illustration name in public/icons (zone pictures); `icon` = emoji fallback.
export const SITES = [
  { id: 'douala', icon: '🌴', pic: 'zone-forest', name: { en: 'Douala', fr: 'Douala' }, lat: 4.05, lon: 9.7 },
  { id: 'yaounde', icon: '🌳', pic: 'zone-forest', name: { en: 'Yaoundé', fr: 'Yaoundé' }, lat: 3.87, lon: 11.52 },
  { id: 'ngaoundere', icon: '🌾', pic: 'zone-savanna', name: { en: 'Ngaoundéré', fr: 'Ngaoundéré' }, lat: 7.32, lon: 13.58 },
  { id: 'maroua', icon: '🏜️', pic: 'zone-sahel', name: { en: 'Maroua', fr: 'Maroua' }, lat: 10.59, lon: 14.32 },
  { id: 'niamey', icon: '🏜️', pic: 'zone-sahel', name: { en: 'Niamey (Niger)', fr: 'Niamey (Niger)' }, lat: 13.51, lon: 2.11 },
  { id: 'lusaka', icon: '🌽', pic: 'zone-southern', name: { en: 'Lusaka (Zambia)', fr: 'Lusaka (Zambie)' }, lat: -15.39, lon: 28.32 },
]

export const round2 = (n) => Math.round(n * 100) / 100

// Name for a pin: nearest quick-pick within ~60 km, else rounded coordinates.
export function placeName(lat, lon, lang) {
  let best = null
  for (const s of SITES) {
    const d = Math.hypot(s.lat - lat, (s.lon - lon) * Math.cos((lat * Math.PI) / 180)) * 111
    if (d < 60 && (!best || d < best.d)) best = { d, s }
  }
  return best ? best.s.name[lang] : `${lat.toFixed(2)}, ${lon.toFixed(2)}`
}
