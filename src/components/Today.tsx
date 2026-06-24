import { useStore, useTotals } from '../store'
import { useAuth } from '../auth'
import { MEAL_ORDER } from '../types'
import type { LoggedFood, MealName } from '../types'
import { CalorieRing } from './CalorieRing'
import { MacroBars } from './MacroBars'

const MEAL_ICONS: Record<MealName, string> = {
  Breakfast: 'ti-coffee',
  Lunch: 'ti-salad',
  Dinner: 'ti-meat',
  Snacks: 'ti-apple',
}

function amountLabel(item: LoggedFood): string {
  if (item.portion === 'per 100 g') return `${Math.round(item.qty * 100)} g`
  return item.qty === 1 ? item.portion : `${item.qty} × ${item.portion}`
}

function timeLabel(ts?: number): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function Today() {
  const { state, dispatch } = useStore()
  const { isCloud, signOut } = useAuth()
  const totals = useTotals()

  return (
    <div className="fade-in">
      <div className="screen-pad">
        <div className="row-between" style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className="ti ti-chevron-left" style={{ fontSize: 20, color: 'var(--text-3)' }} aria-hidden="true" />
            <span style={{ fontSize: 16, fontWeight: 600 }}>Today</span>
            <i className="ti ti-chevron-right" style={{ fontSize: 20, color: 'var(--text-3)' }} aria-hidden="true" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--warn)', fontWeight: 600, fontSize: 14 }}>
              <i className="ti ti-flame" style={{ fontSize: 18 }} aria-hidden="true" />
              12
            </span>
            {isCloud && (
              <i
                className="ti ti-logout"
                role="button"
                aria-label="Sign out"
                onClick={() => signOut()}
                style={{ fontSize: 19, color: 'var(--text-3)', cursor: 'pointer' }}
              />
            )}
          </div>
        </div>

        <CalorieRing target={totals.target} exercise={state.exercise} eaten={totals.eaten} remaining={totals.remaining} />

        <div
          className="strip"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, color: 'var(--text-2)', margin: '8px 0 14px' }}
        >
          <span>
            <b style={{ color: 'var(--text)' }}>{totals.target.toLocaleString()}</b> goal
          </span>
          <span style={{ color: 'var(--text-3)' }}>−</span>
          <span>
            <b style={{ color: 'var(--text)' }}>{totals.eaten.toLocaleString()}</b> food
          </span>
          <span style={{ color: 'var(--text-3)' }}>+</span>
          <span>
            <b style={{ color: 'var(--text)' }}>{state.exercise}</b> exercise
          </span>
        </div>

        <MacroBars macros={totals.macros} goals={totals.macroGoals} />

        <div className="eyebrow" style={{ margin: '16px 2px 8px' }}>
          Meals
        </div>

        {MEAL_ORDER.map((meal) => {
          const items = state.meals[meal]
          const subtotal = items.reduce((a, i) => a + i.kcal * i.qty, 0)
          return (
            <div className="card" key={meal} style={{ marginBottom: 10 }}>
              <div className="row-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'var(--surface)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-2)',
                      flexShrink: 0,
                    }}
                  >
                    <i className={`ti ${MEAL_ICONS[meal]}`} style={{ fontSize: 18 }} aria-hidden="true" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{meal}</div>
                    <div className="tiny" style={{ color: 'var(--text-3)' }}>
                      {items.length ? `${items.length} items` : 'Nothing logged yet'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{Math.round(subtotal)}</span>
                  <button className="iconbtn" style={{ width: 30, height: 30 }} aria-label={`Add to ${meal}`} onClick={() => dispatch({ type: 'OPEN_SHEET', meal })}>
                    <i className="ti ti-plus" style={{ fontSize: 17 }} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {items.map((item) => (
                <div
                  key={item.uid}
                  className="row-between"
                  style={{ padding: '7px 2px', borderTop: '0.5px solid var(--border)' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}>{item.name}</div>
                    <div className="tiny" style={{ color: 'var(--text-3)' }}>
                      {amountLabel(item)}
                      {item.loggedAt ? ` · ${timeLabel(item.loggedAt)}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{Math.round(item.kcal * item.qty)}</span>
                    <i
                      className="ti ti-x"
                      style={{ fontSize: 15, color: 'var(--text-3)', cursor: 'pointer' }}
                      role="button"
                      aria-label="Remove"
                      onClick={() => dispatch({ type: 'REMOVE_FOOD', meal, uid: item.uid })}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
