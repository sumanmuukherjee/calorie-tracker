import { useMemo, useState } from 'react'
import { currentStreak, useStore, useTotals } from '../store'
import { fromKg, getWeightUnit, toKg } from '../lib/units'

const RANGES = [7, 30, 90]

function lastNDates(n: number): string[] {
  const out: string[] = []
  const base = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    out.push(d.toLocaleDateString('en-CA'))
  }
  return out
}

function WeightChart({ points }: { points: { date: string; kg: number }[] }) {
  const W = 320
  const H = 120
  const pad = 10
  const kgs = points.map((p) => p.kg)
  const min = Math.min(...kgs)
  const max = Math.max(...kgs)
  const rng = max - min || 1
  const pts = points.map((p, i) => {
    const x = pad + (W - 2 * pad) * (i / (points.length - 1))
    const y = pad + (H - 2 * pad) * (1 - (p.kg - min) / rng)
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
  const { state, dispatch } = useStore()
  const { eaten, target, maintenance } = useTotals()
  const [range, setRange] = useState(30)
  const [wt, setWt] = useState('')
  const [unit] = useState(getWeightUnit)

  // Calories for any date: today comes from the live total, past days from history.
  const kcalFor = (date: string) => (date === state.currentDate ? eaten : state.history[date] ?? 0)

  const rangeDates = useMemo(() => lastNDates(range), [range])
  const rangeSet = useMemo(() => new Set(rangeDates), [rangeDates])

  const weightPoints = state.weighIns.filter((w) => rangeSet.has(w.date))
  const latestWeight = state.weighIns.length ? state.weighIns[state.weighIns.length - 1].kg : state.profile.weightKg
  const weightChange = weightPoints.length >= 2 ? weightPoints[weightPoints.length - 1].kg - weightPoints[0].kg : null

  const week = useMemo(() => lastNDates(7), [])
  const weekKcal = week.map(kcalFor)
  const dayLetters = week.map((ds) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(ds + 'T00:00:00').getDay()])
  const maxBar = Math.max(target * 1.2, ...weekKcal, 1)

  const intakeVals = rangeDates.map(kcalFor).filter((v) => v > 0)
  const avgIntake = intakeVals.length ? Math.round(intakeVals.reduce((a, b) => a + b, 0) / intakeVals.length) : 0
  const avgDeficit = avgIntake ? Math.round(maintenance - avgIntake) : 0

  const streak = currentStreak(state.history, state.currentDate, eaten)

  const logWeight = () => {
    const entered = parseFloat(wt)
    if (!(entered > 0)) return
    const kg = toKg(entered, unit)
    if (kg > 0 && kg < 600) {
      dispatch({ type: 'LOG_WEIGHT', kg: Math.round(kg * 10) / 10 })
      setWt('')
    }
  }

  return (
    <div className="fade-in screen-pad">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <span className="h-title">Progress</span>
        <i className="ti ti-share" style={{ fontSize: 19, color: 'var(--text-3)' }} aria-label="Share" />
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
        <span className="muted" style={{ fontSize: 13 }}>Weight</span>
        {weightChange !== null && (
          <span style={{ fontSize: 13, fontWeight: 600, color: weightChange <= 0 ? 'var(--accent)' : 'var(--danger)' }}>
            {weightChange <= 0 ? '−' : '+'}
            {fromKg(Math.abs(weightChange), unit, 1)} {unit}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 30, fontWeight: 600, lineHeight: 1 }}>{fromKg(latestWeight, unit, 1)}</span>
        <span className="muted" style={{ fontSize: 14 }}>{unit}{state.weighIns.length ? '' : ' · from profile'}</span>
      </div>

      {weightPoints.length >= 2 ? (
        <div style={{ height: 120, marginBottom: 14 }}>
          <WeightChart points={weightPoints} />
        </div>
      ) : (
        <div className="strip" style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14, padding: 14 }}>
          Log your weight regularly to see your trend here.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input
          type="number"
          inputMode="decimal"
          value={wt}
          onChange={(e) => setWt(e.target.value)}
          placeholder={`Today's weight (${unit})`}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
        />
        <button
          onClick={logWeight}
          style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '0 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Log
        </button>
      </div>

      <div className="seg" style={{ marginBottom: 18 }}>
        {RANGES.map((n) => (
          <button key={n} className={range === n ? 'on' : ''} onClick={() => setRange(n)}>
            {n} days
          </button>
        ))}
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>
        Calories · last 7 days
      </div>
      <div style={{ position: 'relative', height: 84, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7, marginBottom: 6 }}>
        {weekKcal.map((v, i) => {
          const ht = Math.round((v / maxBar) * 72)
          const over = v > target
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ width: '100%', height: v > 0 ? Math.max(ht, 2) : 0, background: over ? 'var(--danger)' : 'var(--accent)', borderRadius: '4px 4px 0 0', opacity: over ? 0.85 : 1 }} />
              <span className="tiny" style={{ color: 'var(--text-3)' }}>{dayLetters[i]}</span>
            </div>
          )
        })}
        <div style={{ position: 'absolute', left: 0, right: 0, top: Math.round((1 - target / maxBar) * 72), borderTop: '1.5px dashed var(--text-3)' }} />
      </div>
      <div className="tiny" style={{ color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
        <span style={{ width: 14, height: 2, background: 'var(--text-3)', display: 'inline-block', borderRadius: 2 }} />
        Goal {target.toLocaleString()}
        {avgIntake ? ` · avg ${avgIntake.toLocaleString()}/day` : ''}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
        <Stat label="Avg intake" value={avgIntake ? avgIntake.toLocaleString() : '—'} />
        <Stat
          label="Weight change"
          value={weightChange !== null ? `${weightChange <= 0 ? '−' : '+'}${fromKg(Math.abs(weightChange), unit, 1)} ${unit}` : '—'}
          color={weightChange !== null && weightChange <= 0 ? 'var(--accent)' : undefined}
        />
        <Stat label="Avg deficit" value={avgIntake ? (avgDeficit >= 0 ? `−${avgDeficit}` : `+${-avgDeficit}`) : '—'} />
        <Stat label="Logging streak" value={`${streak} day${streak === 1 ? '' : 's'}`} color="var(--warn)" />
      </div>
    </div>
  )
}
