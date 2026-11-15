// Phone text-to-speech (F11). The four named voices are tone presets (gender + pitch + speed) applied
// over the voices installed on the phone, because browsers do not ship voices called Iris, Marc, etc.
export const VOICES = [
  { id: 'iris', name: 'Iris', gender: 'f', pitch: 1.15, rate: 0.95 },
  { id: 'jarvis', name: 'Jarvis', gender: 'f', pitch: 0.9, rate: 0.88 },
  { id: 'marc', name: 'Marc', gender: 'm', pitch: 0.9, rate: 0.95 },
  { id: 'clark', name: 'Clark', gender: 'm', pitch: 0.7, rate: 0.88 },
]

const FEMALE = /zira|hazel|susan|eva|julie|hortense|denise|elsa|aria|jenny|samantha|female|woman|femme/i
const MALE = /david|mark|george|paul|claude|henri|guy|ryan|daniel|male|man|homme/i

let activeVoice = 'iris'
export const setActiveVoice = (id) => { if (id) activeVoice = id }

function pickSystemVoice(profile, lang) {
  const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang))
  if (!all.length) return null
  const wanted = all.filter((v) => (profile.gender === 'f' ? FEMALE : MALE).test(v.name))
  const pool = wanted.length ? wanted : all
  const sameGender = VOICES.filter((v) => v.gender === profile.gender)
  return pool[sameGender.findIndex((v) => v.id === profile.id) % pool.length]
}

export function speakText(text, lang, voiceId = activeVoice) {
  if (!('speechSynthesis' in window) || !text) return
  const profile = VOICES.find((v) => v.id === voiceId) || VOICES[0]
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const l = lang === 'fr' ? 'fr' : 'en'
  u.lang = l === 'fr' ? 'fr-FR' : 'en-US'
  const sys = pickSystemVoice(profile, l)
  if (sys) u.voice = sys
  u.pitch = profile.pitch
  u.rate = profile.rate
  window.speechSynthesis.speak(u)
}
