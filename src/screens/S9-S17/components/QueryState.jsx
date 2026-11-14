import { useTranslation } from 'react-i18next'

// Loading / error (with retry) for a useData result. Renders nothing when data is ready.
export default function QueryState({ query }) {
  const { t } = useTranslation()
  if (query.isLoading) {
    return <div className="mb-4 h-32 animate-pulse rounded-3xl bg-gray-200" role="status" aria-label={t('s9s17.loading')} />
  }
  if (query.isError) {
    return (
      <div role="alert" className="mb-4 rounded-3xl bg-white p-4 text-center shadow-sm">
        <p>{t('s9s17.error')}</p>
        <button type="button" onClick={() => query.refetch()} className="tap mt-2 rounded-full bg-brand-700 px-6 font-bold text-white">
          {t('s9s17.retry')}
        </button>
      </div>
    )
  }
  return null
}
