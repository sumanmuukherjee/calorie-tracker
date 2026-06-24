import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useAuth } from '../auth'
import { passwordError, usernameError } from '../lib/validate'

type Mode = 'in' | 'up' | 'forgot'

export function Auth({ initialMode = 'in', onBack }: { initialMode?: 'in' | 'up'; onBack?: () => void } = {}) {
  const { signIn, signUp, resetPassword, checkUsername } = useAuth()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const switchMode = (m: Mode) => {
    setMode(m)
    setError('')
    setInfo('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (mode === 'forgot') {
      if (!email) return setError('Enter your email.')
      setBusy(true)
      const res = await resetPassword(email)
      setBusy(false)
      if (res.error) return setError(res.error)
      setInfo('If that email has an account, a reset link is on its way. Check your inbox.')
      return
    }

    if (!email) return setError('Enter your email.')
    if (mode === 'up') {
      const ue = usernameError(username)
      if (ue) return setError(ue)
    }
    const pe = passwordError(password)
    if (pe) return setError(pe)

    setBusy(true)
    if (mode === 'up') {
      const available = await checkUsername(username.trim())
      if (!available) {
        setBusy(false)
        return setError('That username is already taken.')
      }
    }
    const res = mode === 'in' ? await signIn(email, password) : await signUp(email, password, username.trim())
    setBusy(false)
    if (res.error) return setError(res.error)
    if (mode === 'up' && res.needsConfirm) {
      setInfo('Check your inbox to confirm your email, then sign in.')
      setMode('in')
    }
  }

  const subtitle =
    mode === 'in'
      ? 'Welcome back. Sign in to your diary.'
      : mode === 'up'
        ? 'Create an account to save your progress.'
        : 'Enter your email and we’ll send a reset link.'

  const buttonLabel = busy
    ? 'Working…'
    : mode === 'in'
      ? 'Sign in'
      : mode === 'up'
        ? 'Create account'
        : 'Send reset link'

  return (
    <div style={wrap}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 14, cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}
        >
          <i className="ti ti-chevron-left" style={{ fontSize: 18 }} aria-hidden="true" /> Back
        </button>
      )}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={logo}>
          <svg viewBox="0 0 100 100" width={42} height={42} aria-hidden="true">
            <circle cx={50} cy={50} r={32} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={11} />
            <circle cx={50} cy={50} r={32} fill="none" stroke="#fff" strokeWidth={11} strokeLinecap="round" strokeDasharray={201} strokeDashoffset={55} transform="rotate(-90 50 50)" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 4px' }}>Nourish</h1>
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>{subtitle}</p>
      </div>

      <form onSubmit={submit} className="card" style={{ padding: '18px 16px' }}>
        {mode === 'up' && (
          <>
            <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="3–30 chars, letters & numbers" style={{ ...inputStyle, marginBottom: 14 }} />
          </>
        )}

        <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" style={inputStyle} />

        {mode !== 'forgot' && (
          <>
            <label className="eyebrow" style={{ display: 'block', margin: '14px 0 6px' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} placeholder={mode === 'up' ? '8+ chars, 1 letter & 1 number' : 'Your password'} style={inputStyle} />
          </>
        )}

        {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</div>}
        {info && <div style={{ color: 'var(--accent)', fontSize: 13, marginTop: 12 }}>{info}</div>}

        <button type="submit" className="primary" disabled={busy} style={{ marginTop: 18, opacity: busy ? 0.6 : 1 }}>
          {buttonLabel}
        </button>

        {mode === 'in' && (
          <button type="button" onClick={() => switchMode('forgot')} style={linkBtn}>
            Forgot password?
          </button>
        )}
      </form>

      <button
        onClick={() => switchMode(mode === 'in' ? 'up' : 'in')}
        style={{ background: 'none', border: 'none', color: 'var(--text-2)', fontSize: 13, marginTop: 16, cursor: 'pointer' }}
      >
        {mode === 'up' ? 'Already have an account? Sign in' : mode === 'forgot' ? 'Back to sign in' : 'New here? Create an account'}
      </button>
    </div>
  )
}

const wrap: CSSProperties = {
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '24px 22px',
  maxWidth: 440,
  margin: '0 auto',
}
const logo: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 18,
  background: 'var(--accent)',
  margin: '0 auto 14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
const linkBtn: CSSProperties = {
  width: '100%',
  background: 'none',
  border: 'none',
  color: 'var(--text-2)',
  fontSize: 13,
  marginTop: 12,
  cursor: 'pointer',
}
