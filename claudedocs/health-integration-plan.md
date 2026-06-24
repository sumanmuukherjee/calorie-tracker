# Nourish — Health-data integration plan (aggregator approach / "option 2")

Goal: sync key health data points into Nourish (weight, exercise/active energy) and push logged
nutrition out — via a health-data **aggregator** (Terra or Vital) rather than raw per-platform SDKs.

## The one thing to be clear about up front

An aggregator gives a single API + webhooks across many sources, but the sources split in two:

- **Cloud-API providers** (Garmin, Fitbit, Oura, Whoop, Withings, Polar, Google) connect
  **server-side via OAuth — no app required.** This is the big win and is shippable on the web today.
- **Apple Health** is on-device with **no server API.** Reading it — even through an aggregator —
  requires the aggregator's **iOS SDK embedded in a native wrapper (Capacitor).**
- **Writing nutrition into Apple Health** (dietary energy + macros) is a native HealthKit write in
  that same wrapper. Aggregators are read-first; confirm any write-back support in the spike.

➡ So this is phased: cloud wearables (web-only) first, Apple Health (needs the wrapper) second.

## Architecture

```
[ wearable clouds ]      [ Apple Health on device ]
 Garmin/Fitbit/Oura...      (iOS only)
        │ OAuth                 │ aggregator iOS SDK (in Capacitor wrapper)
        ▼                       ▼
        └─────►  Aggregator cloud (Terra/Vital)  ◄────┘
                        │ webhooks (signed)
                        ▼
            Supabase Edge Function  (verify + normalize + upsert)
                        │
                        ▼
            Supabase tables (health_connections, health_samples)  [RLS per user]
                        │
                        ▼
            Nourish web app
              • active energy  → the "exercise" allowance (replaces the seeded 320)
              • body weight    → weigh-in chart (two-way)
              • nutrition write → push day's kcal + P/C/F to Apple Health (native, Phase B)
```

Nourish today is a static SPA + Supabase (no custom server). The new server piece is a **Supabase
Edge Function** to receive aggregator webhooks — no separate backend to run.

## Key data points → mapping

| Data point | Direction | Sources | Used in Nourish for |
|---|---|---|---|
| Body weight | read (+ optional write-back) | Apple Health, Withings, Garmin, Fitbit, Oura | weigh-in chart / Trends (two-way) |
| Active energy (exercise kcal) | read | Apple Health, Garmin, Fitbit, Whoop, Oura | the **exercise allowance** (replaces phantom 320) |
| Workouts | read | most | optional auto-exercise entries |
| Steps | read | most | optional context in Trends |
| Resting / basal energy | read | Apple Health, some wearables | optional input to adaptive TDEE |
| Dietary energy + P/C/F + water | **write** | Apple Health (native write) | push the logged day into Health |

## Phase A — web only, no app (cloud wearables)

1. Pick + set up the aggregator account (Terra or Vital); get API keys; set the webhook URL.
2. Supabase: add `health_connections` (provider, status per user) + `health_samples` (type, value,
   unit, start/end, source, dedupe key) with RLS; an Edge Function `health-webhook` (verify
   signature → upsert) and `health-link-token` (mint the connect/session token).
3. Frontend: a **Connect a device** section (in the Goal/profile area) using the aggregator's hosted
   OAuth widget; show connected sources + last sync; allow disconnect.
4. Wire data in: when an active-energy source is connected, the **exercise** value comes from real
   synced data (else manual / 0). Merge synced **weight** into the weigh-in chart.
5. QA at 390px; respect the existing safety guardrails; verify the smoke pass (search → log → ring).

Delivers real Garmin/Fitbit/Oura/etc. data on the web with **no App Store involvement.**

## Phase B — native wrapper (Apple Health)

1. Add **Capacitor** around the existing web build (reuses ~100% of the React/Vite app).
2. Add the aggregator's **iOS SDK** + HealthKit entitlement; request read scopes (weight, active
   energy, workouts) and, for nutrition write-back, HealthKit write scopes.
3. A small bridge (`lib/health-native.ts`) that uses the SDK on iOS and no-ops on plain web, so it
   stays one codebase.
4. Distribute via TestFlight, then App Store.
5. (Optional, later) Android **Health Connect** — separate native integration.

## Repo changes (concrete)

- `supabase/schema.sql`: `health_connections`, `health_samples` (+ indexes, RLS, dedupe).
- `supabase/functions/health-webhook/`, `supabase/functions/health-link-token/` (Edge Functions).
- `src/lib/health.ts`: aggregator client + sample readers; `src/lib/health-native.ts` (Phase B).
- `src/store.tsx` / `types.ts`: `exercise` becomes sourced (connected active-energy) or manual;
  weigh-ins can ingest synced weight.
- A "Connections" UI block; small Today/Trends wiring to show the synced numbers + source label.
- Phase B: a `capacitor.config.ts`, `ios/` project, Info.plist usage strings, entitlements.

## What only you can do

