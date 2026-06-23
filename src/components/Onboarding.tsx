import { useRef, useState, type ChangeEvent } from 'react'
import { useStore } from '../store'
import { useAuth } from '../auth'
import { uploadAvatar } from '../lib/avatar'
import { dailyTarget, macroTargets, tdee } from '../lib/nutrition'
import type { Goal } from '../types'

const GOALS: { key: Goal; label: string }[] = [
  { key: 'lose', label: 'Lose weight' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'gain', label: 'Gain' },
]

export function Onboarding() {
  const { state, dispatch } = useStore()
  const { isCloud, user, signOut } = useAuth()
  const [goal, setGoal] = useState<Goal>(state.goal)
  const [rate, setRate] = useState(state.rate)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const username = (user?.user_metadata?.username as string | undefined) || ''
  const initials = (username || user?.email || '?').slice(0, 2).toUpperCase()

  const onPickAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarError('')
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(user.id, file)
      dispatch({ type: 'SET_AVATAR', url })
    } catch {
      setAvatarError('Upload failed — try a smaller image.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const maintenance = tdee(state.profile)
  const target = dailyTarget(maintenance, goal, rate)
  const macros = macroTargets(target, state.profile.weightKg, goal)
  const adjustment = Math.abs(target - maintenance)
  const lbsNow = Math.round(state.profile.weightKg * 2.2046)

  return (
    <div className="fade-in screen-pad" style={{ paddingTop: 18 }}>
      <div className="row-between" style={{ marginBottom: 18 }}>
        <button className="iconbtn" aria-label="Back" onClick={() => dispatch({ type: 'SET_SCREEN', screen: state.onboarded ? 'today' : 'onboarding' })}>
          <i className="ti ti-chevron-left" style={{ fontSize: 20 }} aria-hidden="true" />
        </button>
        <span className="tiny muted">{state.onboarded ? 'Edit goal' : 'Step 3 of 4'}</span>
      </div>

      {isCloud && user && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Change profile photo"
            style={{
              position: 'relative',
              width: 84,
              height: 84,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: 'var(--surface-2)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {state.avatarUrl ? (
              <img src={state.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 28, fontWeight: 600, color: 'var(--text-2)' }}>{initials}</span>
            )}
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg)',
              }}
            >
              <i className="ti ti-camera" style={{ fontSize: 14 }} />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickAvatar} style={{ display: 'none' }} />
          {username && <div style={{ fontSize: 16, fontWeight: 600, marginTop: 10 }}>{username}</div>}
          {uploadingAvatar && <div className="tiny muted" style={{ marginTop: 4 }}>Uploading…</div>}
          {avatarError && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>{avatarError}</div>}
        </div>
      )}

      <h1 className="h-title" style={{ fontSize: 22, marginBottom: 4 }}>
        Set your daily goal
      </h1>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: '0 0 16px' }}>
        From your profile we estimate you burn about <b style={{ color: 'var(--text)' }}>{maintenance.toLocaleString()} kcal</b>/day.
      </p>

      <div className="strip row-between" style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 18 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-user" style={{ fontSize: 15 }} aria-hidden="true" />
          Male · 32 · 5'10" · {lbsNow} lb · Moderate
        </span>
        <i className="ti ti-pencil" style={{ fontSize: 14, color: 'var(--text-3)' }} aria-label="Edit profile" />
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>I want to</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {GOALS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGoal(g.key)}
            style={{
              flex: 1,
              padding: '11px 4px',
              borderRadius: 'var(--radius-sm)',
              border: '0.5px solid var(--border)',
              background: goal === g.key ? 'var(--accent)' : 'var(--surface)',
              color: goal === g.key ? '#fff' : 'var(--text-2)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {goal !== 'maintain' && (
        <div style={{ marginBottom: 18 }}>
          <div className="row-between" style={{ marginBottom: 8 }}>
            <span className="eyebrow">Weekly pace</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{rate} kg / week</span>
          </div>
          <input type="range" min={0.25} max={1} step={0.25} value={rate} onChange={(e) => setRate(parseFloat(e.target.value))} style={{ width: '100%' }} />
          <div className="tiny" style={{ color: 'var(--text-2)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="ti ti-flame" style={{ fontSize: 13 }} aria-hidden="true" />
            about {adjustment.toLocaleString()} kcal/day {goal === 'lose' ? 'below' : 'above'} maintenance
          </div>
        </div>
      )}

      <div className="strip" style={{ textAlign: 'center', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 14 }}>
        <div className="muted" style={{ fontSize: 12 }}>Your daily target</div>
        <div style={{ fontSize: 38, fontWeight: 600, color: 'var(--accent)', lineHeight: 1.1 }}>
          {target.toLocaleString()} <span className="muted" style={{ fontSize: 15 }}>kcal</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border)', fontSize: 12 }}>
          <span><b style={{ color: 'var(--blue)' }}>{macros.protein}</b><span className="muted"> P</span></span>
          <span><b style={{ color: 'var(--amber)' }}>{macros.carbs}</b><span className="muted"> C</span></span>
          <span><b style={{ color: 'var(--coral)' }}>{macros.fat}</b><span className="muted"> F</span></span>
        </div>
      </div>

      <button className="primary" onClick={() => dispatch({ type: 'FINISH_ONBOARDING', profile: state.profile, goal, rate })}>
        {state.onboarded ? 'Save goal' : 'Start tracking'}
      </button>

      {isCloud && user && (
        <div
          className="row-between"
          style={{ marginTop: 18, paddingTop: 14, borderTop: '0.5px solid var(--border)' }}
        >
          <span className="tiny muted" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Signed in as {user.email}
          </span>
          <button
            onClick={() => signOut()}
            style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
