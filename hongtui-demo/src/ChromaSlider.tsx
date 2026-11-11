import { COLOR_STOPS, stateLabel } from './chroma'

type Props = {
  value: number
  onChange: (t: number) => void
  onRelease?: (t: number) => void
}

export function ChromaSlider({ value, onChange, onRelease }: Props) {
  const label = stateLabel(value)
  const pct = Math.round(value * 100)

  return (
    <div className="chroma">
      <div className="chroma__meta">
        <span className="chroma__state" aria-live="polite">
          {label}
        </span>
        <span className="chroma__hint">拖动色谱 · 松手锁态</span>
      </div>

      <div className="chroma__track-wrap">
        <div className="chroma__ramp" aria-hidden="true" />
        <input
          className="chroma__input"
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${label}，色谱 ${pct}%`}
          aria-label="虹蜕色谱"
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={(e) =>
            onRelease?.(Number((e.target as HTMLInputElement).value))
          }
          onKeyUp={(e) =>
            onRelease?.(Number((e.target as HTMLInputElement).value))
          }
        />
      </div>

      <ul className="chroma__stops">
        {COLOR_STOPS.map((stop) => (
          <li key={stop.id}>
            <span
              className="chroma__swatch"
              style={{ background: stop.hex }}
              aria-hidden="true"
            />
            <span>{stop.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
