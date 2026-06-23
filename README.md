# Nourish — Calorie Tracker

A fast, mobile-first calorie and macro tracker built as an installable PWA.

## Features

- **Today dashboard** — calorie ring (remaining = goal + exercise − food), macro progress bars, per-meal logging
- **Onboarding** — Mifflin–St Jeor BMR → TDEE → daily target with a live goal/pace picker
- **AI photo logging** — review auto-detected items with confidence scores and portion adjustment
- **Trends** — weight trend chart, 7-day calorie adherence, summary stats
- **Installable PWA** — standalone display, offline app-shell caching, home-screen icon
- **Offline-first state** — your diary persists in `localStorage`; light & dark themes

## Tech

Vite + React 18 + TypeScript. No backend — pure client-side SPA. State lives in a single `useReducer` store (`src/store.tsx`); the UI is derived from it.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs static site to dist/
npm run preview  # serve the production build locally
```

## Multi-user mode (Supabase)

The app runs in two modes:

- **Local mode** (no env vars) — single device, `localStorage`, no login. Default for dev.
- **Cloud mode** (env vars set) — email/password accounts, per-user data synced to Supabase.

To enable cloud mode:

1. Create a free project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor (creates the
   `user_state` table with Row-Level Security so each user sees only their own data).
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API). The anon key is a public client key — safe to ship in the frontend.
4. (Optional) Disable "Confirm email" in Auth settings for instant signups while testing.

## Deploy

Static build — serve the `dist/` directory on any static host. Configured for DigitalOcean App
Platform (build: `npm run build`, output: `dist`). For cloud mode in production, set
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as **build-time** environment variables on the host.

## Customize

Nutrition math lives in `src/lib/nutrition.ts` — protein/fat/carb ratios and the
target formula are the opinionated knobs worth tuning.

## License

Private project.