- Choose + sign up for the aggregator (Terra vs Vital); get API keys; configure providers + webhook.
- Approve budget — aggregators charge (typically per connected/active user; usually a free dev tier,
  then paid). **Verify current pricing before committing.**
- Phase B: Apple Developer Program ($99/yr), app signing, HealthKit capability, App Store/TestFlight.
- Any provider dev registration the aggregator doesn't cover (varies by provider).
- A **privacy policy + health-data consent** (App Store and the aggregator require it; this is
  sensitive PII — handle with explicit consent, least-privilege scopes, and clear disconnect/delete).

## Costs & risks (honest)

- Recurring aggregator cost (per-user pricing) + $99/yr Apple for Phase B.
- Apple Health specifically can't be tested in a headless 390px browser — needs a device/simulator,
  so it's outside the current mobile-web QA harness (Phase B gets device-based QA).
- Write-back of nutrition to Apple Health: confirm the chosen aggregator supports it, else do it via
  the native HealthKit write directly in the wrapper.
- Health data is sensitive: encryption at rest (Supabase provides), strict RLS, consent UX, deletion.

## What I can start now (no accounts/budget needed)

- **Honest-exercise interim (ties to teardown F5):** replace the seeded `exercise: 320` with a real
  manual field / 0, so the allowance isn't fabricated while the integration is built. Shippable today.
- Once you pick an aggregator: scaffold the Supabase schema + Edge Functions + `lib/health.ts` client
  and the Connect UI behind a flag (Phase A), ready to wire to live keys.

## Decisions needed from you

1. Aggregator: **Vital**, **Terra**, or want a short comparison spike first?
2. Budget OK for a paid aggregator (+ $99/yr Apple for Phase B)?
3. Start **Phase A** (web, cloud wearables) now? And do the **F5 honest-exercise** fix now?
4. iOS only, or Android **Health Connect** too (later)?

---

## Spike results — Terra vs Vital (web-researched 2026-06-24)

### Load-bearing findings
1. **Nutrition write-back is not solved by either aggregator cross-platform — it's native DIY regardless.**
   - Terra writes nutrition (energy + P/C/F + water) to **Apple Health only** (iOS `postNutrition`); Android SDK is **read-only**.
   - Vital/Junction can only write **water / caffeine / mindfulSession** — no calories/macros at all (from `WritableVitalResource.swift`).
   - No mature community Capacitor plugin (capgo, mley, perfood, ubie-oss, devmaxime) writes nutrition either, though HealthKit + Health Connect natively support it → a thin **custom Capacitor plugin (Swift + Kotlin)** is required for nutrition write on both platforms.
2. **Capacitor fit favors Terra.** Terra ships `terra-capacitor` (official). Vital has native iOS/Kotlin + RN + Flutter only — no Capacitor → custom bridge. (Terra caveat: verify in the plugin *source* that it surfaces Health Connect + the iOS write `post*` fns — docs only mention Apple Health/Samsung.)
3. **Apple Health & Health Connect have no server path** — both need the on-device SDK. A web-only Phase A can only use cloud-OAuth wearables, never Apple Health/Health Connect.
4. **Cost floor ~$300–500/mo.** Terra: no free tier, $399–499/mo (100k credits, then per-credit). Vital: free 50-user sandbox (dev), then $300/mo min in production.

### What it means
The aggregator's value narrows to **cloud-wearable breadth** (Garmin/Fitbit/Oura/Whoop/Withings/Google), because Apple Health/Health Connect read needs the native SDK either way and nutrition write is native DIY either way. For an Apple-Health-centric goal, the aggregator is largely bypassed.

### Revised options
- **A. Native-only, no aggregator (~$0/mo):** community Capacitor plugin for read (weight, active energy) + a thin custom plugin for nutrition write. Leanest + cheapest for Apple Health + Health Connect. Adds $99/yr Apple + $25 one-time Google Play.
- **B. Terra aggregator (~$399–499/mo) + native:** adds the broad cloud wearables via server-side OAuth; still DIY the nutrition write. Worth it only if many users have Garmin/Fitbit/Oura/etc.

### Confirm before committing
- `terra-capacitor` **source**: does it expose Health Connect + iOS write `post*`? Check npm recency/open issues.
- Apple: needs `NSHealthShareUsageDescription` + `NSHealthUpdateUsageDescription`; no iCloud storage of Health data; no false writes; longer review.
- Google Play: mandatory Health apps declaration form; verify your types (weight, active energy, nutrition) aren't the restricted "health records" category.

### Key sources
tryterra.co/pricing · docs.tryterra.co/.../ios-swift · github.com/tryterra/terra-capacitor ·
tryvital.com/pricing · docs.junction.com/wearables/guides/apple-healthkit · github.com/tryVital/vital-ios ·
capacitorjs.com/solution/react · developer.apple.com/app-store/review/guidelines (§5.1.3) ·
support.google.com/googleplay/android-developer/answer/14738291
