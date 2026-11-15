import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import ScreenHeader from '../../components/ScreenHeader'
import { Card, Button } from '../../components/ui'

/* S25 Feedback (SHOULD): thumbs, optional one question, thank-you. Anonymous: no name, no id.
   TODO(F50): POST { vote, comment } to the backend counts endpoint when it exists. Until then it
   is stored only on this phone, and we say so. */
export default function Feedback() {
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
      <main>
        <ScreenHeader title={t('feedback.title')} speak={t('feedback.thanks')} />
        <div className="px-4 pt-6">
          <div className="rounded-3xl bg-primary px-6 py-10 text-center text-white" role="status">
            <div className="text-7xl" aria-hidden>🌱</div>
            <h2 className="mt-4 text-2xl font-bold">{t('feedback.thanks')}</h2>
            <p className="mt-2 text-white/90">{t('feedback.thanksBody')}</p>
          </div>
          <Link to="/" className="mt-5 block"><Button>{t('common.home')}</Button></Link>
        </div>
      </main>
    )
  }

  const big = (on, tone) =>
    `flex min-h-28 flex-1 flex-col items-center justify-center gap-2 rounded-3xl text-lg font-bold ${
      on ? `${tone} text-white ring-4 ring-amber` : 'bg-white text-primary'
    }`

  return (
    <main>
      <ScreenHeader title={t('feedback.title')} speak={t('feedback.question')} />
      <div className="space-y-4 px-4">
        <h2 className="text-center text-2xl font-bold text-primary">{t('feedback.question')}</h2>
        <div className="flex gap-3" role="group" aria-label={t('feedback.question')}>
          <button type="button" aria-pressed={vote === 'up'} onClick={() => setVote('up')} className={big(vote === 'up', 'bg-accent')}>
            <ThumbsUp size={40} />
            {t('feedback.yes')}
          </button>
          <button type="button" aria-pressed={vote === 'down'} onClick={() => setVote('down')} className={big(vote === 'down', 'bg-danger')}>
            <ThumbsDown size={40} />
            {t('feedback.no')}
          </button>
        </div>

        <Card className="space-y-2">
          <label htmlFor="fb" className="text-base font-semibold text-primary">{t('feedback.optional')}</label>
          <textarea
            id="fb"
            rows={3}
            maxLength={280}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-2xl border-2 border-line bg-surface p-3 text-base"
          />
        </Card>

        <Button disabled={!vote} onClick={send}>{t('feedback.send')}</Button>
        <p className="px-6 text-center text-sm text-muted">{t('feedback.privacy')}</p>
      </div>
    </main>
  )
}
