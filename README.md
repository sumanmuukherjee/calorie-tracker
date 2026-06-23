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

## Deploy

Static build — serve the `dist/` directory on any static host. Configured for DigitalOcean App Platform (build: `npm run build`, output: `dist`).

## Customize

Nutrition math lives in `src/lib/nutrition.ts` — protein/fat/carb ratios and the
target formula are the opinionated knobs worth tuning.

## License

Private project.
