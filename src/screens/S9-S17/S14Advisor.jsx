import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mic, Search, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import { USE_MOCK } from '../../api/config.js'
import { api } from '../../api/client.js'
import { useFarm } from '../../state/FarmContext.jsx'
import ListenButton from './components/ListenButton.jsx'
import MockBadge from './components/MockBadge.jsx'
import SourceChip from './components/SourceChip.jsx'
import ThumbsRow from './components/ThumbsRow.jsx'
import { searchPassages, useAdviceIndex, useFaq, useOnline } from './lib/advisor.js'

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

// S14 Ask the Advisor. Online: POST /api/ask (8 s timeout). Otherwise: offline keyword search over bundled passages.
export default function S14Advisor() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const { farm } = useFarm()
  const online = useOnline()
  const index = useAdviceIndex()
  const faq = useFaq(lang)
  const [text, setText] = useState('')
  const [ans, setAns] = useState(null) // { question, text|null, sources, mode }
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const searchOnly = USE_MOCK || !online

  const ask = async (question) => {
    const qs = question.trim()
    if (!qs) return
    setBusy(true)
    let result = null
    if (!USE_MOCK && online) {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      try {
        const r = await api('/api/ask', {
          method: 'POST',
          signal: ctrl.signal,
          body: JSON.stringify({ question: qs, lang, zone_id: farm?.zone_id ?? null }),
        })
        result = { text: r.answer, sources: r.sources ?? [], mode: r.mode ?? 'online' }
      } catch { /* fall back to offline search */ }
      clearTimeout(timer)
    }
    if (!result) {
      const hit = searchPassages(qs, index.data?.passages ?? [], lang)
      result = hit
        ? { text: hit.text[lang], sources: [{ id: hit.id, doc: hit.doc, page: hit.page }], mode: 'search' }
        : { text: null, sources: [], mode: 'none' }
    }
    setAns({ ...result, question: qs })
    setBusy(false)
  }

  const listen = () => {
    const r = new SR()
    r.lang = lang === 'fr' ? 'fr-FR' : 'en-US'
    r.onresult = (e) => { const s = e.results[0][0].transcript; setText(s); ask(s) }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    setListening(true)
    r.start()
  }

  const currentId = ans?.sources?.[0]?.id
  const chips = (faq.data?.items ?? []).filter((f) => f.passage !== currentId).slice(0, 3)
  const answerText = ans && (ans.text ?? t('s14.dontKnow'))

  return (
    <Screen title={t('s14.title')} subtitle={t('s14.subtitle')} speak={`${t('s14.title')}. ${t('s14.subtitle')}`}>
      <div className="space-y-4">
        <MockBadge />
        {searchOnly && (
          <p className="flex items-center gap-2 rounded-2xl border-2 border-amber-accent bg-white p-2 text-sm font-bold">
            <WifiOff size={18} /> {t('s14.searchOnly')}
          </p>
        )}

        <form onSubmit={(e) => { e.preventDefault(); ask(text) }} className="flex items-center gap-2 rounded-3xl bg-white p-2 shadow-sm">
          {SR && (
            <button type="button" onClick={listen} aria-label={t('s14.mic')}
              className={`tap inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white ${listening ? 'animate-pulse bg-red-600' : 'bg-brand-700'}`}>
              <Mic size={28} />
            </button>
          )}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={listening ? t('s14.listening') : t('s14.placeholder')}
            aria-label={t('s14.placeholder')}
            className="min-h-12 min-w-0 flex-1 rounded-full bg-surface px-4"
          />
          <button type="submit" disabled={busy} aria-label={t('s14.ask')}
            className="tap inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-900 text-white disabled:opacity-50">
            <Search />
          </button>
        </form>

        {ans && (
          <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-brand-700">{ans.question}</p>
                <p className="mt-1 text-lg">{answerText}</p>
              </div>
              <ListenButton text={answerText} />
            </div>
            {ans.sources.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-bold text-brand-900">{t('s14.sources')}</p>
                <div className="flex flex-wrap gap-2">
                  {ans.sources.map((s) => <SourceChip key={`${s.id ?? s.doc}-${s.page}`} source={s} />)}
                </div>
              </div>
            )}
            <ThumbsRow key={ans.question} target="advisor-answer" />
            {chips.length > 0 && (
              <div>
                <p className="mb-1 text-sm font-bold text-brand-900">{t('s14.followUp')}</p>
                <div className="flex flex-wrap gap-2">
                  {chips.map((f) => (
                    <button key={f.id} type="button" onClick={() => { setText(f.q[lang]); ask(f.q[lang]) }}
                      className="tap rounded-full bg-brand-100 px-4 py-2 text-left text-sm font-bold text-brand-900">
                      {f.emoji} {f.q[lang]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Link to="/faq" className="tap flex items-center justify-center gap-2 rounded-2xl bg-brand-900 py-3 text-lg font-medium text-white">
          {t('s14.common')}
        </Link>
      </div>
    </Screen>
  )
}
