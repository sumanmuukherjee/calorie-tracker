import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { FOODS } from '../data/foods'
import { searchFoods } from '../lib/foodSearch'
import { MEAL_ORDER } from '../types'
import type { Food, MealName } from '../types'
import { itemCount } from '../lib/format'

// Amount picker shown after tapping a food. Database foods (per 100 g) are
// entered in grams; recents are entered in servings of their portion. All
// nutrition scales from the chosen amount.
function QuantityPanel({
  food,
  meal,
  initialQty,
  editMode,
  onBack,
  onAdd,
  onRemove,
}: {
  food: Food
  meal: MealName
  initialQty?: number
  editMode?: boolean
  onBack: () => void
  onAdd: (food: Food, qty: number) => void
  onRemove?: () => void
}) {
  const per100g = food.portion === 'per 100 g'
  const OZ = 28.3495 // grams per ounce
  const [unit, setUnit] = useState<'g' | 'oz'>('g')
  const step = per100g ? (unit === 'g' ? 10 : 0.5) : 0.5
  const minA = per100g ? (unit === 'g' ? 1 : 0.1) : 0.25
  const initialAmount = initialQty != null ? (per100g ? initialQty * 100 : initialQty) : per100g ? 100 : 1
  const [amount, setAmount] = useState(initialAmount)
  const [text, setText] = useState(() => String(initialAmount))

  const setBoth = (n: number) => {
    const v = Math.max(minA, Math.round(n * 100) / 100)
    setAmount(v)
    setText(String(v))
  }
  // F9 — per-100g foods can be entered in grams or ounces (exact conversion);
  // serving-based foods stay in servings.
  const chooseUnit = (u: 'g' | 'oz') => {
    if (!per100g || u === unit) return
    const next = u === 'oz' ? amount / OZ : amount * OZ
    setUnit(u)
    const min = u === 'g' ? 1 : 0.1
    const v = Math.max(min, Math.round(next * 100) / 100)
    setAmount(v)
    setText(String(v))
  }
  const grams = per100g ? (unit === 'g' ? amount : amount * OZ) : 0
  const qty = per100g ? grams / 100 : amount
  const macro = (m: number) => Math.round(m * qty)

  return (
    <div className="fade-in">
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 14, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <i className="ti ti-chevron-left" style={{ fontSize: 18 }} aria-hidden="true" /> Back
      </button>
      <div style={{ fontSize: 17, fontWeight: 600 }}>{food.name}</div>
      <div className="tiny" style={{ color: 'var(--text-3)', marginBottom: 16 }}>{per100g ? 'per 100 g' : food.portion}</div>

      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="eyebrow">{per100g ? `Amount in ${unit === 'g' ? 'grams' : 'ounces'}` : 'Servings'}</span>
        {per100g && (
          <div style={{ display: 'flex', gap: 4 }}>
            {(['g', 'oz'] as const).map((u) => (
              <button key={u} type="button" onClick={() => chooseUnit(u)} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, border: '0.5px solid var(--border)', background: unit === u ? 'var(--accent)' : 'transparent', color: unit === u ? '#fff' : 'var(--text-3)', cursor: 'pointer' }}>
                {u}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <button type="button" onClick={() => setBoth(amount - step)} className="iconbtn" style={{ width: 42, height: 42, fontSize: 22 }} aria-label="Less">−</button>
        <input
          type="text"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            const n = parseFloat(e.target.value)
            if (!Number.isNaN(n)) setAmount(Math.max(minA, n))
          }}
          onBlur={() => setText(String(amount))}
          style={{ flex: 1, textAlign: 'center', padding: '11px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontSize: 18, fontWeight: 600 }}
        />
        <button type="button" onClick={() => setBoth(amount + step)} className="iconbtn" style={{ width: 42, height: 42, fontSize: 22 }} aria-label="More">+</button>
      </div>
      <div className="tiny" style={{ color: 'var(--text-3)', marginBottom: 16 }}>{per100g ? unit : `× ${food.portion}`}</div>

      <div className="strip" style={{ textAlign: 'center', borderRadius: 'var(--radius-lg)', padding: 14, marginBottom: 14 }}>
        <div style={{ fontSize: 30, fontWeight: 600, color: 'var(--accent)' }}>
          {Math.round(food.kcal * qty).toLocaleString()} <span className="muted" style={{ fontSize: 14 }}>kcal</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, fontSize: 12 }}>
          <span><b style={{ color: 'var(--blue)' }}>{macro(food.p)}</b><span className="muted"> P</span></span>
          <span><b style={{ color: 'var(--amber)' }}>{macro(food.c)}</b><span className="muted"> C</span></span>
          <span><b style={{ color: 'var(--coral)' }}>{macro(food.f)}</b><span className="muted"> F</span></span>
        </div>
      </div>

      <button className="primary" onClick={() => onAdd(food, qty)}>{editMode ? 'Save changes' : `Add to ${meal}`}</button>
      {editMode && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          style={{ width: '100%', background: 'none', border: 'none', color: 'var(--danger)', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: '12px 0 2px' }}
        >
          Remove from {meal}
        </button>
      )}
    </div>
  )
}

const fieldStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '10px 11px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontSize: 16 }

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label className="tiny" style={{ color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>{label}</label>
      <input type="text" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0" style={fieldStyle} />
    </div>
  )
}

// F2 — build a real custom food (name, serving, kcal, macros) that persists and
// is then searchable/loggable like any other food.
function CustomFoodForm({ seedName, onBack, onSave }: { seedName: string; onBack: () => void; onSave: (food: Food) => void }) {
  const [name, setName] = useState(seedName)
  const [portion, setPortion] = useState('1 serving')
  const [kcal, setKcal] = useState('')
  const [p, setP] = useState('')
  const [c, setC] = useState('')
  const [f, setF] = useState('')
  const num = (s: string) => {
    const n = parseFloat(s)
    return Number.isFinite(n) && n >= 0 ? n : null
  }
  const kcalN = num(kcal)
  const pN = num(p) ?? 0
  const cN = num(c) ?? 0
  const fN = num(f) ?? 0
  const valid = name.trim().length > 0 && kcalN != null
  const macroKcal = Math.round(pN * 4 + cN * 4 + fN * 9)
  const mismatch = kcalN != null && (pN > 0 || cN > 0 || fN > 0) && Math.abs(macroKcal - kcalN) > 60

  return (
    <div className="fade-in">
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 14, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <i className="ti ti-chevron-left" style={{ fontSize: 18 }} aria-hidden="true" /> Back
      </button>
      <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>Create a food</div>

      <label className="tiny" style={{ color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Homemade granola" style={{ ...fieldStyle, marginBottom: 12 }} />

      <label className="tiny" style={{ color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>Serving</label>
      <input value={portion} onChange={(e) => setPortion(e.target.value)} placeholder="1 serving" style={{ ...fieldStyle, marginBottom: 12 }} />

      <div style={{ marginBottom: 12 }}>
        <NumField label="Calories (kcal)" value={kcal} onChange={setKcal} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <NumField label="Protein (g)" value={p} onChange={setP} />
        <NumField label="Carbs (g)" value={c} onChange={setC} />
        <NumField label="Fat (g)" value={f} onChange={setF} />
      </div>
      {mismatch && (
        <div className="tiny" style={{ color: 'var(--text-2)', marginBottom: 10 }}>
          Heads up — your macros add up to about {macroKcal.toLocaleString()} kcal.
        </div>
      )}
      <button
        className="primary"
        disabled={!valid}
        style={{ opacity: valid ? 1 : 0.5, marginTop: 6 }}
        onClick={() =>
          valid &&
          onSave({ id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: name.trim(), portion: portion.trim() || '1 serving', kcal: Math.round(kcalN as number), p: Math.round(pN), c: Math.round(cN), f: Math.round(fN) })
        }
      >
        Save food
      </button>
    </div>
  )
}

export function AddSheet() {
  const { state, dispatch } = useStore()
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const [remote, setRemote] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Food | null>(null)
  const [building, setBuilding] = useState(false)
  const [seedName, setSeedName] = useState('')

  const sheetRef = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  // Reset the amount/build panels whenever the sheet closes.
  useEffect(() => {
    if (!state.sheetOpen) {
      setSelected(null)
      setBuilding(false)
    }
  }, [state.sheetOpen])

  // A4 — dialog lifecycle. When closed the sheet is inert + aria-hidden so it's
  // unreachable by keyboard/AT; when open, focus moves in, Escape closes, and
  // focus returns to whatever opened it.
  useEffect(() => {
    const el = sheetRef.current
    if (!el) return
    if (state.sheetOpen) {
      el.removeAttribute('inert')
      lastFocus.current = (document.activeElement as HTMLElement) ?? null
      const id = window.setTimeout(() => el.focus(), 60)
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') dispatch({ type: 'CLOSE_SHEET' })
      }
      document.addEventListener('keydown', onKey)
      return () => {
        window.clearTimeout(id)
        document.removeEventListener('keydown', onKey)
      }
    }
    el.setAttribute('inert', '')
    lastFocus.current?.focus?.()
  }, [state.sheetOpen, dispatch])

  const local = useMemo(() => {
    const base = [...state.customFoods, ...FOODS]
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base.filter((f) => f.name.toLowerCase().includes(q))
  }, [query, state.customFoods])

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
    if (!query.trim()) return local // include the user's custom foods in the default browse list
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

  // Edit-in-place: when a logged entry is tapped, the sheet opens straight into
  // the quantity panel pre-filled with that entry.
  const editing = state.editing
  const editItem = editing ? state.meals[editing.meal].find((i) => i.uid === editing.uid) ?? null : null

  return (
    <>
      <div className={`backdrop ${state.sheetOpen ? 'on' : ''}`} onClick={close} />
      <div
        ref={sheetRef}
        className={`sheet ${state.sheetOpen ? 'on' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Add food"
        tabIndex={-1}
        aria-hidden={!state.sheetOpen}
      >
        <div className="grabber" />
        <div className="row-between" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{editItem ? 'Edit entry' : 'Add food'}</span>
          <button
            onClick={close}
            style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '6px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Done
          </button>
        </div>

        {editItem && editing ? (
          <QuantityPanel
            food={editItem}
            meal={editing.meal}
            initialQty={editItem.qty}
            editMode
            onBack={close}
            onAdd={(_food, qty) => {
              dispatch({ type: 'UPDATE_FOOD', meal: editing.meal, uid: editing.uid, qty })
              close()
            }}
            onRemove={() => {
              dispatch({ type: 'REMOVE_FOOD', meal: editing.meal, uid: editing.uid })
              close()
            }}
          />
        ) : building ? (
          <CustomFoodForm
            seedName={seedName}
            onBack={() => setBuilding(false)}
            onSave={(food) => {
              dispatch({ type: 'ADD_CUSTOM_FOOD', food })
              setBuilding(false)
              setQuery('')
              setSelected(food)
            }}
          />
        ) : selected ? (
          <QuantityPanel
            food={selected}
            meal={state.sheetMeal}
            onBack={() => setSelected(null)}
            onAdd={(food, qty) => {
              dispatch({ type: 'ADD_FOOD', meal: state.sheetMeal, food, qty })
              flash(`Added ${food.name}`)
              setSelected(null)
            }}
          />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
              {MEAL_ORDER.map((meal) => (
                <button key={meal} className={`mealchip ${state.sheetMeal === meal ? 'on' : ''}`} onClick={() => setMeal(meal)}>
                  {meal}
                </button>
              ))}
            </div>

            <div className="tiny" style={{ color: 'var(--text-2)', margin: '0 0 11px 2px' }}>
              {state.sheetMeal}: <b style={{ color: 'var(--text)', fontWeight: 600 }}>{mealKcal} kcal</b>
              {mealItems.length ? ` · ${itemCount(mealItems.length)}` : ' · tap items to add'}
            </div>

            <div style={{ position: 'relative', marginBottom: 11 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-3)' }} aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods"
                autoComplete="off"
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
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
              <button className="method method-soon" aria-label="Scan a barcode — coming soon" onClick={() => flash('Barcode scanning is coming soon')}>
                <i className="ti ti-barcode" style={{ fontSize: 19 }} aria-hidden="true" />
                Scan
                <span className="soon">Soon</span>
              </button>
              <button className="method method-soon" aria-label="Voice logging — coming soon" onClick={() => flash('Voice logging is coming soon')}>
                <i className="ti ti-microphone" style={{ fontSize: 19 }} aria-hidden="true" />
                Voice
                <span className="soon">Soon</span>
              </button>
              <button className="method" onClick={() => { setSeedName(''); setBuilding(true) }}>
                <i className="ti ti-pencil-plus" style={{ fontSize: 19 }} aria-hidden="true" />
                Custom
              </button>
            </div>

            <div className="eyebrow" style={{ marginBottom: 4 }}>
              {label}
            </div>

            <div>
              {results.length === 0 ? (
                searching ? (
                  <div className="muted" style={{ fontSize: 13, padding: '14px 4px' }}>Searching…</div>
                ) : (
                  <button className="primary" onClick={() => { setSeedName(query.trim()); setBuilding(true) }} style={{ marginTop: 6 }}>
                    + Create {query.trim() ? `“${query.trim()}”` : 'a custom food'}
                  </button>
                )
              ) : (
                results.map((food) => (
                  <div key={food.id} className="foodrow" onClick={() => setSelected(food)}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14 }}>{food.name}</div>
                      <div className="tiny" style={{ color: 'var(--text-3)' }}>
                        {food.portion} · {food.p}P {food.c}C {food.f}F
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{food.kcal} kcal</span>
                      <i className="ti ti-chevron-right" style={{ fontSize: 19, color: 'var(--accent)' }} aria-hidden="true" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
