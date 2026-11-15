import { useCallback, useEffect, useRef } from 'react'
import { useFarm } from '../state/FarmContext.jsx'
import { speakText } from './voiceEngine.js'

export { VOICES, speakText, setActiveVoice } from './voiceEngine.js'

export function useSpeak(text, { auto = false } = {}) {
  const { lang, muted } = useFarm()
  const said = useRef(false)
  const speak = useCallback(() => speakText(text, lang || 'en'), [text, lang])
  useEffect(() => {
    if (auto && !muted && text && !said.current) {
      said.current = true
      speak()
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [auto, muted, text, speak])
  return speak
}
