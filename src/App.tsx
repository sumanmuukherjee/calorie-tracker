import { useStore } from './store'
import { Today } from './components/Today'
import { Trends } from './components/Trends'
import { Onboarding } from './components/Onboarding'
import { PhotoLog } from './components/PhotoLog'
import { AddSheet } from './components/AddSheet'
import { BottomNav } from './components/BottomNav'

export function App() {
  const { state } = useStore()
  const showChrome = state.screen !== 'onboarding'

  return (
    <div className="app">
      {state.screen === 'onboarding' && <Onboarding />}
      {state.screen === 'today' && <Today />}
      {state.screen === 'trends' && <Trends />}
      {state.screen === 'photo' && <PhotoLog />}

      {showChrome && (
        <>
          <AddSheet />
          <BottomNav />
        </>
      )}
    </div>
  )
}
