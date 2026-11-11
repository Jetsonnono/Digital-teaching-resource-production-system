/** Locked glaze spectrum: 窑青 → 孔雀绿 → 胭脂焰 → 蜜琥珀 → 霜白釉 */
export const COLOR_STOPS = [
  { id: 'yaoqing', label: '窑青', hex: '#1a5c5e' },
  { id: 'kongque', label: '孔雀绿', hex: '#0d8a72' },
  { id: 'yanzhi', label: '胭脂焰', hex: '#b84a4a' },
  { id: 'mihupo', label: '蜜琥珀', hex: '#c9953a' },
  { id: 'shuangbai', label: '霜白釉', hex: '#e6e8e4' },
] as const

export type StateId = 'yumian' | 'hongxing' | 'yaoxing'

export const STATES: { id: StateId; label: string; range: [number, number] }[] = [
  { id: 'yumian', label: '釉眠', range: [0, 0.33] },
  { id: 'hongxing', label: '虹行', range: [0.33, 0.66] },
  { id: 'yaoxing', label: '窑醒', range: [0.66, 1] },
]

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** Smoothstep for organic glaze transitions */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  return rgbToHex(lerp(ar, br, t), lerp(ag, bg, t), lerp(ab, bb, t))
}

/** Sample the five-stop glaze ramp at t ∈ [0,1] */
export function sampleChroma(t: number): string {
  const x = Math.min(1, Math.max(0, t))
  const n = COLOR_STOPS.length - 1
  const scaled = x * n
  const i = Math.min(n - 1, Math.floor(scaled))
  const local = smoothstep(scaled - i)
  return lerpColor(COLOR_STOPS[i].hex, COLOR_STOPS[i + 1].hex, local)
}

export function stateFromT(t: number): StateId {
  if (t < 0.33) return 'yumian'
  if (t < 0.66) return 'hongxing'
  return 'yaoxing'
}

export function stateLabel(t: number): string {
  return STATES.find((s) => t >= s.range[0] && t <= s.range[1])?.label
    ?? (t < 0.33 ? '釉眠' : t < 0.66 ? '虹行' : '窑醒')
}

/** Morph blend factors for silhouette layers */
export function morphFactors(t: number) {
  const s = smoothstep(t)
  return {
    /** Closed pagoda body strength (strong at 釉眠) */
    tower: 1 - smoothstep((t - 0.15) / 0.55),
    /** Half-beast emergence (peaks mid 虹行) */
    hybrid: Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.12) / 0.76))),
    /** Full beast / crown (窑醒) */
    beast: smoothstep((t - 0.45) / 0.5),
    /** Glaze scale flare */
    scales: 0.25 + 0.75 * s,
    /** Spine ridge lift */
    ridge: smoothstep((t - 0.2) / 0.55),
    /** Eye / crown glow */
    awake: smoothstep((t - 0.55) / 0.4),
    chroma: s,
  }
}
