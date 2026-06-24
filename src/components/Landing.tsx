import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

// Marketing landing page shown to signed-out cloud visitors. It renders
// outside the 440px app shell so it can fill desktop, and funnels every
// call-to-action into the auth form (create account / sign in).

function Wordmark() {
  return (
    <div className="lp-brand">
      <span className="lp-brand-mark" aria-hidden="true">
        <svg viewBox="0 0 100 100" width={20} height={20}>
          <circle cx={50} cy={50} r={34} fill="none" stroke="#fff" strokeOpacity={0.35} strokeWidth={12} />
          <circle cx={50} cy={50} r={34} fill="none" stroke="#fff" strokeWidth={12} strokeLinecap="round" strokeDasharray={214} strokeDashoffset={70} transform="rotate(-90 50 50)" />
        </svg>
      </span>
      <span className="lp-brand-name">Nourish</span>
    </div>
  )
}

function Ring({ size = 150, remaining = 980, pct = 0.55 }: { size?: number; remaining?: number; pct?: number }) {
  const r = 56
  const c = 2 * Math.PI * r
  const off = c * (1 - pct)
  return (
    <svg viewBox="0 0 140 140" width={size} height={size} aria-hidden="true">
      <circle cx={70} cy={70} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={12} />
      <circle cx={70} cy={70} r={r} fill="none" stroke="var(--accent)" strokeWidth={12} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 70 70)" />
      <text x={70} y={66} textAnchor="middle" fontSize={30} fontWeight={700} fill="var(--text)">{remaining.toLocaleString()}</text>
      <text x={70} y={86} textAnchor="middle" fontSize={12} fill="var(--text-3)">remaining</text>
    </svg>
  )
}

