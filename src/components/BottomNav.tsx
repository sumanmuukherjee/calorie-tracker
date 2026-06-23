import { useStore } from '../store'
import type { Screen } from '../types'

export function BottomNav() {
  const { state, dispatch } = useStore()
  const go = (screen: Screen) => dispatch({ type: 'SET_SCREEN', screen })
  const item = (screen: Screen, icon: string, label: string) => (
    <button className={`navitem ${state.screen === screen ? 'on' : ''}`} onClick={() => go(screen)}>
      <i className={`ti ${icon}`} style={{ fontSize: 22 }} aria-hidden="true" />
      {label}
    </button>
  )

  return (
    <nav className="bottomnav">
      {item('today', 'ti-home', 'Today')}
      {item('trends', 'ti-chart-line', 'Trends')}
      <button className="fab" aria-label="Add food" onClick={() => dispatch({ type: 'OPEN_SHEET', meal: state.sheetMeal })}>
        <i className="ti ti-plus" style={{ fontSize: 28 }} aria-hidden="true" />
      </button>
      <button className={`navitem ${state.screen === 'photo' ? 'on' : ''}`} onClick={() => go('photo')}>
        <i className="ti ti-camera" style={{ fontSize: 22 }} aria-hidden="true" />
        Snap
      </button>
      <button className="navitem" onClick={() => go('onboarding')}>
        <i className="ti ti-user" style={{ fontSize: 22 }} aria-hidden="true" />
        Goal
      </button>
    </nav>
  )
}
