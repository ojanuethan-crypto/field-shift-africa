import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Share2, Link as LinkIcon, MessageCircle, Check } from 'lucide-react'
import ScreenHeader from '../../components/ScreenHeader'
import { Card, Button, Stars, Disclaimer } from '../../components/ui'
import CropRow from './CropRow'
import { getPlan } from '../../mock/plans'

/* S18 Share preview (MUST). Plan card -> picture -> phone share sheet (WhatsApp first), link fallback.
   Reads ?plan=<id>&place=<name> so a shared link reopens the same plan (Frontend Guide 7.2). */

// Draw the plan card to a PNG with plain canvas (no extra library, stays light).
async function drawCard({ plan, place, t }) {
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
  g.fillText(t(`plans.${plan.id}.name`), 32, 100)
  g.fillStyle = '#14261c'
  g.textAlign = 'center'
  plan.sequence.forEach((s, i) => {
    const x = 24 + ((w - 48) / plan.sequence.length) * (i + 0.5)
    g.font = '80px serif'
    g.fillText(s.emoji, x, 250)
    g.font = '600 24px system-ui, sans-serif'
    g.fillText(t(`crops.${s.crop}`), x, 296)
  })
  g.textAlign = 'left'
  g.fillStyle = '#e9a23b'
  g.font = '40px system-ui, sans-serif'
  g.fillText('★'.repeat(plan.stars) + '☆'.repeat(5 - plan.stars), 48, 370)
  g.fillStyle = '#4b5f54'
  g.font = '22px system-ui, sans-serif'
  g.fillText(t(`plans.${plan.id}.why`).slice(0, 52), 48, 420)
  g.fillText(t('share.imageNote'), 48, 470)
  return new Promise((res) => c.toBlob(res, 'image/png'))
}

export default function Share() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const plan = getPlan(params.get('plan'))
  const place = params.get('place') || 'Douala'
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const url = window.location.href
  const text = t('share.text', { place, plan: t(`plans.${plan.id}.name`), reason: t(`plans.${plan.id}.why`) })

  const share = async () => {
    setBusy(true)
    try {
      const blob = await drawCard({ plan, place, t })
      const file = new File([blob], 'field-navigator-plan.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url })
      } else if (navigator.share) {
        await navigator.share({ text, url })
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank')
      }
    } catch {
      /* user closed the share sheet: nothing to do */
    } finally {
      setBusy(false)
    }
  }

  const whatsapp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt(t('share.copyManual'), url)
    }
  }

  return (
    <main>
      <ScreenHeader title={t('share.title')} speak={t('share.speak')} />
      <div className="space-y-4 px-4">
        {/* The card people will actually receive */}
        <div className="overflow-hidden rounded-3xl bg-primary text-white shadow-[0_8px_24px_rgba(27,67,50,0.25)]">
          <div className="px-5 pt-5 pb-4">
            <p className="text-sm text-white/80">Field Navigator · {place}</p>
            <h2 className="text-2xl font-bold">{t(`plans.${plan.id}.name`)}</h2>
          </div>
          <div className="mx-3 mb-3 space-y-4 rounded-2xl bg-white p-4 text-ink">
            <CropRow plan={plan} />
            <div className="flex items-center justify-between border-t border-line pt-3">
              <Stars value={plan.stars} />
              <p className="text-right text-sm text-muted">{t(`plans.${plan.id}.why`)}</p>
            </div>
          </div>
        </div>

        <Button icon={Share2} onClick={share} disabled={busy}>{t('share.share')}</Button>
        <Button variant="soft" icon={MessageCircle} onClick={whatsapp}>{t('share.whatsapp')}</Button>
        <Button variant="outline" icon={copied ? Check : LinkIcon} onClick={copy} aria-live="polite">
          {copied ? t('share.copied') : t('share.copy')}
        </Button>

        <Card className="text-sm text-muted">{t('share.privacy')}</Card>
        <Disclaimer>{t('common.disclaimer')}</Disclaimer>
      </div>
    </main>
  )
}