function MacroBar({ label, value, goal, pct, color }: { label: string; value: string; goal: string; pct: number; color: string }) {
  return (
    <div className="lp-macro">
      <div className="lp-macro-head">
        <span>{label}</span>
        <span className="lp-macro-val"><b style={{ color: 'var(--text)' }}>{value}</b> / {goal}</span>
      </div>
      <div className="lp-macro-track">
        <div className="lp-macro-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function PhoneMock() {
  return (
    <div className="lp-phone" aria-hidden="true">
      <div className="lp-phone-notch" />
      <div className="lp-phone-screen">
        <div className="lp-mock-top">
          <i className="ti ti-chevron-left" />
          <span>Today</span>
          <i className="ti ti-chevron-right" />
        </div>
        <div className="lp-mock-ring">
          <Ring />
          <div className="lp-mock-eq">
            <span><b>2,100</b> goal</span>
            <span className="lp-dim">−</span>
            <span><b>1,340</b> food</span>
            <span className="lp-dim">+</span>
            <span><b>220</b> exercise</span>
          </div>
        </div>
        <div className="lp-mock-macros">
          <MacroBar label="Protein" value="96" goal="150g" pct={64} color="var(--accent)" />
          <MacroBar label="Carbs" value="142" goal="210g" pct={68} color="var(--blue)" />
          <MacroBar label="Fat" value="38" goal="65g" pct={58} color="var(--coral)" />
        </div>
        <div className="lp-mock-card">
          <div className="lp-mock-row">
            <span className="lp-thumb"><i className="ti ti-camera" /></span>
            <div className="lp-mock-rowtext">
              <span className="lp-mock-name">Grilled chicken bowl</span>
              <span className="lp-mock-sub">1.5 servings · 8:12 PM</span>
            </div>
            <span className="lp-mock-cal">540</span>
          </div>
        </div>
      </div>
      <span className="lp-phone-fab"><i className="ti ti-camera" /></span>
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="lp-bullets">
      {items.map((b) => (
        <li key={b}>
          <i className="ti ti-check" aria-hidden="true" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  )
}

// ---- per-section sample visuals (pure UI, no real claims) ----

function VisualFastLogging() {
  return (
    <div className="lp-vcard" aria-hidden="true">
      <div className="lp-recents">
        {['Oatmeal', 'Chicken bowl', 'Latte', 'Banana'].map((r) => (
          <span key={r} className="lp-recent-chip">{r}</span>
        ))}
      </div>
      <div className="lp-vrow">
        <span className="lp-thumb lp-thumb-sm"><i className="ti ti-photo" /></span>
        <div className="lp-mock-rowtext">
          <span className="lp-mock-name">Detected: salmon, rice, broccoli</span>
          <span className="lp-mock-sub">1:04 PM</span>
        </div>
        <span className="lp-mock-cal">610</span>
      </div>
      <div className="lp-vsearch">
        <i className="ti ti-search" />
        <span>chicke<span className="lp-caret" /></span>
      </div>
      {[
        { n: 'Chicken breast, grilled', k: 165 },
        { n: 'Chicken thigh, roasted', k: 209 },
        { n: 'Chicken bowl, brown rice', k: 540 },
      ].map((o, i) => (
        <div key={o.n} className={`lp-vresult${i === 0 ? ' on' : ''}`}>
          <span>{o.n}</span>
          <span className="lp-mock-cal">{o.k}</span>
        </div>
      ))}
    </div>
  )
}

function VisualQuantity() {
  return (
    <div className="lp-vcard" aria-hidden="true">
      <div className="lp-q-name">Cooked white rice</div>
      <div className="lp-q-stepper">
        <span className="lp-q-btn">−</span>
        <span className="lp-q-amount">1.5</span>
        <span className="lp-q-btn">+</span>
        <div className="lp-q-units">
          {['cups', 'g', 'serving'].map((u, i) => (
            <span key={u} className={`lp-q-unit${i === 0 ? ' on' : ''}`}>{u}</span>
          ))}
        </div>
      </div>
      <div className="lp-q-stats">
        <div className="lp-q-stat on">
          <span className="lp-q-statlabel">Calories</span>
          <span className="lp-q-statval">308</span>
          <span className="lp-q-was">205</span>
        </div>
        <div className="lp-q-stat"><span className="lp-q-statlabel">Protein</span><span className="lp-q-statval">6g</span></div>
        <div className="lp-q-stat"><span className="lp-q-statlabel">Carbs</span><span className="lp-q-statval">67g</span></div>
        <div className="lp-q-stat"><span className="lp-q-statlabel">Fat</span><span className="lp-q-statval">1g</span></div>
      </div>
    </div>
  )
}

function VisualTargets() {
  return (
    <div className="lp-vcard" aria-hidden="true">
      <div className="lp-flow">
        <div className="lp-flow-strip"><span>BMR</span><b>1,610</b></div>
        <i className="ti ti-arrow-down lp-flow-arrow" />
        <div className="lp-flow-strip"><span>+ Activity ×1.55</span><b>2,495</b></div>
        <i className="ti ti-arrow-down lp-flow-arrow" />
        <div className="lp-flow-strip"><span>− Goal (lose)</span><b>−395</b></div>
      </div>
      <div className="lp-target">
        <span className="lp-target-label">Daily target</span>
        <span className="lp-target-num">2,100 cal</span>
        <div className="lp-target-pills">
          <span className="lp-pill-soft">P 150g</span>
          <span className="lp-pill-soft">C 210g</span>
          <span className="lp-pill-soft">F 65g</span>
        </div>
        <span className="lp-target-cap">Based on your stats, goal, and activity.</span>
      </div>
    </div>
  )
}

function VisualTrends() {
  // Two small inline SVG charts: calories vs dashed target, and weight trending down.
  const cal = [78, 52, 64, 40, 58, 34, 46]
  // y grows downward in SVG, so increasing values = a downward (weight-loss) line
  const w = [30, 35, 33, 42, 46, 52, 57]
  const x = (i: number, n: number) => 8 + (i * (224 / (n - 1)))
  const calPts = cal.map((v, i) => `${x(i, cal.length)},${v}`).join(' ')
  const wPts = w.map((v, i) => `${x(i, w.length)},${v}`).join(' ')
  return (
    <div className="lp-vcard" aria-hidden="true">
      <div className="lp-chart-head">
        <span className="lp-eyebrow">Calories vs target</span>
        <span className="lp-streak"><i className="ti ti-flame" /> 12-day streak</span>
      </div>
      <svg viewBox="0 0 240 92" className="lp-chart" preserveAspectRatio="none">
        <line x1={8} y1={46} x2={232} y2={46} stroke="var(--text-3)" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
        <polyline points={calPts} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {cal.map((v, i) => <circle key={i} cx={x(i, cal.length)} cy={v} r={2.4} fill="var(--accent)" />)}
      </svg>
      <div className="lp-chart-head" style={{ marginTop: 14 }}>
        <span className="lp-eyebrow">Weight</span>
        <span className="lp-deficit">avg deficit −340 cal/day</span>
      </div>
      <svg viewBox="0 0 240 70" className="lp-chart" preserveAspectRatio="none">
        <polyline points={wPts} fill="none" stroke="var(--blue)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {w.map((v, i) => <circle key={i} cx={x(i, w.length)} cy={v} r={2.4} fill="var(--blue)" />)}
      </svg>
    </div>
  )
}

function VisualPwa() {
  const rows = [
    { icon: 'ti-tag', t: 'Free, no ads' },
    { icon: 'ti-lock', t: 'Private, per-user sync' },
    { icon: 'ti-device-mobile-down', t: 'Add to home screen — works offline' },
  ]
  return (
    <div className="lp-vcard lp-pwa" aria-hidden="true">
      {rows.map((r) => (
        <div key={r.t} className="lp-pwa-row">
          <span className="lp-pwa-icon"><i className={`ti ${r.icon}`} /></span>
          <span>{r.t}</span>
        </div>
      ))}
    </div>
  )
}

const VISUALS: Record<string, ReactNode> = {
  'fast-logging': <VisualFastLogging />,
  'quantity-math': <VisualQuantity />,
  'personal-targets': <VisualTargets />,
  trends: <VisualTrends />,
  'free-private-pwa': <VisualPwa />,
}

interface Section {
  id: string
  eyebrow: string
  title: string
  body: string
  bullets: string[]
}

const SECTIONS: Section[] = [
  {
    id: 'fast-logging',
    eyebrow: "Logging you'll keep up with",
    title: 'Log a meal in seconds, not minutes',
    body: 'Snap a photo of your plate and Nourish logs it for you, or search 2 million foods from the USDA database and tap a recent. Every entry is timestamped automatically, so your day builds itself while you eat.',
    bullets: ['AI photo logging: snap your meal to log it', '2 million foods to search, plus one-tap recents', 'Real USDA nutrition data, not crowd-typed guesses', 'Automatic timestamps on everything you log'],
  },
  {
    id: 'quantity-math',
    eyebrow: 'Portions that match real life',
    title: 'Type the amount. Watch it recalculate.',
    body: "Enter grams or servings — “1.5 cups”, “200 g”, “2 eggs” — and calories, protein, carbs and fat scale live as you type. No mental math, no rounding a cup down to make the entry easier.",
    bullets: ['Grams or servings, whichever you measure in', 'Calories and all three macros update instantly', 'Edit the amount later and everything re-scales'],
  },
  {
    id: 'personal-targets',
    eyebrow: 'A target built for your body',
    title: 'Your number, calculated — not guessed',
    body: 'Nourish runs the Mifflin-St Jeor equation on your stats to estimate your BMR, factors in your activity for your TDEE, then adjusts for whether you want to lose, maintain, or gain. You see exactly where your goals come from.',
    bullets: ['Mifflin-St Jeor BMR → TDEE, the method dietitians use', 'Goal-aware: lose, maintain, or gain', 'A personal macro split, not a generic ratio'],
  },
  {
    id: 'trends',
    eyebrow: "Proof you're moving",
    title: 'Watch the trend, not just today',
    body: "One good day doesn't change the scale — a streak of them does. Nourish charts your calorie history and weigh-ins, counts your logging streak, and shows your average intake and deficit, all from the data you actually logged.",
    bullets: ['Calorie history chart + weight tracking chart', 'Logging streaks to keep the habit going', 'Average intake and deficit, from your own data'],
  },
  {
    id: 'free-private-pwa',
    eyebrow: 'Yours, everywhere',
    title: 'On your phone, in your browser, free',
    body: "Add Nourish to your home screen or open it in any browser — it's the same account, synced to you. Free, no ads, works offline, and your data stays tied to your private login.",
    bullets: ['Installable app — home screen or desktop browser', 'Free to use, with no ads', 'Works offline — log a meal without a signal', 'Per-user accounts, your data synced to you'],
  },
]

const PROOF = [
  { icon: 'ti-database', stat: '2M foods', label: 'USDA FoodData Central' },
  { icon: 'ti-flask', stat: 'Science-based', label: 'Mifflin-St Jeor targets' },
  { icon: 'ti-camera', stat: 'Photo logging', label: 'Snap a meal to log it' },
  { icon: 'ti-mood-smile', stat: 'Free, no ads', label: 'Private, per-user data' },
]

function CtaBand({ headline, sub, button, onCreate }: { headline: string; sub: string; button: string; onCreate: () => void }) {
  return (
    <section className="lp-band">
      <div className="lp-inner lp-band-inner">
        <h2 className="lp-band-title">{headline}</h2>
        <p className="lp-band-sub">{sub}</p>
        <button className="lp-btn lp-btn-lg" onClick={onCreate}>{button}</button>
      </div>
    </section>
  )
}

export function Landing({ onCreate, onSignIn }: { onCreate: () => void; onSignIn: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 520)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="lp">
      <header className={`lp-nav${scrolled ? ' on' : ''}`}>
        <div className="lp-inner lp-nav-row">
          <Wordmark />
          <div className="lp-nav-actions">
            <button className="lp-link" onClick={onSignIn}>Sign in</button>
            <button className="lp-btn lp-btn-sm" onClick={onCreate}>Get started</button>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-inner lp-hero-grid">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow lp-hero-eyebrow">Calorie tracking, simplified</span>
            <h1 className="lp-h1">Log a meal before you finish eating it</h1>
            <p className="lp-lead">
              Nourish turns your stats into a daily calorie and macro target, then makes logging fast enough to actually keep up with. Snap a photo or search 2 million foods — your remaining calories update as you go.
            </p>
            <div className="lp-cta-row">
              <button className="lp-btn lp-btn-lg" onClick={onCreate}>Create your free account</button>
              <button className="lp-btn-ghost" onClick={onSignIn}>Sign in</button>
            </div>
            <p className="lp-fineprint"><i className="ti ti-circle-check" aria-hidden="true" /> No credit card · Free with no ads</p>
          </div>
          <div className="lp-hero-visual">
            <PhoneMock />
            <div className="lp-peek" aria-hidden="true">
              <div className="lp-vsearch"><i className="ti ti-search" /><span>chicke<span className="lp-caret" /></span></div>
              {[{ n: 'Chicken breast, grilled', k: 165 }, { n: 'Chicken thigh, roasted', k: 209 }].map((o, i) => (
                <div key={o.n} className={`lp-vresult${i === 0 ? ' on' : ''}`}><span>{o.n}</span><span className="lp-mock-cal">{o.k}</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="lp-proofwrap">
        <div className="lp-inner lp-proof">
          {PROOF.map((p) => (
            <div key={p.stat} className="lp-proof-chip">
              <i className={`ti ${p.icon}`} aria-hidden="true" />
              <div>
                <div className="lp-proof-stat">{p.stat}</div>
                <div className="lp-proof-label">{p.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {SECTIONS.slice(0, 3).map((s, i) => (
        <section key={s.id} className={`lp-feature${i % 2 === 1 ? ' rev' : ''}`}>
          <div className="lp-inner lp-feature-grid">
            <div className="lp-feature-copy">
              <span className="lp-eyebrow">{s.eyebrow}</span>
              <h2 className="lp-h2">{s.title}</h2>
              <p className="lp-body">{s.body}</p>
              <Bullets items={s.bullets} />
            </div>
            <div className="lp-feature-visual">{VISUALS[s.id]}</div>
          </div>
        </section>
      ))}

      <CtaBand
        headline="Real numbers, logged in seconds."
        sub="Set your target, snap your first meal, and watch your remaining calories update. No credit card, free with no ads."
        button="Create your free account"
        onCreate={onCreate}
      />

      {SECTIONS.slice(3).map((s, i) => (
        <section key={s.id} className={`lp-feature${(i + 3) % 2 === 1 ? ' rev' : ''}`}>
          <div className="lp-inner lp-feature-grid">
            <div className="lp-feature-copy">
              <span className="lp-eyebrow">{s.eyebrow}</span>
              <h2 className="lp-h2">{s.title}</h2>
              <p className="lp-body">{s.body}</p>
              <Bullets items={s.bullets} />
            </div>
            <div className="lp-feature-visual">{VISUALS[s.id]}</div>
          </div>
        </section>
      ))}

      <section className="lp-final">
        <div className="lp-inner lp-final-inner">
          <h2 className="lp-final-title">Most trackers feel like homework. This one takes seconds.</h2>
          <p className="lp-band-sub">Your goal weight starts with one logged meal. Create your free account and log your first today.</p>
          <button className="lp-btn lp-btn-lg" onClick={onCreate}>Create your free account</button>
          <button className="lp-link lp-final-link" onClick={onSignIn}>Already have an account? Sign in</button>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-inner lp-footer-inner">
          <Wordmark />
          <p className="lp-footer-tag">Real numbers behind every meal, on a science-based target built for you.</p>
          <div className="lp-footer-links">
            <button className="lp-link" onClick={onSignIn}>Sign in</button>
            <span className="lp-foot-static">Privacy</span>
            <span className="lp-foot-static">Terms</span>
            <span className="lp-foot-static">About</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
