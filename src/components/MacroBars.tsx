interface Props {
  macros: { p: number; c: number; f: number }
  goals: { protein: number; carbs: number; fat: number }
}

function Bar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(value / Math.max(goal, 1), 1) * 100
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span>{label}</span>
        <span className="muted">
          {Math.round(value)} / {goal} g
        </span>
      </div>
      <div
        style={{ height: 6, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.round(value)}
        aria-label={`${label} ${Math.round(value)} of ${goal} grams`}
      >
        <div
          style={{
            height: '100%',
            width: `${pct.toFixed(0)}%`,
            background: color,
            borderRadius: 99,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  )
}

export function MacroBars({ macros, goals }: Props) {
  return (
    <div className="strip" style={{ padding: '12px 14px' }}>
      <Bar label="Protein" value={macros.p} goal={goals.protein} color="var(--blue)" />
      <Bar label="Carbs" value={macros.c} goal={goals.carbs} color="var(--amber)" />
      <Bar label="Fat" value={macros.f} goal={goals.fat} color="var(--coral)" />
    </div>
  )
}
