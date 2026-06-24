import type { CapacitorConfig } from '@capacitor/cli'

// Capacitor wraps the existing Vite build (webDir: dist) as a native iOS/Android
// app so Nourish can reach Apple Health (HealthKit) and Android Health Connect.
// The web/PWA build is unaffected — this only matters once you run `npx cap`.
const config: CapacitorConfig = {
  appId: 'app.nourish.tracker',
  appName: 'Nourish',
  webDir: 'dist',
  // For live-reload dev against the deployed PWA, set:
  // server: { url: 'https://calorie-tracker-giei5.ondigitalocean.app', cleartext: false },
}

export default config
