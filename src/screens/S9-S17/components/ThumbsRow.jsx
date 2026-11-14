import { useState } from 'react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { USE_MOCK } from '../../../api/config.js'
import { api } from '../../../api/client.js'

// Anonymous "was this useful?" (F50). Sends only {target, value}; ignores network errors.
export default function ThumbsRow({ target }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(null)
  const send = (v) => {
    setValue(v)
    if (!USE_MOCK) api('/api/feedback', { method: 'POST', body: JSON.stringify({ target, value: v }) }).catch(() => {})
  }
  if (value) return <p className="font-bold text-brand-700">{t('s14.thanks')}</p>
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-brand-900">{t('s14.useful')}</span>
      <button type="button" onClick={() => send('up')} aria-label={t('common.yes')}
        className="tap inline-flex w-12 items-center justify-center rounded-full border-2 border-brand-700 text-brand-700">
        <ThumbsUp />
      </button>
      <button type="button" onClick={() => send('down')} aria-label={t('common.no')}
        className="tap inline-flex w-12 items-center justify-center rounded-full border-2 border-gray-400 text-gray-700">
        <ThumbsDown />
      </button>
    </div>
  )
}
