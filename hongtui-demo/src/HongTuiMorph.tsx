import { useEffect, useId, useRef, type CSSProperties } from 'react'
import { morphFactors, sampleChroma, lerp } from './chroma'

type Props = {
  t: number
  reducedMotion?: boolean
}

/**
 * Procedural SVG morph: 釉眠 (closed pagoda) → 虹行 (half-beast) → 窑醒 (beast + crown).
 * Idle breathe + glaze shimmer via CSS/SVG animate driven by a light rAF pulse.
 */
export function HongTuiMorph({ t, reducedMotion = false }: Props) {
  const uid = useId().replace(/:/g, '')
  const rootRef = useRef<SVGSVGElement>(null)
  const m = morphFactors(t)

  const c0 = sampleChroma(Math.max(0, t - 0.28))
  const c1 = sampleChroma(t)
  const c2 = sampleChroma(Math.min(1, t + 0.22))
  const c3 = sampleChroma(Math.min(1, t + 0.42))
  const highlight = sampleChroma(Math.min(1, t + 0.55))

  // Soft kiln atmosphere tint from current chroma
  const haze = sampleChroma(lerp(0.1, 0.85, t))

  useEffect(() => {
    if (reducedMotion || !rootRef.current) return
    const el = rootRef.current
    let raf = 0
    const tick = (now: number) => {
      // Idle breathe: subtle vertical scale on the whole form
      const breathe = 1 + Math.sin(now / 2200) * 0.012
      // Glaze shimmer: sliding highlight offset
      const shimmer = (Math.sin(now / 1400) + 1) * 0.5
      el.style.setProperty('--breathe', String(breathe))
      el.style.setProperty('--shimmer', String(shimmer))
      el.style.setProperty('--pulse', String(0.55 + Math.sin(now / 900) * 0.2))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion])

  // Geometry blends (viewBox 0 0 400 520, form centered ~200)
  const bodyWiden = lerp(0, 28, m.beast)
  const headLift = lerp(0, -36, m.beast + m.ridge * 0.35)
  const earSpan = lerp(0, 42, m.beast)
  const snout = lerp(0, 22, m.beast)
  const crownOpen = lerp(0, 1, m.awake)
  const tierSpread = lerp(1, 1.08, m.hybrid * 0.5 + m.beast * 0.3)
  const scaleOut = lerp(0.4, 1, m.scales)

  // Pagoda tier Y positions (bottom → top), compressing as beast rises
  const tierYs = [420, 360, 300, 245, 195].map((y, i) =>
    y + headLift * (0.15 + i * 0.18),
  )
  const tierWs = [150, 128, 108, 88, 68].map(
    (w) => (w + bodyWiden * (1 - w / 160)) * tierSpread,
  )

  // Beast head silhouette points (morph from tapered finial)
  const headCy = 150 + headLift
  const jawY = headCy + 48 - snout * 0.3
  const eyeOpen = m.awake

  return (
    <svg
      ref={rootRef}
      className="hongtui-svg"
      viewBox="0 0 400 520"
      role="img"
      aria-label="虹蜕色谱兽形态"
      style={
        {
          ['--breathe' as string]: 1,
          ['--shimmer' as string]: 0.5,
          ['--pulse' as string]: 0.7,
          ['--haze' as string]: haze,
        } as CSSProperties
      }
    >
      <defs>
        <linearGradient id={`${uid}-glaze`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c0} />
          <stop offset="35%" stopColor={c1} />
          <stop offset="65%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>

        <linearGradient id={`${uid}-wet`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={highlight} stopOpacity="0.85" />
          <stop offset="40%" stopColor={c2} stopOpacity="0.35" />
          <stop offset="100%" stopColor={c0} stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id={`${uid}-reflect`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4f7f2" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#f4f7f2" stopOpacity="0.08" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </linearGradient>

        <radialGradient id={`${uid}-glow`} cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor={c2} stopOpacity={0.35 + m.awake * 0.35} />
          <stop offset="55%" stopColor={c0} stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0a1210" stopOpacity="0" />
        </radialGradient>

        <filter id={`${uid}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>

        <filter id={`${uid}-bloom`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Sliding wet-glaze highlight mask driven by --shimmer */}
        <linearGradient id={`${uid}-shine`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="45%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.55" />
          <stop offset="55%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Atmospheric bloom behind form */}
      <ellipse
        className="hongtui-bloom"
        cx="200"
        cy="280"
        rx="150"
        ry="200"
        fill={`url(#${uid}-glow)`}
      />

      <g className="hongtui-form">
        {/* Ground reflection / wet glaze pool */}
        <ellipse
          cx="200"
          cy="468"
          rx={90 + bodyWiden * 0.6}
          ry="14"
          fill={c1}
          opacity={0.18 + m.scales * 0.12}
          filter={`url(#${uid}-soft)`}
        />

        {/* —— Pagoda / body tiers (kiln-change bands) —— */}
        {tierYs.map((y, i) => {
          const w = tierWs[i]
          const h = 48 - i * 3
          const roofH = 18 + i * 1.5
          const bandT = (i / (tierYs.length - 1)) * 0.7 + t * 0.3
          const bandColor = sampleChroma(bandT)
          const beastBulge = m.beast * (8 + i * 3) * (i < 3 ? 1 : 0.4)
          const left = 200 - w / 2 - beastBulge * 0.3
          const right = 200 + w / 2 + beastBulge * 0.3

          // As beast awakens, lower tiers lean into haunches; upper into chest
          const skew = (i - 2) * m.ridge * 4

          return (
            <g key={i} opacity={0.75 + m.tower * 0.25}>
              {/* Eave / roof plate */}
              <path
                d={`M ${left - 10 + skew} ${y - h * 0.15}
                    L ${right + 10 + skew} ${y - h * 0.15}
                    L ${right - 6 + skew} ${y - h * 0.15 - roofH}
                    L ${left + 6 + skew} ${y - h * 0.15 - roofH} Z`}
                fill={bandColor}
                opacity={0.92}
              />
              {/* Body band with wet glaze */}
              <path
                d={`M ${left + skew} ${y - h * 0.15}
                    Q ${200 + skew * 0.2} ${y + h * 0.15 + beastBulge * 0.2} ${right + skew} ${y - h * 0.15}
                    L ${right - 4 + skew} ${y + h * 0.55}
                    Q ${200 + skew * 0.2} ${y + h * 0.75} ${left + 4 + skew} ${y + h * 0.55} Z`}
                fill={`url(#${uid}-glaze)`}
                opacity={0.88}
              />
              {/* Kiln-change stripe */}
              <path
                d={`M ${left + 8 + skew} ${y + h * 0.12}
                    Q ${200} ${y + h * 0.22} ${right - 8 + skew} ${y + h * 0.12}`}
                fill="none"
                stroke={highlight}
                strokeWidth={1.4 * scaleOut}
                opacity={0.35 + m.scales * 0.35}
              />
              {/* Wet highlight edge */}
              <path
                d={`M ${left + 14 + skew} ${y - h * 0.05}
                    Q ${left + w * 0.25} ${y + h * 0.1} ${left + w * 0.35 + skew} ${y + h * 0.35}`}
                fill="none"
                stroke={`url(#${uid}-reflect)`}
                strokeWidth="3"
                opacity={0.5}
              />
            </g>
          )
        })}

        {/* —— Glaze scales (grow with chroma) —— */}
        <g opacity={0.25 + m.scales * 0.65} className="hongtui-scales">
          {Array.from({ length: 14 }).map((_, i) => {
            const col = i % 7
            const row = Math.floor(i / 7)
            const x = 128 + col * 24 + (row % 2) * 12 + bodyWiden * 0.15
            const y = 250 + row * 38 + headLift * 0.25
            const r = (7 + (i % 3)) * scaleOut
            const sc = sampleChroma((col / 6) * 0.5 + t * 0.5)
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx={r}
                ry={r * 0.72}
                fill={sc}
                stroke={highlight}
                strokeWidth="0.6"
                opacity={0.55 + (i % 3) * 0.1}
              />
            )
          })}
        </g>

        {/* —— Spine ridge (虹行 → 窑醒) —— */}
        <path
          d={`M 200 ${tierYs[4] - 30}
              C ${210 + earSpan * 0.2} ${tierYs[3] - 10},
                ${218 + earSpan * 0.15} ${tierYs[1]},
                ${208 + bodyWiden * 0.1} ${tierYs[0] - 20}`}
          fill="none"
          stroke={c2}
          strokeWidth={2 + m.ridge * 4}
          strokeLinecap="round"
          opacity={0.15 + m.ridge * 0.7}
          filter={`url(#${uid}-bloom)`}
        />

        {/* —— Beast head / finial morph —— */}
        <g transform={`translate(0, ${headLift})`}>
          {/* Closed finial (釉眠) */}
          <g opacity={Math.max(0, 1 - m.beast * 1.4)}>
            <path
              d={`M 188 118 L 200 72 L 212 118
                  L 206 128 L 194 128 Z`}
              fill={`url(#${uid}-wet)`}
            />
            <path
              d="M 192 118 L 200 88 L 208 118"
              fill="none"
              stroke={highlight}
              strokeWidth="1.2"
              opacity="0.6"
            />
          </g>

          {/* Emerging head (虹行 / 窑醒) */}
          <g opacity={Math.min(1, m.beast * 1.35 + m.hybrid * 0.35)}>
            {/* Ears / horn-eaves */}
            <path
              d={`M ${200 - 18} ${headCy - 10}
                  Q ${200 - 28 - earSpan * 0.4} ${headCy - 48}
                    ${200 - 8 - earSpan * 0.15} ${headCy - 22}
                  Q ${200 - 14} ${headCy - 8} ${200 - 18} ${headCy - 10} Z`}
              fill={c1}
              opacity={0.95}
            />
            <path
              d={`M ${200 + 18} ${headCy - 10}
                  Q ${200 + 28 + earSpan * 0.4} ${headCy - 48}
                    ${200 + 8 + earSpan * 0.15} ${headCy - 22}
                  Q ${200 + 14} ${headCy - 8} ${200 + 18} ${headCy - 10} Z`}
              fill={c2}
              opacity={0.95}
            />

            {/* Skull / muzzle */}
            <path
              d={`M ${200 - 34 - snout * 0.2} ${headCy + 8}
                  Q ${200 - 40} ${headCy - 28} ${200} ${headCy - 36}
                  Q ${200 + 40} ${headCy - 28} ${200 + 34 + snout * 0.2} ${headCy + 8}
                  Q ${200 + 20 + snout} ${jawY} ${200} ${jawY + 10 + snout * 0.25}
                  Q ${200 - 20 - snout} ${jawY} ${200 - 34 - snout * 0.2} ${headCy + 8} Z`}
              fill={`url(#${uid}-glaze)`}
            />

            {/* Wet glaze highlight on brow */}
            <path
              d={`M ${200 - 22} ${headCy - 18}
                  Q ${200} ${headCy - 28} ${200 + 18} ${headCy - 14}`}
              fill="none"
              stroke={`url(#${uid}-reflect)`}
              strokeWidth="4"
              opacity={0.55 + m.awake * 0.25}
            />

            {/* Eyes — light-sensitive */}
            <ellipse
              cx={200 - 14}
              cy={headCy - 2}
              rx={4 + eyeOpen * 3}
              ry={3 + eyeOpen * 2}
              fill="#0c1814"
              opacity={0.3 + eyeOpen * 0.7}
            />
            <ellipse
              cx={200 + 14}
              cy={headCy - 2}
              rx={4 + eyeOpen * 3}
              ry={3 + eyeOpen * 2}
              fill="#0c1814"
              opacity={0.3 + eyeOpen * 0.7}
            />
            <ellipse
              cx={200 - 14}
              cy={headCy - 2}
              rx={1.6 + eyeOpen}
              ry={1.6 + eyeOpen}
              fill={highlight}
              opacity={eyeOpen}
              filter={`url(#${uid}-bloom)`}
              className="hongtui-eye"
            />
            <ellipse
              cx={200 + 14}
              cy={headCy - 2}
              rx={1.6 + eyeOpen}
              ry={1.6 + eyeOpen}
              fill={highlight}
              opacity={eyeOpen}
              filter={`url(#${uid}-bloom)`}
              className="hongtui-eye"
            />

            {/* Crown from pagoda finial (窑醒) */}
            <g opacity={crownOpen} filter={`url(#${uid}-bloom)`}>
              {[ -1, 0, 1 ].map((k) => (
                <path
                  key={k}
                  d={`M ${200 + k * 16} ${headCy - 34}
                      L ${200 + k * 22} ${headCy - 68 - Math.abs(k) * 6}
                      L ${200 + k * 10} ${headCy - 40} Z`}
                  fill={sampleChroma(0.55 + k * 0.12 + t * 0.2)}
                  opacity={0.85}
                />
              ))}
            </g>
          </g>
        </g>

        {/* Sliding wet-glaze shimmer overlay */}
        <rect
          className="hongtui-shimmer"
          x="80"
          y="80"
          width="240"
          height="380"
          fill={`url(#${uid}-shine)`}
          opacity="0.35"
          style={{ mixBlendMode: 'screen' }}
          pointerEvents="none"
        />
      </g>
    </svg>
  )
}
