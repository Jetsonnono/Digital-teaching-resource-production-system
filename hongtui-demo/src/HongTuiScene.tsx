import { useEffect, useRef } from 'react'
import {
  lerp,
  morphFactors,
  sampleChroma,
  shade,
  smoothstep,
  withAlpha,
} from './chroma'

export type HitZone = 'head' | 'scales' | 'eaves' | null

type Props = {
  t: number
  reducedMotion?: boolean
  parallax: { x: number; y: number }
  flare: number
  pulse: { zone: HitZone; until: number }
  onZoneClick?: (zone: Exclude<HitZone, null>) => void
  onHoldStart?: () => void
  onHoldEnd?: () => void
}

type Tier = { y: number; w: number; h: number; roof: number }

const VW = 440
const VH = 580

function drawGlazeBody(
  ctx: CanvasRenderingContext2D,
  build: () => void,
  cDeep: string,
  cMid: string,
  cHi: string,
  lightX: number,
  lightY: number,
) {
  build()
  const g = ctx.createLinearGradient(lightX - 80, lightY - 120, lightX + 60, lightY + 160)
  g.addColorStop(0, cHi)
  g.addColorStop(0.35, cMid)
  g.addColorStop(0.72, cDeep)
  g.addColorStop(1, shade(cDeep, -0.18))
  ctx.fillStyle = g
  ctx.fill()

  ctx.save()
  build()
  ctx.clip()
  const spec = ctx.createLinearGradient(lightX - 40, lightY - 90, lightX + 10, lightY + 40)
  spec.addColorStop(0, 'rgba(255,255,250,0.55)')
  spec.addColorStop(0.18, 'rgba(255,255,250,0.18)')
  spec.addColorStop(0.4, 'rgba(255,255,250,0)')
  ctx.fillStyle = spec
  ctx.fillRect(lightX - 120, lightY - 140, 200, 280)

  const band = ctx.createLinearGradient(lightX - 90, lightY, lightX + 90, lightY + 30)
  band.addColorStop(0, withAlpha(cHi, 0))
  band.addColorStop(0.45, withAlpha(cHi, 0.28))
  band.addColorStop(1, withAlpha(cHi, 0))
  ctx.fillStyle = band
  ctx.fillRect(lightX - 100, lightY - 10, 200, 28)
  ctx.restore()
}

function strokeEave(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  roof: number,
  tip: number,
) {
  const left = cx - w / 2
  const right = cx + w / 2
  ctx.beginPath()
  ctx.moveTo(left + 10, y)
  ctx.lineTo(right - 10, y)
  ctx.quadraticCurveTo(right + tip * 0.2, y - roof * 0.15, right + tip, y - roof * 0.55)
  ctx.quadraticCurveTo(right - 4, y - roof * 0.85, cx + w * 0.18, y - roof)
  ctx.lineTo(cx - w * 0.18, y - roof)
  ctx.quadraticCurveTo(left + 4, y - roof * 0.85, left - tip, y - roof * 0.55)
  ctx.quadraticCurveTo(left - tip * 0.2, y - roof * 0.15, left + 10, y)
  ctx.closePath()
}

function strokeBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  h: number,
  belly: number,
) {
  const left = cx - w / 2 + 8
  const right = cx + w / 2 - 8
  ctx.beginPath()
  ctx.moveTo(left, y)
  ctx.lineTo(right, y)
  ctx.quadraticCurveTo(right + belly, y + h * 0.45, right - 4, y + h)
  ctx.quadraticCurveTo(cx, y + h + 6, left + 4, y + h)
  ctx.quadraticCurveTo(left - belly, y + h * 0.45, left, y)
  ctx.closePath()
}

/**
 * Procedural half-pagoda / half-beast with wet kiln glaze.
 */
