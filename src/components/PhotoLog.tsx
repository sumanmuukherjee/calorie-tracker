import { useState } from 'react'
import { useStore } from '../store'
import { PHOTO_DETECTED } from '../data/foods'
import type { Food } from '../types'

interface Item extends Food {
  confidence: number
  on: boolean
  qty: number
}

function confidencePill(c: number) {
  if (c >= 85) return { bg: 'var(--accent-soft)', fg: 'var(--accent-press)', txt: `High match ${c}%` }
  if (c >= 72) return { bg: 'rgba(186,117,23,0.14)', fg: 'var(--amber)', txt: `Likely ${c}%` }
  return { bg: 'rgba(226,75,74,0.13)', fg: 'var(--danger)', txt: `Low — check ${c}%` }
}

export function PhotoLog() {
  const { state, dispatch } = useStore()
  const [items, setItems] = useState<Item[]>(
    PHOTO_DETECTED.map((d) => ({ ...d, on: true, qty: 1 })),
  )

  const update = (id: string, patch: Partial<Item>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const active = items.filter((i) => i.on)
  const total = Math.round(active.reduce((a, i) => a + i.kcal * i.qty, 0))

  const logAll = () => {
    dispatch({
      type: 'ADD_MANY',
      meal: 'Lunch',
      foods: active.map((i) => ({ food: { id: i.id, name: i.name, portion: i.portion, kcal: i.kcal, p: i.p, c: i.c, f: i.f }, qty: i.qty })),
    })
    dispatch({ type: 'SET_SCREEN', screen: 'today' })
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 8 }}>
      <div style={{ position: 'relative', height: 170, background: '#faeeda', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 220 150" width={220} height={150} aria-hidden="true">
          <ellipse cx={110} cy={80} rx={86} ry={54} fill="#fff" stroke="#d3d1c7" strokeWidth={1.5} />
          <ellipse cx={80} cy={68} rx={29} ry={20} fill="#f0997b" />
          <ellipse cx={138} cy={66} rx={27} ry={18} fill="#e1e0d6" />
          <ellipse cx={110} cy={104} rx={25} ry={15} fill="#97c459" />
        </svg>
        <button
          className="iconbtn"
          aria-label="Back"
          onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'today' })}
          style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 18 }} aria-hidden="true" />
        </button>
        <div style={{ position: 'absolute', top: 14, right: 12, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, padding: '4px 9px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 5 }}>
          <i className="ti ti-flask" style={{ fontSize: 13 }} aria-hidden="true" />
          Demo
        </div>
      </div>

      <div className="screen-pad">
        <div className="strip" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', marginBottom: 12, fontSize: 12, lineHeight: 1.5, color: 'var(--text-2)' }}>
          <i className="ti ti-info-circle" style={{ fontSize: 16, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>
            <b style={{ color: 'var(--text)' }}>Demo preview.</b> These are sample items, not detected from a photo. Real photo recognition is coming soon — you can still log them to try the flow.
          </span>
        </div>
        <div className="row-between" style={{ marginBottom: 2 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Review &amp; confirm</span>
          <span className="muted" style={{ fontSize: 12 }}>Adding to Lunch</span>
        </div>
        <div className="tiny" style={{ color: 'var(--text-3)', marginBottom: 10 }}>
          Tap a portion to adjust · untick anything wrong
        </div>

        {items.map((it) => {
          const pill = confidencePill(it.confidence)
          return (
            <div
              key={it.id}
              className="row-between"
              style={{ padding: '11px 2px', borderTop: '0.5px solid var(--border)', opacity: it.on ? 1 : 0.45 }}
            >
              <button
                aria-label={`Include ${it.name}`}
                onClick={() => update(it.id, { on: !it.on })}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: it.on ? 'none' : '1.5px solid var(--border-2)',
                  background: it.on ? 'var(--accent)' : 'transparent',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  marginRight: 10,
                }}
              >
                {it.on ? <i className="ti ti-check" style={{ fontSize: 16 }} /> : null}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14 }}>{it.name}</div>
                <span className="pill" style={{ background: pill.bg, color: pill.fg, marginTop: 3, display: 'inline-block' }}>
                  {pill.txt}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                <button className="iconbtn" style={{ width: 26, height: 26 }} aria-label="Less" onClick={() => update(it.id, { qty: Math.max(0.5, Math.round((it.qty - 0.5) * 2) / 2) })}>
                  −
                </button>
                <span className="muted" style={{ fontSize: 12, minWidth: 30, textAlign: 'center' }}>{it.qty}×</span>
                <button className="iconbtn" style={{ width: 26, height: 26 }} aria-label="More" onClick={() => update(it.id, { qty: Math.round((it.qty + 0.5) * 2) / 2 })}>
                  +
                </button>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 52, textAlign: 'right' }}>{Math.round(it.kcal * it.qty)}</span>
            </div>
          )
        })}

        <div className="row-between" style={{ padding: '14px 2px 8px', borderTop: '0.5px solid var(--border)', marginTop: 4 }}>
          <span className="muted" style={{ fontSize: 13 }}>Total</span>
          <span style={{ fontSize: 22, fontWeight: 600 }}>{total.toLocaleString()} kcal</span>
        </div>

        <button className="primary" disabled={active.length === 0} onClick={logAll} style={{ opacity: active.length === 0 ? 0.5 : 1 }}>
          Log {active.length} {active.length === 1 ? 'item' : 'items'} to lunch
        </button>
      </div>
    </div>
  )
}
