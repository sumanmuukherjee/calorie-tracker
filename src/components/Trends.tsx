import { useMemo, useState } from 'react'

const WEIGHT_SERIES = Array.from({ length: 90 }, (_, i) => {
  const t = i / 89
  return 84 - 2.6 * t + 0.45 * Math.sin(i * 0.7) + 0.25 * Math.sin(i * 1.9)
})

const RANGE_LABELS: Record<number, [string, string]> = {
  7: ['Jun 17', 'Jun 23'],
  30: ['May 24', 'Jun 23'],
  90: ['Mar 25', 'Jun 23'],
}

const WEEK = [2010, 1880, 1960, 2120, 1840, 1900, 1870]
const GOAL = 1900

function WeightChart({ range }: { range: number }) {
  const slice = useMemo(() => WEIGHT_SERIES.slice(90 - range), [range])
  const W = 320
  const H = 120
  const pad = 8
  const min = Math.min(...slice)
  const max = Math.max(...slice)
  const rng = max - min || 1
  const pts = slice.map((v, i) => {
    const x = pad + (W - 2 * pad) * (i / (slice.length - 1))
    const y = pad + (H - 2 * pad) * (1 - (v - min) / rng)
    return [x, y] as const
  })
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  const area = `${d} L${last[0].toFixed(1)} ${H} L${pad} ${H} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" aria-hidden="true">
      <path d={area} fill="var(--accent)" opacity={0.08} />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r={4} fill="var(--accent)" />
    </svg>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="strip">
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  )
}

export function Trends() {
  const [range, setRange] = useState(30)
  const slice = WEIGHT_SERIES.slice(90 - range)
  const change = slice[slice.length - 1] - slice[0]
  const max = 2300

  return (
    <div className="fade-in screen-pad">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <span className="h-title">Progress</span>
        <i className="ti ti-share" style={{ fontSize: 19, color: 'var(--text-3)' }} aria-label="Share" />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
        <span className="muted" style={{ fontSize: 13 }}>Weight trend</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: change <= 0 ? 'var(--accent)' : 'var(--danger)' }}>
          {change <= 0 ? '−' : '+'}
          {Math.abs(change).toFixed(1)} kg
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{slice[slice.length - 1].toFixed(1)}</span>
        <span className="muted" style={{ fontSize: 14 }}>kg</span>
      </div>

      <div style={{ height: 120, marginBottom: 8 }}>
        <WeightChart range={range} />
      </div>
      <div className="row-between tiny" style={{ color: 'var(--text-3)', marginBottom: 14 }}>
        <span>{RANGE_LABELS[range][0]}</span>
        <span>{RANGE_LABELS[range][1]}</span>
      </div>

      <div className="seg" style={{ marginBottom: 18 }}>
        {[7, 30, 90].map((n) => (
          <button key={n} className={range === n ? 'on' : ''} onClick={() => setRange(n)}>
            {n} days
          </button>
        ))}
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Calories · last 7 days
      </div>
      <div style={{ position: 'relative', height: 84, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7, marginBottom: 6 }}>
        {WEEK.map((v, i) => {
          const ht = Math.round((v / max) * 72)
          const over = v > GOAL
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', height: ht, background: over ? 'var(--danger)' : 'var(--accent)', borderRadius: '4px 4px 0 0', opacity: over ? 0.85 : 1 }} />
              <span className="tiny" style={{ color: 'var(--text-3)' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
            </div>
          )
        })}
        <div style={{ position: 'absolute', left: 0, right: 0, top: Math.round((1 - GOAL / max) * 72), borderTop: '1.5px dashed var(--text-3)' }} />
      </div>
      <div className="tiny" style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
        <span style={{ width: 14, height: 2, background: 'var(--text-3)', display: 'inline-block', borderRadius: 2 }} />
        Goal {GOAL.toLocaleString()} · avg 1,940/day
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <Stat label="Avg intake" value="1,940" />
        <Stat label="Weight change" value="−2.4 kg" color="var(--accent)" />
        <Stat label="Avg deficit" value="−480" />
        <Stat label="Logging streak" value="12 days" color="var(--warn)" />
      </div>
    </div>
  )
}
