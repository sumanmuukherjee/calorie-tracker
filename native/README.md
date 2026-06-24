# Nourish — native health (Apple Health + Android Health Connect)

Wraps the existing Vite/React web app as a Capacitor native app so Nourish can
**read** weight + active energy and **write** nutrition (energy + macros + water)
to Apple Health and Android Health Connect.

> Status: **scaffolding**. The TypeScript bridge (`src/lib/health-native.ts`) and the
> custom-plugin TS (`native/health-write/src`) are written and web-safe. The Swift/Kotlin
> files are **untested skeletons** — compile and test them in Xcode / Android Studio.
> Nothing here affects the web/PWA build.

## Why a custom write plugin
No aggregator (Terra/Vital) and no surveyed community Capacitor plugin writes nutrition
(calories + protein/carbs/fat) to Apple Health / Health Connect — only the OS APIs do.
So: **read** via a community plugin, **write** via `native/health-write` (this folder).

## One-time setup (needs Xcode + Android Studio + dev accounts)
```bash
# 1. Capacitor core + platforms + the read plugin
npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android @capgo/capacitor-health

# 2. Generate native projects (uses capacitor.config.ts at the repo root)
npx cap add ios
npx cap add android

# 3. Build the web app, then sync into native
npm run build && npx cap sync

# 4. Assemble the custom write plugin
#    Easiest: `npm init @capacitor/plugin@latest nourish-health-write`, then replace its
#    src/ + ios/ + android/ with the files in native/health-write/. Add it to the app:
#    npm i ./native/health-write && npx cap sync
```

## iOS config (Xcode)
- Target → **Signing & Capabilities → + HealthKit**.
- `Info.plist`: `NSHealthUpdateUsageDescription` (write) and, if you also read in-app,
  `NSHealthShareUsageDescription`.
- App Store rules: do **not** store HealthKit data in iCloud; never write false data;
  request only the types you use. Expect a longer HealthKit review.

## Android config (Android Studio)
- Add `androidx.health.connect:connect-client` to the app `build.gradle`.
- `AndroidManifest.xml`: declare the permissions you use, e.g.
  `android.permission.health.WRITE_NUTRITION`, `WRITE_HYDRATION`,
  `READ_WEIGHT`, `READ_ACTIVE_CALORIES_BURNED`, plus the Health Connect
  `<queries>`/privacy-policy intent filter Google requires.
- Play Console: complete the mandatory **Health apps declaration** form + privacy policy.

## Wiring into the app (when the plugins are real)
`src/lib/health-native.ts` is inert on web and activates inside the Capacitor shell.
Hook points (add behind `HEALTH_SYNC_ENABLED && isNativeHealthAvailable()`):
- On food log / day change → `writeNutrition({ date, kcal, protein, carbs, fat })`.
- Exercise allowance → `readActiveEnergyForDate(today)` instead of a manual value.
- Weigh-in chart → seed from `readLatestWeightKg()`.

Confirm before relying on the read plugin: check `@capgo/capacitor-health`'s actual
query API + result shapes (the calls in `health-native.ts` have `TODO(native)` markers),
its npm recency, and Health Connect support.