export function HongTuiScene({
  t,
  reducedMotion = false,
  parallax,
  flare,
  pulse,
  onZoneClick,
  onHoldStart,
  onHoldEnd,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const tRef = useRef(t)
  const parRef = useRef(parallax)
  const flareRef = useRef(flare)
  const pulseRef = useRef(pulse)
  const zonesRef = useRef({ head: { y0: 80, y1: 220 }, scales: { y0: 220, y1: 340 }, eaves: { y0: 340, y1: 490 }, cx: 210 })

  tRef.current = t
  parRef.current = parallax
  flareRef.current = flare
  pulseRef.current = pulse

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = true
    const dpr = Math.min(2, window.devicePixelRatio || 1)

    const resize = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const draw = (now: number) => {
      if (!running) return
      const W = canvas.width
      const H = canvas.height
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const scale = Math.min(W / VW, H / VH) * 1.05
      const ox = (W - VW * scale) / 2
      const oy = (H - VH * scale) / 2 + 8
      ctx.setTransform(scale, 0, 0, scale, ox, oy)

      const tt = tRef.current
      const m = morphFactors(tt)
      const px = parRef.current.x
      const py = parRef.current.y
      const fl = flareRef.current
      const pul = pulseRef.current

      const breathe = reducedMotion ? 0 : Math.sin(now / 2100) * 3.4
      const shimmer = reducedMotion ? 0.5 : (Math.sin(now / 1300) + 1) * 0.5
      const flicker = reducedMotion ? 0 : Math.sin(now / 420) * 0.04

      const cx = 210 + px * 16
      const baseY = 470 + breathe + py * 8
      const lightX = cx - 40 + px * 32
      const lightY = 200 + py * 22

      zonesRef.current.cx = cx
      zonesRef.current.head = { y0: baseY - 340, y1: baseY - 240 }
      zonesRef.current.scales = { y0: baseY - 240, y1: baseY - 140 }
      zonesRef.current.eaves = { y0: baseY - 140, y1: baseY + 20 }

      // Atmosphere bloom (keyed to light)
      const bloomC = sampleChroma(lerp(0.12, 0.88, tt))
      const bloom = ctx.createRadialGradient(lightX + 40, lightY + 70, 16, cx, 300, 230)
      bloom.addColorStop(0, withAlpha(bloomC, 0.32 + m.awake * 0.22 + fl * 0.4))
      bloom.addColorStop(0.5, withAlpha(bloomC, 0.1))
      bloom.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = bloom
      ctx.beginPath()
      ctx.ellipse(cx, 300, 175, 215, 0, 0, Math.PI * 2)
      ctx.fill()

      // Ground glaze pool
      const poolC = sampleChroma(tt)
      const pool = ctx.createRadialGradient(cx, 508, 4, cx, 508, 115)
      pool.addColorStop(0, withAlpha(poolC, 0.38 + fl * 0.28))
      pool.addColorStop(0.55, withAlpha(poolC, 0.1))
      pool.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = pool
      ctx.beginPath()
      ctx.ellipse(cx, 508, 105 + m.beast * 22, 17, 0, 0, Math.PI * 2)
      ctx.fill()

      // Mirrored reflection (soft)
      ctx.save()
      ctx.translate(0, 1016)
      ctx.scale(1, -0.18)
      ctx.globalAlpha = 0.18 + m.scales * 0.1
      ctx.filter = 'blur(2px)'
      // cheap reflection: vertical smear of bloom color
      const rg = ctx.createLinearGradient(cx, baseY - 280, cx, baseY)
      rg.addColorStop(0, withAlpha(poolC, 0))
      rg.addColorStop(1, withAlpha(poolC, 0.5))
      ctx.fillStyle = rg
      ctx.fillRect(cx - 70, baseY - 280, 140, 280)
      ctx.restore()
      ctx.filter = 'none'
      ctx.globalAlpha = 1

      const headPulse =
        pul.zone === 'head' && pul.until > now ? (pul.until - now) / 480 : 0
      const scalePulse =
        pul.zone === 'scales' && pul.until > now ? (pul.until - now) / 520 : 0
      const eavePulse =
        pul.zone === 'eaves' && pul.until > now ? (pul.until - now) / 500 : 0

      const tiers: Tier[] = [
        { y: baseY - 8, w: 172 * m.eaveSpread, h: 54, roof: 28 },
        { y: baseY - 74, w: 152 * m.eaveSpread, h: 50, roof: 26 },
        { y: baseY - 136, w: 132 * m.eaveSpread, h: 46, roof: 24 },
        { y: baseY - 192, w: 112 * lerp(1, 1.08, m.beast), h: 42, roof: 22 },
        { y: baseY - 242, w: 90 * lerp(1, 1.12, m.beast), h: 38, roof: 20 },
      ]

      ctx.save()
      ctx.translate(px * 7, py * 5)

      // Pagoda tiers
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i]
        const bandT = lerp(i / (tiers.length - 1), tt, 0.55)
        const cDeep = sampleChroma(Math.max(0, bandT - 0.14))
        const cMid = sampleChroma(bandT)
        const cHi = sampleChroma(Math.min(1, bandT + 0.3))
        const belly = lerp(2, 16, m.beast) * (i < 3 ? 1 : 0.5)
        const tip = 22 + m.eaveSpread * 12 + eavePulse * 14 + (4 - i) * 2
        const yJ = eavePulse * Math.sin(i * 1.7 + now / 80) * 3.5

        drawGlazeBody(
          ctx,
          () => strokeBody(ctx, cx, tier.y + yJ, tier.w * 0.86, tier.h, belly),
          cDeep,
          cMid,
          cHi,
          lightX + shimmer * 22,
          tier.y,
        )

        strokeEave(ctx, cx, tier.y + yJ, tier.w, tier.roof + 4, tip)
        const roofG = ctx.createLinearGradient(
          cx - tier.w / 2,
          tier.y - tier.roof,
          cx + tier.w / 2,
          tier.y + 8,
        )
        roofG.addColorStop(0, shade(cHi, 0.14 + flicker))
        roofG.addColorStop(0.45, cMid)
        roofG.addColorStop(1, shade(cDeep, -0.12))
        ctx.fillStyle = roofG
        ctx.fill()

        // Dark under-eave shadow for depth
        ctx.fillStyle = withAlpha('#04110e', 0.28)
        ctx.beginPath()
        ctx.moveTo(cx - tier.w * 0.38, tier.y + yJ + 1)
        ctx.quadraticCurveTo(cx, tier.y + yJ + 8, cx + tier.w * 0.38, tier.y + yJ + 1)
        ctx.lineTo(cx + tier.w * 0.34, tier.y + yJ + 10)
        ctx.quadraticCurveTo(cx, tier.y + yJ + 16, cx - tier.w * 0.34, tier.y + yJ + 10)
        ctx.closePath()
        ctx.fill()

        // Rim specular
        ctx.strokeStyle = withAlpha('#f4f7f2', 0.38 + shimmer * 0.22)
        ctx.lineWidth = 1.3
        ctx.beginPath()
        ctx.moveTo(cx - tier.w * 0.32, tier.y + yJ - tier.roof * 0.72)
        ctx.quadraticCurveTo(
          cx,
          tier.y + yJ - tier.roof * 0.98,
          cx + tier.w * 0.28,
          tier.y + yJ - tier.roof * 0.52,
        )
        ctx.stroke()

        // Kiln-change stripe
        ctx.strokeStyle = withAlpha(cHi, 0.45)
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(cx - tier.w * 0.3, tier.y + yJ + tier.h * 0.3)
        ctx.quadraticCurveTo(
          cx,
          tier.y + yJ + tier.h * 0.4,
          cx + tier.w * 0.3,
          tier.y + yJ + tier.h * 0.3,
        )
        ctx.stroke()

        // Tile notches on eave edge for architectural read
        ctx.strokeStyle = withAlpha(shade(cDeep, -0.15), 0.35)
        ctx.lineWidth = 1
        const notches = 7
        for (let n = 0; n < notches; n++) {
          const nx = cx - tier.w * 0.35 + (n / (notches - 1)) * tier.w * 0.7
          ctx.beginPath()
          ctx.moveTo(nx, tier.y + yJ - 1)
          ctx.lineTo(nx, tier.y + yJ + 5)
          ctx.stroke()
        }
      }

      // Scale plates
      const scaleRows = 5
      const scaleCols = 8
      const scaleOriginY = baseY - 220 - m.ridge * 20
      for (let r = 0; r < scaleRows; r++) {
        for (let c = 0; c < scaleCols; c++) {
          const appear = smoothstep(m.scales * 1.25 - r * 0.1 - Math.abs(c - 3.5) * 0.035)
          if (appear < 0.06) continue
          const sox = (c - 3.5) * 17 + (r % 2) * 8.5 + px * (2 + r)
          const soy = r * 20 + scalePulse * Math.sin(c + now / 90) * 5.5
          const sx = cx + sox
          const sy = scaleOriginY + soy
          const sc = sampleChroma(lerp(c / 7, tt, 0.62))
          const rw = (8.5 + (c % 3) * 0.8) * appear * (1 + scalePulse * 0.28)
          const rh = rw * 1.3

          ctx.save()
          ctx.translate(sx, sy)
          ctx.rotate(((-14 + c * 3.5 + m.beast * 10) * Math.PI) / 180)
          ctx.beginPath()
          ctx.moveTo(0, -rh)
          ctx.quadraticCurveTo(rw, -rh * 0.1, 0, rh)
          ctx.quadraticCurveTo(-rw, -rh * 0.1, 0, -rh)
          ctx.closePath()
          const sg = ctx.createLinearGradient(-rw, -rh, rw, rh)
          sg.addColorStop(0, shade(sc, 0.28))
          sg.addColorStop(0.4, sc)
          sg.addColorStop(1, shade(sc, -0.24))
          ctx.fillStyle = sg
          ctx.globalAlpha = 0.5 + appear * 0.45
          ctx.fill()
          ctx.strokeStyle = withAlpha('#f7faf6', 0.4)
          ctx.lineWidth = 0.85
          ctx.stroke()
          ctx.fillStyle = withAlpha('#ffffff', 0.38 + shimmer * 0.22)
          ctx.beginPath()
          ctx.ellipse(-rw * 0.18, -rh * 0.48, rw * 0.24, rh * 0.16, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }

      // Spine ridge
      if (m.ridge > 0.04) {
        ctx.strokeStyle = withAlpha(sampleChroma(Math.min(1, tt + 0.28)), 0.3 + m.ridge * 0.5)
        ctx.lineWidth = 2.2 + m.ridge * 3.2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(cx + 3, baseY - 258)
        ctx.bezierCurveTo(
          cx + 20 + m.beast * 12,
          baseY - 186,
          cx + 12,
          baseY - 108,
          cx + 5,
          baseY - 42,
        )
        ctx.stroke()
      }

      // Head cluster
      const headY = baseY - 278 - m.beast * 44 - m.ridge * 14 - headPulse * 10
      const headMix = Math.min(1, m.beast * 0.85 + m.hybrid * 0.45)
      const headW = lerp(24, 88, headMix)
      const headH = lerp(48, 80, headMix)
      const snout = headMix * 30
      const horn = m.awake * 42 + m.beast * 22 + m.hybrid * 8
      const eye = Math.min(1, m.awake + m.hybrid * 0.25)

      ctx.save()
      ctx.translate(px * 9, py * 6)

      // Closed finial
      const finialAlpha = Math.max(0, 1 - headMix * 1.25)
      if (finialAlpha > 0.02) {
        const fc = sampleChroma(tt)
        ctx.globalAlpha = finialAlpha
        // Stacked finial balls + needle (pagoda 刹)
        for (const [by, br] of [
          [headY + 28, 10],
          [headY + 12, 8],
          [headY - 2, 6],
        ] as const) {
          const g = ctx.createRadialGradient(cx - 2, by - 3, 1, cx, by, br)
          g.addColorStop(0, shade(fc, 0.35))
          g.addColorStop(0.6, fc)
          g.addColorStop(1, shade(fc, -0.2))
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.ellipse(cx, by, br, br * 0.78, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.beginPath()
        ctx.moveTo(cx - 4, headY - 6)
        ctx.lineTo(cx, headY - 62)
        ctx.lineTo(cx + 4, headY - 6)
        ctx.closePath()
        const fg = ctx.createLinearGradient(cx, headY - 62, cx, headY)
        fg.addColorStop(0, shade(fc, 0.4))
        fg.addColorStop(1, fc)
        ctx.fillStyle = fg
        ctx.fill()
        ctx.globalAlpha = 1
      }

      const beastAlpha = Math.min(1, m.beast * 1.35 + m.hybrid * 0.55)
      if (beastAlpha > 0.04) {
        ctx.globalAlpha = beastAlpha
        const hc = sampleChroma(Math.min(1, tt + 0.18))
        const hc2 = sampleChroma(Math.max(0, tt - 0.12))

        // Ears / cheek frills — wider silhouette read
        for (const side of [-1, 1] as const) {
          ctx.beginPath()
          ctx.moveTo(cx + side * headW * 0.28, headY - headH * 0.05)
          ctx.quadraticCurveTo(
            cx + side * (headW * 0.85 + m.beast * 18 + m.hybrid * 10),
            headY - headH * 0.5,
            cx + side * headW * 0.18,
            headY - headH * 0.62,
          )
          ctx.quadraticCurveTo(
            cx + side * headW * 0.4,
            headY - headH * 0.28,
            cx + side * headW * 0.28,
            headY - headH * 0.05,
          )
          ctx.closePath()
          ctx.fillStyle = side < 0 ? hc2 : hc
          ctx.fill()
          ctx.strokeStyle = withAlpha('#f4f7f2', 0.2)
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Crown horns (塔刹 → 冠)
        const horns = [
          { ang: -36, len: horn * 0.82, thick: 7 },
          { ang: -12, len: horn * 1.2, thick: 8.5 },
          { ang: 14, len: horn * 1.05, thick: 7.5 },
          { ang: 40, len: horn * 0.72 * m.awake, thick: 5.5 },
        ]
        for (const h of horns) {
          if (h.len < 5) continue
          const rad = (h.ang * Math.PI) / 180
          const hx = cx + Math.sin(rad) * 10
          const hy = headY - headH * 0.38
          ctx.beginPath()
          ctx.moveTo(hx - h.thick * 0.45, hy)
          ctx.quadraticCurveTo(
            hx + Math.sin(rad) * h.len * 0.55 - 5,
            hy - h.len * 0.55,
            hx + Math.sin(rad) * h.len,
            hy - h.len,
          )
          ctx.quadraticCurveTo(
            hx + Math.sin(rad) * h.len * 0.5 + 5,
            hy - h.len * 0.5,
            hx + h.thick * 0.45,
            hy,
          )
          ctx.closePath()
          const hg = ctx.createLinearGradient(hx, hy, hx, hy - h.len)
          hg.addColorStop(0, hc2)
          hg.addColorStop(0.55, hc)
          hg.addColorStop(1, shade(sampleChroma(Math.min(1, tt + 0.45)), 0.22))
          ctx.fillStyle = hg
          ctx.fill()
          ctx.strokeStyle = withAlpha('#fff', 0.25)
          ctx.lineWidth = 0.8
          ctx.stroke()
        }

        // Angular ridge-beast skull (螭吻感) — not a soft oval
        const buildHead = () => {
          ctx.beginPath()
          // left cheek / jaw hinge
          ctx.moveTo(cx - headW * 0.48, headY + headH * 0.08)
          // left brow ridge up to crown root
          ctx.lineTo(cx - headW * 0.52, headY - headH * 0.18)
          ctx.quadraticCurveTo(
            cx - headW * 0.38,
            headY - headH * 0.58,
            cx - headW * 0.12,
            headY - headH * 0.7,
          )
          // crown flat
          ctx.lineTo(cx + headW * 0.12, headY - headH * 0.7)
          ctx.quadraticCurveTo(
            cx + headW * 0.38,
            headY - headH * 0.58,
            cx + headW * 0.52,
            headY - headH * 0.18,
          )
          // right cheek
          ctx.lineTo(cx + headW * 0.48, headY + headH * 0.08)
          // right muzzle down to snout tip
          ctx.lineTo(cx + headW * 0.22 + snout * 0.35, headY + headH * 0.32)
          ctx.quadraticCurveTo(
            cx + snout * 0.55,
            headY + headH * 0.55 + snout * 0.1,
            cx,
            headY + headH * 0.58 + snout * 0.22,
          )
          ctx.quadraticCurveTo(
            cx - snout * 0.55,
            headY + headH * 0.55 + snout * 0.1,
            cx - headW * 0.22 - snout * 0.35,
            headY + headH * 0.32,
          )
          ctx.closePath()
        }

        drawGlazeBody(
          ctx,
          buildHead,
          hc2,
          hc,
          sampleChroma(Math.min(1, tt + 0.38)),
          lightX,
          headY - 24,
        )

        // Hard brow ridge specular
        ctx.strokeStyle = withAlpha('#f8faf6', 0.55 + headPulse * 0.4)
        ctx.lineWidth = 2.8
        ctx.beginPath()
        ctx.moveTo(cx - headW * 0.36, headY - headH * 0.28)
        ctx.lineTo(cx - headW * 0.08, headY - headH * 0.42)
        ctx.lineTo(cx + headW * 0.08, headY - headH * 0.42)
        ctx.lineTo(cx + headW * 0.34, headY - headH * 0.26)
        ctx.stroke()

        // Cheek kiln-change seam
        ctx.strokeStyle = withAlpha(sampleChroma(Math.min(1, tt + 0.3)), 0.45)
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(cx - headW * 0.4, headY - headH * 0.05)
        ctx.quadraticCurveTo(cx, headY + headH * 0.08, cx + headW * 0.4, headY - headH * 0.05)
        ctx.stroke()

        // Eyes under brow shelf
        const eyeY = headY - headH * 0.12
        const eyeRx = 4.2 + eye * 5.2 + headPulse * 2.2
        const eyeRy = 2.2 + eye * 2.8
        for (const side of [-1, 1] as const) {
          const ex = cx + side * headW * 0.26
          // socket
          ctx.fillStyle = withAlpha('#07120f', 0.45 + eye * 0.5)
          ctx.beginPath()
          ctx.moveTo(ex - eyeRx * 1.2, eyeY)
          ctx.lineTo(ex - eyeRx * 0.3, eyeY - eyeRy * 1.1)
          ctx.lineTo(ex + eyeRx * 0.9, eyeY - eyeRy * 0.3)
          ctx.lineTo(ex + eyeRx * 0.5, eyeY + eyeRy * 0.8)
          ctx.closePath()
          ctx.fill()
          if (eye > 0.08) {
            const eg = ctx.createRadialGradient(ex - 1, eyeY - 1, 0, ex, eyeY, eyeRx)
            eg.addColorStop(0, withAlpha(sampleChroma(Math.min(1, tt + 0.55)), 0.95))
            eg.addColorStop(0.55, withAlpha(sampleChroma(tt), 0.65))
            eg.addColorStop(1, withAlpha('#04100c', 0.05))
            ctx.fillStyle = eg
            ctx.beginPath()
            ctx.ellipse(ex, eyeY, eyeRx * 0.48, eyeRy * 0.55, side * 0.2, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = withAlpha(
              sampleChroma(Math.min(1, tt + 0.4)),
              0.3 + fl * 0.4 + headPulse * 0.45,
            )
            ctx.beginPath()
            ctx.ellipse(ex, eyeY, eyeRx * 1.5, eyeRy * 1.5, 0, 0, Math.PI * 2)
            ctx.fill()
          } else {
            ctx.strokeStyle = withAlpha('#0a1612', 0.65)
            ctx.lineWidth = 1.8
            ctx.beginPath()
            ctx.moveTo(ex - eyeRx, eyeY + 1)
            ctx.lineTo(ex + eyeRx * 0.7, eyeY - 1)
            ctx.stroke()
          }
        }

        // Snout plate + nostrils
        if (headMix > 0.25) {
          ctx.fillStyle = withAlpha(shade(hc, -0.08), 0.55)
          ctx.beginPath()
          ctx.moveTo(cx - 14 - snout * 0.2, headY + headH * 0.28)
          ctx.lineTo(cx + 14 + snout * 0.2, headY + headH * 0.28)
          ctx.lineTo(cx + 8, headY + headH * 0.48 + snout * 0.1)
          ctx.lineTo(cx - 8, headY + headH * 0.48 + snout * 0.1)
          ctx.closePath()
          ctx.fill()
          ctx.strokeStyle = withAlpha('#0a1411', 0.55)
          ctx.lineWidth = 1.6
          for (const side of [-1, 1] as const) {
            ctx.beginPath()
            ctx.moveTo(cx + side * 6, headY + headH * 0.34)
            ctx.lineTo(cx + side * 11, headY + headH * 0.42)
            ctx.stroke()
          }
        }

        ctx.globalAlpha = 1
      }

      ctx.restore()

      // Kiln flare
      if (fl > 0.02) {
        const flareC = sampleChroma(Math.min(1, tt + 0.35))
        const fg = ctx.createRadialGradient(cx, 280, 8, cx, 300, 70 + fl * 150)
        fg.addColorStop(0, withAlpha('#fff6e4', 0.4 * fl))
        fg.addColorStop(0.28, withAlpha(flareC, 0.38 * fl))
        fg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = fg
        ctx.beginPath()
        ctx.ellipse(cx, 300, 95 + fl * 110, 125 + fl * 90, 0, 0, Math.PI * 2)
        ctx.fill()

        const sparks = Math.floor(fl * 20)
        for (let i = 0; i < sparks; i++) {
          const a = (i / sparks) * Math.PI * 2 + now / 580
          const rr = 36 + fl * 95 + Math.sin(now / 200 + i) * 14
          const sx = cx + Math.cos(a) * rr * 0.55
          const sy = 330 - fl * 90 - ((now / 18 + i * 37) % 70)
          ctx.fillStyle = withAlpha(sampleChroma((i / sparks) * 0.85), 0.45 + fl * 0.5)
          ctx.beginPath()
          ctx.arc(sx, sy, 1.4 + (i % 3) * 0.7, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Wet shimmer sweep
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      const slide = (shimmer - 0.5) * 100
      const shine = ctx.createLinearGradient(cx - 90 + slide, 70, cx + 50 + slide, 430)
      shine.addColorStop(0, 'rgba(255,255,255,0)')
      shine.addColorStop(0.46, 'rgba(255,255,255,0)')
      shine.addColorStop(0.5, `rgba(255,255,255,${0.14 + fl * 0.12})`)
      shine.addColorStop(0.54, 'rgba(255,255,255,0)')
      shine.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = shine
      ctx.fillRect(cx - 150, 50, 300, 430)
      ctx.restore()

      ctx.restore()
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [reducedMotion])

  const toLogical = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const mx = ((clientX - rect.left) / rect.width) * VW
    const my = ((clientY - rect.top) / rect.height) * VH
    // Approximate: canvas is letterboxed; use fit scale inverse from CSS box
    const scale = Math.min(rect.width / VW, rect.height / VH) * 1.05
    const ox = (rect.width - VW * scale) / 2
    const oy = (rect.height - VH * scale) / 2 + 8
    const x = (clientX - rect.left - ox) / scale
    const y = (clientY - rect.top - oy) / scale
    return { x, y, mx, my }
  }

  const pickZone = (clientX: number, clientY: number): HitZone => {
    const local = toLogical(clientX, clientY)
    if (!local) return null
    const z = zonesRef.current
    if (Math.abs(local.x - z.cx) > 120) return null
    if (local.y >= z.head.y0 && local.y < z.head.y1) return 'head'
    if (local.y >= z.scales.y0 && local.y < z.scales.y1) return 'scales'
    if (local.y >= z.eaves.y0 && local.y < z.eaves.y1) return 'eaves'
    return null
  }

  return (
    <div
      ref={wrapRef}
      className="hongtui-stage"
      onPointerDown={(e) => {
        if (e.button !== 0) return
        const zone = pickZone(e.clientX, e.clientY)
        if (zone) onZoneClick?.(zone)
        onHoldStart?.()
        try {
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        } catch {
          /* ignore */
        }
      }}
      onPointerUp={() => onHoldEnd?.()}
      onPointerCancel={() => onHoldEnd?.()}
    >
      <canvas ref={canvasRef} className="hongtui-canvas" aria-label="虹蜕色谱兽" />
    </div>
  )
}
