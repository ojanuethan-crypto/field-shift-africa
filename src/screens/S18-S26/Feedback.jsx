import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import { Button, Card } from './parts.jsx'

// S25 Feedback (SHOULD): thumbs, optional one question, thank-you. Anonymous: no name, no id.
// TODO(F50): POST { vote, comment } to the backend counts endpoint when it exists. Until then it is
// stored only on this phone (fs.feedback), and the screen says so.
export default function S25Feedback() {
  const { t } = useTranslation()
  const [vote, setVote] = useState(null) // 'up' | 'down'
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)

  const send = () => {
    try {
      const all = JSON.parse(localStorage.getItem('fs.feedback') || '[]')
      all.push({ vote, comment: comment.trim(), at: new Date().toISOString().slice(0, 10) })
      localStorage.setItem('fs.feedback', JSON.stringify(all))
    } catch { /* storage blocked: still thank the user */ }
    setSent(true)
  }

  if (sent) {
    return (
      <Screen title={t('s25.title')} speak={t('s25.thanks')}>
        <div className="rounded-3xl bg-brand-900 px-6 py-10 text-center text-white" role="status">
          <div className="text-7xl" aria-hidden>🌱</div>
          <h2 className="mt-4 text-2xl font-semibold">{t('s25.thanks')}</h2>
          <p className="mt-2 opacity-90">{t('s25.thanksBody')}</p>
        </div>
        <Link to="/" className="mt-5 block"><Button>{t('home')}</Button></Link>
      </Screen>
    )
  }

  const big = (on, tone) =>
    `tap flex min-h-28 flex-1 flex-col items-center justify-center gap-2 rounded-3xl text-lg font-semibold ${
      on ? `${tone} text-white ring-4 ring-amber-accent` : 'bg-white text-brand-900'
    }`

  return (
    <Screen title={t('s25.title')} speak={t('s25.question')}>
      <div className="space-y-4">
        <h2 className="text-center text-2xl font-semibold text-brand-900">{t('s25.question')}</h2>
        <div className="flex gap-3" role="group" aria-label={t('s25.question')}>
          <button type="button" aria-pressed={vote === 'up'} onClick={() => setVote('up')} className={big(vote === 'up', 'bg-brand-700')}>
            <ThumbsUp size={40} />
            {t('s25.yes')}
          </button>
          <button type="button" aria-pressed={vote === 'down'} onClick={() => setVote('down')} className={big(vote === 'down', 'bg-red-700')}>
            <ThumbsDown size={40} />
            {t('s25.no')}
          </button>
        </div>

        <Card className="space-y-2">
          <label htmlFor="fb" className="text-base font-semibold text-brand-900">{t('s25.optional')}</label>
          <textarea
            id="fb"
            rows={3}
            maxLength={280}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-2xl border-2 border-gray-200 bg-surface p-3 text-base"
          />
        </Card>

        <Button disabled={!vote} onClick={send}>{t('s25.send')}</Button>
        <p className="px-4 text-center text-sm text-ink-soft">{t('s25.privacy')}</p>
      </div>
    </Screen>
  )
}
