import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { FOODS } from '../data/foods'
import { MEAL_ORDER } from '../types'
import type { MealName } from '../types'

export function AddSheet() {
  const { state, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FOODS
    return FOODS.filter((f) => f.name.toLowerCase().includes(q))
  }, [query])

  const setMeal = (meal: MealName) => dispatch({ type: 'OPEN_SHEET', meal })
  const close = () => dispatch({ type: 'CLOSE_SHEET' })

  const flash = (msg: string) => {
    setNote(msg)
    window.setTimeout(() => setNote(''), 1600)
  }

  return (
    <>
      <div className={`backdrop ${state.sheetOpen ? 'on' : ''}`} onClick={close} />
      <div className={`sheet ${state.sheetOpen ? 'on' : ''}`} role="dialog" aria-label="Add food">
        <div className="grabber" />
        <div className="row-between" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Add food</span>
          <i className="ti ti-x" style={{ fontSize: 20, color: 'var(--text-3)', cursor: 'pointer' }} role="button" aria-label="Close" onClick={close} />
        </div>

        <div style={{ display: 'flex', gap: 7, marginBottom: 11 }}>
          {MEAL_ORDER.map((meal) => (
            <button key={meal} className={`mealchip ${state.sheetMeal === meal ? 'on' : ''}`} onClick={() => setMeal(meal)}>
              {meal}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: 11 }}>
          <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-3)' }} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods"
            autoComplete="off"
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: 'var(--radius-sm)',
              border: '0.5px solid var(--border-2)',
              background: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>

        <div className="chip-grid" style={{ marginBottom: 14 }}>
          <button className="method" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'photo' })}>
            <i className="ti ti-camera" style={{ fontSize: 19 }} aria-hidden="true" />
            Photo
          </button>
          <button className="method" onClick={() => flash('Barcode scanner opens here')}>
            <i className="ti ti-barcode" style={{ fontSize: 19 }} aria-hidden="true" />
            Scan
          </button>
          <button className="method" onClick={() => flash('Voice logging opens here')}>
            <i className="ti ti-microphone" style={{ fontSize: 19 }} aria-hidden="true" />
            Voice
          </button>
          <button className="method" onClick={() => flash('Build a custom food')}>
            <i className="ti ti-pencil-plus" style={{ fontSize: 19 }} aria-hidden="true" />
            Custom
          </button>
        </div>

        <div className="eyebrow" style={{ marginBottom: 4 }}>
          {note || 'Recent & frequent'}
        </div>

        <div>
          {results.length === 0 ? (
            <div className="muted" style={{ fontSize: 13, padding: '14px 4px' }}>
              No matches — tap “Custom” to create it.
            </div>
          ) : (
            results.map((food) => (
              <div
                key={food.id}
                className="foodrow"
                onClick={() => {
                  dispatch({ type: 'ADD_FOOD', meal: state.sheetMeal, food })
                  close()
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14 }}>{food.name}</div>
                  <div className="tiny" style={{ color: 'var(--text-3)' }}>
                    {food.portion} · {food.p}P {food.c}C {food.f}F
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{food.kcal} kcal</span>
                  <i className="ti ti-circle-plus" style={{ fontSize: 21, color: 'var(--accent)' }} aria-hidden="true" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
