import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// SHARED: each owner adds ONE JSON file per language and ONE line in each list.
import enCommon from './locales/en/common.json'
import frCommon from './locales/fr/common.json'
import enS0S8 from './locales/en/s0-s8.json'
import frS0S8 from './locales/fr/s0-s8.json'
import enS9S17 from './locales/en/s9-s17.json'
import frS9S17 from './locales/fr/s9-s17.json'

const en = { ...enCommon, ...enS0S8, ...enS9S17 }
const fr = { ...frCommon, ...frS0S8, ...frS9S17 }

const phoneLang = (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en'
let saved = null
try { saved = JSON.parse(localStorage.getItem('fieldnav.state.v1') || '{}').lang } catch { /* ignore */ }

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: saved || phoneLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
