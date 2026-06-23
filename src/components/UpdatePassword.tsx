import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { useAuth } from '../auth'
import { passwordError } from '../lib/validate'

export function UpdatePassword() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const pe = passwordError(password)
    if (pe) return setError(pe)
    if (password !== confirm) return setError('Passwords don’t match.')
    setBusy(true)
    const res = await updatePassword(password)
    setBusy(false)
    if (res.error) return setError(res.error)
    setDone(true)
  }

  return (
    <div style={wrap}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Choose a new password</h1>
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
          {done ? 'All set — your password has been updated.' : 'You followed a reset link. Set a new password below.'}
        </p>
      </div>

      {!done && (
        <form onSubmit={submit} className="card" style={{ padding: '18px 16px' }}>
          <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 6 characters" style={inputStyle} />

          <label className="eyebrow" style={{ display: 'block', margin: '14px 0 6px' }}>Confirm password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="Re-enter it" style={inputStyle} />

          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12 }}>{error}</div>}

          <button type="submit" className="primary" disabled={busy} style={{ marginTop: 18, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>
      )}
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
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '0.5px solid var(--border-2)',
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
}
