import { useCallback, useEffect, useState } from 'react'
import { ChromaSlider } from './ChromaSlider'
import { HongTuiMorph } from './HongTuiMorph'
import { stateFromT, type StateId } from './chroma'

const SNAP: Record<StateId, number> = {
  yumian: 0.12,
  hongxing: 0.5,
  yaoxing: 0.88,
}

export default function App() {
  const [t, setT] = useState(0.12)
  const [locked, setLocked] = useState<StateId>('yumian')
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const onRelease = useCallback((value: number) => {
    const id = stateFromT(value)
    setLocked(id)
    setT(SNAP[id])
  }, [])

  return (
    <div className="scene" translate="no">
      <div className="scene__atmosphere" aria-hidden="true" />
      <div className="scene__mist" aria-hidden="true" />
      <div className="scene__ground" aria-hidden="true" />

      <header className="hero">
        <h1 className="hero__brand">虹蜕</h1>
        <p className="hero__line">飞虹塔琉璃换骨 · 色谱即兽皮</p>
      </header>

      <main className="stage">
        <HongTuiMorph t={t} reducedMotion={reducedMotion} />
      </main>

      <footer className="dock">
        <ChromaSlider value={t} onChange={setT} onRelease={onRelease} />
        <p className="dock__lock">
          当前锁态 · <strong>{locked === 'yumian' ? '釉眠' : locked === 'hongxing' ? '虹行' : '窑醒'}</strong>
        </p>
      </footer>
    </div>
  )
}
