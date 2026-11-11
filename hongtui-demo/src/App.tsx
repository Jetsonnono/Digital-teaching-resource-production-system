import { useCallback, useEffect, useRef, useState } from 'react'
import { ChromaSlider } from './ChromaSlider'
import { HongTuiScene, type HitZone } from './HongTuiScene'
import {
  SNAP,
  nextState,
  stateFromT,
  stateLabel,
  type StateId,
} from './chroma'

const ZONE_HINT: Record<Exclude<HitZone, null>, string> = {
  head: '触首 · 对光一凛',
  scales: '触鳞 · 窑变涟漪',
  eaves: '触檐 · 塔身轻颤',
}

export default function App() {
  const [t, setT] = useState(0.5)
  const [displayT, setDisplayT] = useState(0.5)
  const [locked, setLocked] = useState<StateId>('hongxing')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [flare, setFlare] = useState(0)
  const [pulse, setPulse] = useState<{ zone: HitZone; until: number }>({
    zone: null,
    until: 0,
  })
  const [hint, setHint] = useState('拖色谱换骨 · 点触头/鳞/檐 · 长按蓄窑焰')
  const [charging, setCharging] = useState(false)

  const displayRef = useRef(displayT)
  const targetRef = useRef(t)
  const chargeRef = useRef(false)
  const rafRef = useRef(0)

  displayRef.current = displayT
  targetRef.current = t

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Smooth morph toward target t + flare charge decay/rise
  useEffect(() => {
    let alive = true
    const tick = () => {
      if (!alive) return
      const cur = displayRef.current
      const tgt = targetRef.current
      const next = cur + (tgt - cur) * (reducedMotion ? 1 : 0.12)
      if (Math.abs(next - cur) > 0.0004) {
        setDisplayT(next)
      } else if (cur !== tgt) {
        setDisplayT(tgt)
      }

      setFlare((f) => {
        if (chargeRef.current) return Math.min(1, f + 0.018)
        return Math.max(0, f - 0.03)
      })

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [reducedMotion])

  const onRelease = useCallback((value: number) => {
    const id = stateFromT(value)
    setLocked(id)
    setT(SNAP[id])
    setHint(`锁态 · ${stateLabel(id)}`)
  }, [])

  const cycleState = useCallback(() => {
    const n = nextState(locked)
    setLocked(n)
    setT(SNAP[n])
    setHint(`一键换骨 · ${stateLabel(n)}`)
  }, [locked])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 2 - 1
      const y = ((e.clientY - r.top) / r.height) * 2 - 1
      setParallax({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      })
    },
    [],
  )

  const onZoneClick = useCallback((zone: Exclude<HitZone, null>) => {
    setPulse({ zone, until: performance.now() + 520 })
    setHint(ZONE_HINT[zone])
  }, [])

  return (
    <div
      className="scene"
      translate="no"
      onPointerMove={onPointerMove}
      onPointerLeave={() => setParallax({ x: 0, y: 0 })}
    >
      <div className="scene__atmosphere" aria-hidden="true" />
      <div className="scene__rays" aria-hidden="true" />
      <div className="scene__mist" aria-hidden="true" />
      <div className="scene__ground" aria-hidden="true" />
      <div className="scene__vignette" aria-hidden="true" />

      <header className="hero">
        <h1 className="hero__brand">虹蜕</h1>
        <p className="hero__line">飞虹塔琉璃换骨 · 色谱即兽皮</p>
      </header>

      <main className="stage">
        <HongTuiScene
          t={displayT}
          reducedMotion={reducedMotion}
          parallax={parallax}
          flare={flare}
          pulse={pulse}
          onZoneClick={onZoneClick}
          onHoldStart={() => {
            chargeRef.current = true
            setCharging(true)
            setHint('蓄窑焰中 · 松手散焰')
          }}
          onHoldEnd={() => {
            chargeRef.current = false
            setCharging(false)
          }}
        />
      </main>

      <footer className="dock">
        <div className="dock__actions">
          <button type="button" className="dock__cycle" onClick={cycleState}>
            换骨 · {stateLabel(locked)}
            <span aria-hidden="true"> →</span>
          </button>
          <span className={`dock__flare ${charging || flare > 0.05 ? 'is-on' : ''}`}>
            {charging ? '窑焰蓄力' : flare > 0.05 ? '窑焰' : '长按蓄焰'}
          </span>
        </div>

        <ChromaSlider value={t} onChange={setT} onRelease={onRelease} />

        <p className="dock__hint" aria-live="polite">
          {hint}
        </p>
      </footer>
    </div>
  )
}
