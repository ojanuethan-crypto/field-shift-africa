import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import ListenButton from './components/ListenButton.jsx'
import MockBadge from './components/MockBadge.jsx'
import QueryState from './components/QueryState.jsx'
import SourceChip from './components/SourceChip.jsx'
import { useAdviceIndex, useFaq } from './lib/advisor.js'

// S15 Common questions: grid of question pictures; opens a reviewed answer (works from the bundled index).
export default function S15CommonQuestions() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const faq = useFaq(lang)
  const index = useAdviceIndex()
  const [openId, setOpenId] = useState(null)
  const items = faq.data?.items ?? []
  const open = items.find((f) => f.id === openId)
  const passage = open && index.data?.passages.find((p) => p.id === open.passage)

  return (
    <Screen title={t('s15.title')} subtitle={t('s15.subtitle')} speak={`${t('s15.title')}. ${t('s15.subtitle')}`}>
      <div className="space-y-4">
        <MockBadge />
        <QueryState query={faq} />

        {passage && (
          <div className="space-y-3 rounded-3xl border-2 border-brand-700 bg-white p-4 shadow-sm" aria-live="polite">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-bold text-brand-700">{open.emoji} {open.q[lang]}</p>
                <p className="mt-1 text-lg">{passage.text[lang]}</p>
              </div>
              <ListenButton text={`${open.q[lang]}. ${passage.text[lang]}`} />
            </div>
            <SourceChip source={{ id: passage.id, doc: passage.doc, page: passage.page }} />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {items.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setOpenId(f.id)}
              aria-pressed={openId === f.id}
              className={`tap flex min-h-28 flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-white p-2 text-center text-xs font-bold leading-tight text-brand-900 ${openId === f.id ? 'border-brand-700' : 'border-gray-200'}`}
            >
              <span className="text-3xl" aria-hidden="true">{f.emoji}</span>
              {f.q[lang]}
            </button>
          ))}
        </div>

        <Link to="/advisor" className="tap flex items-center justify-center rounded-2xl bg-brand-900 py-3 text-lg font-medium text-white">
          {t('s15.askOther')}
        </Link>
      </div>
    </Screen>
  )
}
