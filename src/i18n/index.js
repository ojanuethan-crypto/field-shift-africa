import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getSettings } from '../lib/settings'

/*
 * Translation files are auto-loaded from ./locales/<lang>/*.json and deep-merged.
 * TEAM RULE: add your OWN file per screen group (e.g. locales/en/s0-s8.json + locales/fr/s0-s8.json)
 * so nobody edits the same file. Never hardcode user-facing text in components.
 */
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
function deepMerge(target, src) {
  for (const k of Object.keys(src)) {
    if (isObj(src[k]) && isObj(target[k])) deepMerge(target[k], src[k])
    else target[k] = src[k]
  }
  return target
}

const files = import.meta.glob('./locales/*/*.json', { eager: true, import: 'default' })
const resources = { en: { translation: {} }, fr: { translation: {} } }
for (const [path, json] of Object.entries(files)) {
  const lang = path.split('/')[2]
  if (resources[lang]) deepMerge(resources[lang].translation, json)
}

i18n.use(initReactI18next).init({
  resources,
  lng: getSettings().lang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
