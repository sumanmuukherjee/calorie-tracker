import { useStore } from './store'
import { useAuth } from './auth'
import { Today } from './components/Today'
import { Trends } from './components/Trends'
import { Onboarding } from './components/Onboarding'
import { PhotoLog } from './components/PhotoLog'
import { AddSheet } from './components/AddSheet'
import { BottomNav } from './components/BottomNav'
import { Auth } from './components/Auth'

function Splash({ label }: { label: string }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        color: 'var(--text-2)',
      }}
    >
      <svg viewBox="0 0 50 50" width={40} height={40} aria-hidden="true" style={{ animation: 'spin 0.9s linear infinite' }}>
        <circle cx={25} cy={25} r={20} fill="none" stroke="var(--surface-2)" strokeWidth={5} />
        <circle cx={25} cy={25} r={20} fill="none" stroke="var(--accent)" strokeWidth={5} strokeLinecap="round" strokeDasharray="31 126" />
      </svg>
      <span style={{ fontSize: 14 }}>{label}</span>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  )
}

export function App() {
  const { isCloud, loading, session } = useAuth()
  const { state } = useStore()

  if (loading) return <Splash label="Starting up…" />
  if (isCloud && !session) return <Auth />
  if (isCloud && state.hydrating) return <Splash label="Loading your diary…" />

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
