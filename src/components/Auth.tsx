import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useAuth } from '../auth'

export function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!email || password.length < 6) {
      setError('Enter an email and a password of at least 6 characters.')
      return
    }
    setBusy(true)
    const res = mode === 'in' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (res.error) {
      setError(res.error)
      return
    }
    if (mode === 'up' && res.needsConfirm) {
      setInfo('Check your inbox to confirm your email, then sign in.')
      setMode('in')
    }
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '24px 22px',
        maxWidth: 440,
        margin: '0 auto',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'var(--accent)',
            margin: '0 auto 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg viewBox="0 0 100 100" width={42} height={42} aria-hidden="true">
            <circle cx={50} cy={50} r={32} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={11} />
            <circle
              cx={50}
              cy={50}
              r={32}
              fill="none"
              stroke="#fff"
              strokeWidth={11}
              strokeLinecap="round"
              strokeDasharray={201}
              strokeDashoffset={55}
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 4px' }}>Nourish</h1>
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          {mode === 'in' ? 'Welcome back. Sign in to your diary.' : 'Create an account to save your progress.'}
        </p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: '18px 16px' }}>
        <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          style={inputStyle}
        />

        <label className="eyebrow" style={{ display: 'block', margin: '14px 0 6px' }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
          placeholder="At least 6 characters"
          style={inputStyle}
        />

        {error && (
          <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</div>
        )}
        {info && (
          <div style={{ color: 'var(--accent)', fontSize: 13, marginTop: 12 }}>{info}</div>
        )}

        <button type="submit" className="primary" disabled={busy} style={{ marginTop: 18, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        onClick={() => {
          setMode(mode === 'in' ? 'up' : 'in')
          setError('')
          setInfo('')
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-2)',
          fontSize: 13,
          marginTop: 16,
          cursor: 'pointer',
        }}
      >
        {mode === 'in' ? "New here? Create an account" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '0.5px solid var(--border-2)',
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
}
