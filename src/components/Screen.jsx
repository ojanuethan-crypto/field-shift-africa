import { Volume2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFarm } from '../state/FarmContext.jsx'
import TopBar from './TopBar.jsx'
import { speakText } from './speech.js'

// Shared mobile shell: TopBar (Back, Home, language switch only), then a green title card with the
// speaker button, content, footer.
// Props: title, subtitle, speak (text read aloud by the speaker button), bare (no TopBar, e.g. first
//        screen), footer, flush (full-bleed content such as maps; no title card, floating speaker).
export default function Screen({ title, subtitle, speak, bare, footer, children, flush }) {
  const { t } = useTranslation()
  const { lang } = useFarm()
  const showCard = !!title && !flush
  const say = () => speakText(speak, lang || 'en')

  const speaker = (cls) => (
    <button
      type="button"
      aria-label={t('common.listen')}
      onClick={say}
      className={`tap grid shrink-0 place-items-center rounded-full bg-brand-600 text-white ${cls}`}
    >
      <Volume2 size={24} />
    </button>
  )

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden bg-surface shadow-xl">
      {!bare && <TopBar />}

      <div className="relative min-h-0 flex-1">
        <main className={`h-full overflow-y-auto ${flush ? '' : 'px-4 pb-8 pt-4'}`}>
          {showCard && (
            <section className="mb-4 flex items-center gap-3 rounded-[28px] bg-brand-900 px-5 py-5 text-white">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
                {subtitle && <p className="mt-1 text-base opacity-90">{subtitle}</p>}
              </div>
              {speak && speaker('h-14 w-14')}
            </section>
          )}
          {children}
        </main>
        {speak && !showCard && speaker(`absolute right-4 z-[600] h-14 w-14 shadow-lg ring-4 ring-white/70 ${flush ? 'top-3' : 'bottom-4'}`)}
      </div>

      {footer && (
        <footer className="shrink-0 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          {footer}
        </footer>
      )}
    </div>
  )
}
