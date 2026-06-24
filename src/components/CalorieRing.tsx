interface Props {
  target: number
  exercise: number
  eaten: number
  remaining: number
}

export function CalorieRing({ target, exercise, eaten, remaining }: Props) {
  const R = 74
  const CIRC = 2 * Math.PI * R
  const frac = Math.min(eaten / Math.max(target, 1), 1)
  const offset = CIRC * (1 - frac)
  const over = remaining < 0
  const stroke = over ? 'var(--danger)' : 'var(--accent)'

  return (
    <div
      style={{ position: 'relative', width: 172, height: 172, margin: '6px auto 4px' }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={target}
      aria-valuenow={Math.min(eaten, target)}
      aria-label="Calories"
      aria-valuetext={`${eaten.toLocaleString()} of ${target.toLocaleString()} kcal eaten — ${Math.abs(remaining).toLocaleString()} ${over ? 'over' : 'remaining'}`}
    >
      <svg viewBox="0 0 172 172" width={172} height={172} aria-hidden="true">
        <circle cx={86} cy={86} r={R} fill="none" stroke="var(--surface-2)" strokeWidth={13} />
        <circle
          cx={86}
          cy={86}
          r={R}
          fill="none"
          stroke={stroke}
          strokeWidth={13}
          strokeLinecap="round"
          transform="rotate(-90 86 86)"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span key={remaining} className="pop" style={{ fontSize: 34, fontWeight: 600, lineHeight: 1 }}>
          {Math.abs(remaining).toLocaleString()}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>kcal remaining</span>
        <span
          style={{
            fontSize: 11,
            marginTop: 5,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            color: over ? 'var(--danger)' : 'var(--accent)',
          }}
        >
          <i className={over ? 'ti ti-alert-triangle' : 'ti ti-circle-check'} style={{ fontSize: 13 }} />
          {over ? `Over by ${Math.abs(remaining).toLocaleString()}` : 'On track'}
        </span>
      </div>
    </div>
  )
}
