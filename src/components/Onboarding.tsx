import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useStore } from '../store'
import { useAuth } from '../auth'
import { uploadAvatar } from '../lib/avatar'
import { AvatarCropper } from './AvatarCropper'
import { ACTIVITY_LEVELS, CALORIE_FLOOR, adaptiveMaintenance, dailyTarget, macroTargets, targetFloorApplied, tdee } from '../lib/nutrition'
import { fromKg, getWeightUnit, setWeightUnitPref, toKg, type WeightUnit } from '../lib/units'
import type { Goal, Profile } from '../types'

const GOALS: { key: Goal; label: string }[] = [
  { key: 'lose', label: 'Lose weight' },
  { key: 'maintain', label: 'Maintain' },
  { key: 'gain', label: 'Gain' },
]

function Field({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(() => String(value))
  return (
    <div>
      {label ? <label className="tiny" style={{ color: 'var(--text-3)', display: 'block', marginBottom: 4 }}>{label}</label> : null}
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          const n = parseFloat(raw)
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
        }}
        onBlur={() => setText(String(value))}
        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontSize: 15 }}
      />
    </div>
  )
}

export function Onboarding() {
  const { state, dispatch } = useStore()
  const { isCloud, user, signOut } = useAuth()
  const [goal, setGoal] = useState<Goal>(state.goal)
  const [rate, setRate] = useState(state.rate)
  const [profile, setProfile] = useState<Profile>(state.profile)
  const setP = (patch: Partial<Profile>) => setProfile((p) => ({ ...p, ...patch }))
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>(() => {
    try {
      return (localStorage.getItem('nourish.heightUnit') as 'cm' | 'ft') || 'cm'
    } catch {
      return 'cm'
    }
  })
  const chooseUnit = (u: 'cm' | 'ft') => {
    setHeightUnit(u)
    try {
      localStorage.setItem('nourish.heightUnit', u)
    } catch {
      /* ignore */
    }
  }
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(getWeightUnit)
  const chooseWeightUnit = (u: WeightUnit) => {
    setWeightUnit(u)
    setWeightUnitPref(u)
  }

  // Manual vs computed daily calorie target.
  const [targetMode, setTargetMode] = useState<'recommended' | 'custom'>(state.customTarget != null ? 'custom' : 'recommended')
  const [customTargetNum, setCustomTargetNum] = useState<number>(() => state.customTarget ?? dailyTarget(tdee(state.profile), state.goal, state.rate))
  const [customTouched, setCustomTouched] = useState(state.customTarget != null)

  // ft/in derived from the canonical heightCm
  const totalInches = profile.heightCm / 2.54
  let ftVal = Math.floor(totalInches / 12)
  let inVal = Math.round(totalInches - ftVal * 12)
  if (inVal === 12) {
    ftVal += 1
    inVal = 0
  }
  const setHeightFtIn = (ft: number, inch: number) => setP({ heightCm: Math.round((ft * 12 + inch) * 2.54) })
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)

  const username = (user?.user_metadata?.username as string | undefined) || ''
  const initials = (username || user?.email || '?').slice(0, 2).toUpperCase()

  // Pick a file -> open the cropper (don't upload yet). Reset the input so the
  // same file can be re-selected after cancelling.
  const onPickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user || uploadingAvatar) return
    setAvatarError('')
    setCropFile(file)
  }

  // The cropper returns a small square JPEG blob; upload that.
  const onCropped = async (blob: Blob) => {
    setCropFile(null)
    if (!user) return
    const cropped = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    setUploadingAvatar(true)
    try {
      const url = await uploadAvatar(user.id, cropped)
      dispatch({ type: 'SET_AVATAR', url })
    } catch {
      setAvatarError('Upload failed — please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const mifflin = tdee(profile)
  const adaptiveEst = adaptiveMaintenance(state.weighIns, state.history, mifflin)
  const useAdaptive = state.adaptiveTdee && adaptiveEst != null
  const maintenance = useAdaptive ? (adaptiveEst as number) : mifflin
  const recommended = dailyTarget(maintenance, goal, rate)
  const target = targetMode === 'custom' ? customTargetNum : recommended
  const macros = macroTargets(target, profile.weightKg, goal)
  const adjustment = Math.abs(recommended - maintenance)

  // Mirror the custom prefill to the live recommended value until the user
  // explicitly edits it, so opening Custom never shows a stale number that
  // disagrees with the recommendation just computed from their inputs.
  useEffect(() => {
    if (targetMode === 'recommended' && !customTouched) setCustomTargetNum(recommended)
  }, [recommended, targetMode, customTouched])

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
            disabled={uploadingAvatar}
            aria-label="Change profile photo"
            style={{
              position: 'relative',
              width: 84,
              height: 84,
              borderRadius: '50%',
              border: 'none',
              padding: 0,
              cursor: uploadingAvatar ? 'default' : 'pointer',
              opacity: uploadingAvatar ? 0.6 : 1,
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

      {cropFile && <AvatarCropper file={cropFile} onCancel={() => setCropFile(null)} onCropped={onCropped} />}

      <h1 className="h-title" style={{ fontSize: 22, marginBottom: 4 }}>
        Set your daily goal
      </h1>
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, margin: '0 0 16px' }}>
        {useAdaptive ? 'Based on your weight trend, you burn about ' : 'From your profile we estimate you burn about '}
        <b style={{ color: 'var(--text)' }}>{maintenance.toLocaleString()} kcal</b>/day.
      </p>

      {adaptiveEst != null && (
        <div className="strip" style={{ padding: '12px 14px', marginBottom: 18 }}>
          <div className="row-between">
            <span className="eyebrow">Maintenance estimate</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {([['profile', 'Profile'], ['adaptive', 'Adaptive']] as const).map(([k, lbl]) => {
                const on = (k === 'adaptive') === state.adaptiveTdee
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => dispatch({ type: 'SET_ADAPTIVE_TDEE', value: k === 'adaptive' })}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '0.5px solid var(--border)', background: on ? 'var(--accent)' : 'transparent', color: on ? '#fff' : 'var(--text-3)', cursor: 'pointer' }}
                  >
                    {lbl}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="tiny" style={{ color: 'var(--text-2)', marginTop: 8, lineHeight: 1.5 }}>
            From your weight trend vs. what you logged, your maintenance looks like about <b style={{ color: 'var(--text)' }}>{adaptiveEst.toLocaleString()} kcal</b> — vs. <b style={{ color: 'var(--text)' }}>{mifflin.toLocaleString()}</b> from your profile. The 1,200-kcal floor and weekly-pace cap still apply.
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '12px 14px', marginBottom: 18 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Your details</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['male', 'female'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setP({ sex: s })}
              style={{ flex: 1, padding: '9px 4px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--border)', background: profile.sex === s ? 'var(--accent)' : 'var(--surface)', color: profile.sex === s ? '#fff' : 'var(--text-2)', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
          <Field label="Age" value={profile.age} min={13} max={100} onChange={(v) => setP({ age: v })} />
          <div>
            <div className="row-between" style={{ marginBottom: 4 }}>
              <label className="tiny" style={{ color: 'var(--text-3)' }}>Weight</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['kg', 'lbs'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => chooseWeightUnit(u)}
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '0.5px solid var(--border)', background: weightUnit === u ? 'var(--accent)' : 'transparent', color: weightUnit === u ? '#fff' : 'var(--text-3)', cursor: 'pointer' }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <Field
              key={weightUnit}
              label=""
              value={fromKg(profile.weightKg, weightUnit, 0)}
              min={weightUnit === 'kg' ? 30 : 66}
              max={weightUnit === 'kg' ? 350 : 770}
              onChange={(v) => setP({ weightKg: toKg(v, weightUnit) })}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div className="row-between" style={{ marginBottom: 4 }}>
            <label className="tiny" style={{ color: 'var(--text-3)' }}>Height</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['cm', 'ft'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => chooseUnit(u)}
                  style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, border: '0.5px solid var(--border)', background: heightUnit === u ? 'var(--accent)' : 'transparent', color: heightUnit === u ? '#fff' : 'var(--text-3)', cursor: 'pointer' }}
                >
                  {u === 'cm' ? 'cm' : 'ft / in'}
                </button>
              ))}
            </div>
          </div>
          {heightUnit === 'cm' ? (
            <Field label="" value={profile.heightCm} min={120} max={230} onChange={(v) => setP({ heightCm: v })} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
              <Field label="Feet" value={ftVal} min={3} max={8} onChange={(v) => setHeightFtIn(v, inVal)} />
              <Field label="Inches" value={inVal} min={0} max={11} onChange={(v) => setHeightFtIn(ftVal, v)} />
            </div>
          )}
        </div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>Activity</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ACTIVITY_LEVELS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setP({ activity: a.value })}
              style={{ padding: '7px 11px', borderRadius: 999, border: '0.5px solid var(--border)', background: profile.activity === a.value ? 'var(--accent)' : 'transparent', color: profile.activity === a.value ? '#fff' : 'var(--text-2)', fontSize: 12, cursor: 'pointer' }}
            >
              {a.label}
            </button>
          ))}
        </div>
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

      <div className="row-between" style={{ marginBottom: 10 }}>
        <span className="eyebrow">Daily target</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['recommended', 'custom'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTargetMode(m)}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '0.5px solid var(--border)', background: targetMode === m ? 'var(--accent)' : 'transparent', color: targetMode === m ? '#fff' : 'var(--text-3)', cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {targetMode === 'recommended' && goal !== 'maintain' && (
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

      {targetMode === 'recommended' && targetFloorApplied(maintenance, goal, rate) && (
        <div className="strip" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '10px 12px', marginBottom: 14, fontSize: 12, lineHeight: 1.5, color: 'var(--text-2)' }}>
          <i className="ti ti-shield-check" style={{ fontSize: 16, color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>
            We've held your target at the safe minimum of <b style={{ color: 'var(--text)' }}>{CALORIE_FLOOR.toLocaleString()} kcal</b>. A faster pace won't lower it further — eating less than this isn't recommended.
          </span>
        </div>
      )}

      {targetMode === 'custom' && (
        <div style={{ marginBottom: 18 }}>
          <Field
            label="Target calories (kcal)"
            value={customTargetNum}
            min={1000}
            max={8000}
            onChange={(v) => {
              setCustomTouched(true)
              setCustomTargetNum(v)
            }}
          />
          <div className="tiny" style={{ color: 'var(--text-2)', marginTop: 6 }}>
            Recommended for you: {recommended.toLocaleString()} kcal/day
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

      <button className="primary" onClick={() => dispatch({ type: 'FINISH_ONBOARDING', profile, goal, rate, customTarget: targetMode === 'custom' ? customTargetNum : null })}>
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
