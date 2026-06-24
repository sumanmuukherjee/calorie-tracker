import { useState } from 'react'
import { useStore } from './store'
import { useAuth } from './auth'
import { Today } from './components/Today'
import { Trends } from './components/Trends'
import { Onboarding } from './components/Onboarding'
import { PhotoLog } from './components/PhotoLog'
import { AddSheet } from './components/AddSheet'
import { BottomNav } from './components/BottomNav'
import { Auth } from './components/Auth'
import { Landing } from './components/Landing'
import { UpdatePassword } from './components/UpdatePassword'

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

// Signed-out cloud visitors see the marketing landing page first; its CTAs
// drop them into the auth form in the right mode, with a way back.
function Welcome() {
  const [view, setView] = useState<{ kind: 'landing' } | { kind: 'auth'; mode: 'in' | 'up' }>({ kind: 'landing' })
  if (view.kind === 'auth') {
    return <Auth initialMode={view.mode} onBack={() => setView({ kind: 'landing' })} />
  }
  return (
    <Landing
      onCreate={() => setView({ kind: 'auth', mode: 'up' })}
      onSignIn={() => setView({ kind: 'auth', mode: 'in' })}
    />
  )
}

export function App() {
  const { isCloud, loading, session, recovery } = useAuth()
  const { state } = useStore()

  if (loading) return <Splash label="Starting up…" />
  if (isCloud && recovery) return <UpdatePassword />
  if (isCloud && !session) return <Welcome />
  if (isCloud && state.hydrating) return <Splash label="Loading your diary…" />

  // Keep the bottom nav (incl. the Today/home button) on every screen except
  // genuine first-time onboarding, so an onboarded user editing their Goal can
  // always get back to their dashboard in one tap.
  const showChrome = state.screen !== 'onboarding' || state.onboarded

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
