import { Link, useSearchParams } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Screen from '../../components/Screen.jsx'
import QueryState from './components/QueryState.jsx'
import { useAdviceIndex } from './lib/advisor.js'

// S16 Source viewer: the passage, document, page and licence behind an answer.
// Link: /sources?id=p1  (or ?doc=...&page=...)
export default function S16SourceViewer() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en'
  const [params] = useSearchParams()
  const index = useAdviceIndex()
  const id = params.get('id')
  const doc = params.get('doc')
  const page = Number(params.get('page'))
  const p = index.data?.passages.find((x) => (id ? x.id === id : x.doc === doc && x.page === page))

  return (
    <Screen title={t('s16.title')} subtitle={t('s16.subtitle')} speak={`${t('s16.title')}. ${t('s16.subtitle')}`}>
      <div className="space-y-4">
        <QueryState query={index} />

        {index.data && !p && (
          <div role="alert" className="rounded-3xl bg-white p-4 text-center shadow-sm">
            <p>{t('s16.notFound')}</p>
          </div>
        )}

        {p && (
          <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
            {p.sample && (
              <p className="flex items-start gap-2 rounded-2xl bg-brand-100 p-2 text-xs font-bold text-brand-900">
                <FlaskConical size={16} className="shrink-0" /> {t('s16.sample')}
              </p>
            )}
            <blockquote className="border-l-8 border-brand-700 pl-3 text-lg">{p.text[lang]}</blockquote>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="font-bold text-brand-900">{t('s16.document')}</dt><dd>{p.doc}</dd>
              <dt className="font-bold text-brand-900">{t('s16.page')}</dt><dd>{p.page}</dd>
              <dt className="font-bold text-brand-900">{t('s16.licence')}</dt><dd>{p.licence}</dd>
            </dl>
          </div>
        )}

        <Link to="/advisor" className="tap flex items-center justify-center rounded-2xl bg-brand-900 py-3 text-lg font-medium text-white">
          {t('s16.back')}
        </Link>
      </div>
    </Screen>
  )
}
