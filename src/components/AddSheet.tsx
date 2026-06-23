import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { FOODS } from '../data/foods'
import { searchFoods } from '../lib/foodSearch'
import { MEAL_ORDER } from '../types'
import type { Food, MealName } from '../types'

export function AddSheet() {
  const { state, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const [remote, setRemote] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)

  const local = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FOODS
    return FOODS.filter((f) => f.name.toLowerCase().includes(q))
  }, [query])

  // Debounced live search against Open Food Facts.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setRemote([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = window.setTimeout(async () => {
      const found = await searchFoods(q)
      setRemote(found)
      setSearching(false)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [query])

  const results = useMemo(() => {
    if (!query.trim()) return FOODS
    const seen = new Set(local.map((f) => f.name.toLowerCase()))
    const merged: Food[] = [...local]
    for (const f of remote) {
      const key = f.name.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(f)
      }
    }
    return merged
  }, [query, local, remote])

  const setMeal = (meal: MealName) => dispatch({ type: 'OPEN_SHEET', meal })
  const close = () => dispatch({ type: 'CLOSE_SHEET' })

  const flash = (msg: string) => {
    setNote(msg)
    window.setTimeout(() => setNote(''), 1600)
  }

  const isSearch = query.trim().length > 0
  const label = note || (isSearch ? 'Results' : 'Recent & frequent')

  const mealItems = state.meals[state.sheetMeal]
  const mealKcal = Math.round(mealItems.reduce((a, i) => a + i.kcal * i.qty, 0))

  return (
    <>
      <div className={`backdrop ${state.sheetOpen ? 'on' : ''}`} onClick={close} />
      <div className={`sheet ${state.sheetOpen ? 'on' : ''}`} role="dialog" aria-label="Add food">
        <div className="grabber" />
        <div className="row-between" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Add food</span>
          <button
            onClick={close}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Done
          </button>
        </div>

        <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
          {MEAL_ORDER.map((meal) => (
            <button key={meal} className={`mealchip ${state.sheetMeal === meal ? 'on' : ''}`} onClick={() => setMeal(meal)}>
              {meal}
            </button>
          ))}
        </div>

        <div className="tiny" style={{ color: 'var(--text-2)', margin: '0 0 11px 2px' }}>
          {state.sheetMeal}: <b style={{ color: 'var(--text)', fontWeight: 600 }}>{mealKcal} kcal</b>
          {mealItems.length ? ` · ${mealItems.length} item${mealItems.length > 1 ? 's' : ''}` : ' · tap items to add'}
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
          {searching && (
            <i className="ti ti-loader-2" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-3)', animation: 'spin 0.9s linear infinite' }} aria-hidden="true" />
          )}
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
          {label}
        </div>

        <div>
          {results.length === 0 ? (
            <div className="muted" style={{ fontSize: 13, padding: '14px 4px' }}>
              {searching ? 'Searching…' : 'No matches — tap “Custom” to create it.'}
            </div>
          ) : (
            results.map((food) => (
              <div
                key={food.id}
                className="foodrow"
                onClick={() => {
                  dispatch({ type: 'ADD_FOOD', meal: state.sheetMeal, food })
                  flash(`Added ${food.name}`)
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
