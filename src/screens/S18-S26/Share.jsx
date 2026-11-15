import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Link as LinkIcon, MessageCircle, Share2 } from 'lucide-react'
import Screen from '../../components/Screen.jsx'
import StatusMark from '../../components/StatusMark.jsx'
import Stars from '../../components/Stars.jsx'
import { CROPS } from '../../data/crops.js'
import { useFarm } from '../../state/FarmContext.jsx'
import { useRankedPlans } from '../S0-S8/S7Routes.jsx'
import NeedFarm from './NeedFarm.jsx'
import { Button, Card, Disclaimer } from './parts.jsx'

// S18 Share preview (MUST): the plan card as a picture, shared to WhatsApp via the phone share sheet,
// with a link fallback. Route: /share/:id (id = plan id from S7/S8).

// Draw the card to a PNG with plain canvas (no extra library, stays light).
function drawCard({ plan, place, lang, kind, reason, note }) {
  const w = 720
  const h = 520
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  g.fillStyle = '#1b4332'
  g.fillRect(0, 0, w, h)
  g.fillStyle = '#fff'
  g.beginPath()
  g.roundRect(24, 120, w - 48, h - 150, 32)
  g.fill()
  g.fillStyle = '#fff'
  g.font = '600 26px system-ui, sans-serif'
  g.fillText(`Field Navigator · ${place}`, 32, 56)
  g.font = '700 38px system-ui, sans-serif'
  g.fillText(kind, 32, 100)
  g.fillStyle = '#1f2a24'
  g.textAlign = 'center'
  plan.sequence.forEach((s, i) => {
    const x = 24 + ((w - 48) / plan.sequence.length) * (i + 0.5)
    g.font = '80px serif'
    g.fillText(CROPS[s.crop].emoji, x, 250)
    g.font = '600 24px system-ui, sans-serif'
    g.fillText(CROPS[s.crop][lang], x, 296)
  })
  g.textAlign = 'left'
  const stars = Math.max(1, Math.min(5, Math.round(plan.score * 5)))
  g.fillStyle = '#e9a23b'
  g.font = '40px system-ui, sans-serif'
  g.fillText('★'.repeat(stars) + '☆'.repeat(5 - stars), 48, 370)
  g.fillStyle = '#4b5a52'
  g.font = '22px system-ui, sans-serif'
  g.fillText(reason.slice(0, 52), 48, 420)
  g.fillText(note, 48, 470)
  return new Promise((res) => c.toBlob(res, 'image/png'))
}

export default function S18Share() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { farm } = useFarm()
  const { plans, loading } = useRankedPlans()
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!farm) return <NeedFarm title={t('s18.title')} />
  if (loading) return <Screen title={t('s18.title')}><p className="py-16 text-center text-lg">⏳</p></Screen>
  const plan = plans.find((p) => p.id === id) || plans[0]
  if (!plan) return <Navigate to="/routes" replace />

  const place = farm.name || t('s18.myFarm')
  const kind = t(`s7.${plan.kind}`)
  const reason = plan.reason[lang]
  const url = window.location.href
  const text = t('s18.text', { place, plan: kind, reason })
  const waLink = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`

  const share = async () => {
    setBusy(true)
    try {
      const blob = await drawCard({ plan, place, lang, kind, reason, note: t('s18.imageNote') })
      const file = new File([blob], 'field-navigator-plan.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text, url })
      else if (navigator.share) await navigator.share({ text, url })
      else window.open(waLink, '_blank', 'noopener')
    } catch {
      /* the user closed the share sheet */
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt(t('s18.copyManual'), url)
    }
  }

  return (
    <Screen title={t('s18.title')} speak={t('s18.speak')}>
      <div className="space-y-4">
        {/* The card people will receive */}
        <div className="overflow-hidden rounded-3xl bg-brand-900 text-white shadow-lg">
          <div className="px-5 pb-4 pt-5">
            <p className="text-sm opacity-80">Field Navigator · {place}</p>
            <h2 className="text-2xl font-semibold">{kind}</h2>
          </div>
          <div className="mx-3 mb-3 space-y-4 rounded-2xl bg-white p-4 text-ink">
            <ol className="flex items-start justify-around gap-1">
              {plan.sequence.map((s, i) => (
                <li key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
                  <span className="text-xs text-ink-soft">{t('s7.season', { n: i + 1 })}</span>
                  <span className="text-5xl" aria-hidden>{CROPS[s.crop].emoji}</span>
                  <span className="text-sm font-medium">{CROPS[s.crop][lang]}</span>
                  <StatusMark status={plan.statuses[i]} size={22} label={t(`s7.legend.${plan.statuses[i]}`)} />
                </li>
              ))}
            </ol>
            <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-3">
              <Stars value={plan.score} />
              <p className="text-right text-sm text-ink-soft">{reason}</p>
            </div>
          </div>
        </div>

        <Button icon={Share2} onClick={share} disabled={busy}>{t('s18.share')}</Button>
        <Button variant="soft" icon={MessageCircle} onClick={() => window.open(waLink, '_blank', 'noopener')}>
          {t('s18.whatsapp')}
        </Button>
        <Button variant="outline" icon={copied ? Check : LinkIcon} onClick={copy} aria-live="polite">
          {copied ? t('s18.copied') : t('s18.copy')}
        </Button>

        <Card className="text-sm text-ink-soft">{t('s18.privacy')}</Card>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </Screen>
  )
}
