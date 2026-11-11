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

export const SNAP: Record<StateId, number> = {
  yumian: 0.1,
  hongxing: 0.5,
  yaoxing: 0.9,
}

export const STATE_ORDER: StateId[] = ['yumian', 'hongxing', 'yaoxing']

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

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

export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + amount * 255, g + amount * 255, b + amount * 255)
}

export function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
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

export function stateLabel(idOrT: StateId | number): string {
  const id = typeof idOrT === 'number' ? stateFromT(idOrT) : idOrT
  return STATES.find((s) => s.id === id)?.label ?? '釉眠'
}

export function nextState(id: StateId): StateId {
  const i = STATE_ORDER.indexOf(id)
  return STATE_ORDER[(i + 1) % STATE_ORDER.length]
}

/** Morph blend factors — tuned for clear half-tower / half-beast read */
export function morphFactors(t: number) {
  const s = smoothstep(t)
  return {
    /** Closed tower mass (strong early) */
    tower: 1 - smoothstep((t - 0.05) / 0.55),
    /** Hybrid peak around 虹行 — keep high through mid */
    hybrid: Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.05) / 0.9))),
    /** Beast dominance starts mid-early so 虹行 already shows head */
    beast: smoothstep((t - 0.22) / 0.55),
    /** Scale plate coverage */
    scales: smoothstep((t - 0.02) / 0.55),
    /** Spine / mane ridge */
    ridge: smoothstep((t - 0.12) / 0.5),
    /** Eyes / crown awake */
    awake: smoothstep((t - 0.42) / 0.45),
    /** Eave flare outward */
    eaveSpread: lerp(0.95, 1.18, s),
    chroma: s,
  }
}
