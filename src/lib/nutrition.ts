import type { Goal, Profile, WeighIn } from '../types'

export const ACTIVITY_LEVELS = [
  { label: 'Sedentary', value: 1.2 },
  { label: 'Light', value: 1.375 },
  { label: 'Moderate', value: 1.55 },
  { label: 'Very active', value: 1.725 },
]

export function tdee(p: Profile): number {
  const sexConstant = p.sex === 'male' ? 5 : -161
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + sexConstant
  return Math.round(bmr * p.activity)
}

const KCAL_PER_KG = 7700
export const CALORIE_FLOOR = 1200

function rawTarget(maintenance: number, goal: Goal, rateKgPerWeek: number): number {
  let adjustment = 0
  if (goal === 'lose') adjustment = -(rateKgPerWeek * KCAL_PER_KG) / 7
  else if (goal === 'gain') adjustment = ((rateKgPerWeek * KCAL_PER_KG) / 7) * 0.85
  return maintenance + adjustment
}

export function dailyTarget(maintenance: number, goal: Goal, rateKgPerWeek: number): number {
  return Math.max(CALORIE_FLOOR, Math.round(rawTarget(maintenance, goal, rateKgPerWeek) / 10) * 10)
}

/** True when the computed deficit would push the target below the safe floor. */
export function targetFloorApplied(maintenance: number, goal: Goal, rateKgPerWeek: number): boolean {
  return goal === 'lose' && rawTarget(maintenance, goal, rateKgPerWeek) < CALORIE_FLOOR
}

// F12 — estimate real maintenance from energy balance. Over the window between
// the first and last weigh-in, the weight TREND reflects (intake − maintenance):
// maintenance = avgIntake − slopeKgPerDay × 7700.
//
// The slope is a least-squares fit over ALL weigh-ins in the window (not just
// the two endpoints) so a single noisy scale reading can't dominate; the result
// is discarded unless it's plausible and within ~40% of the profile estimate,
// since day-to-day water-weight swings of 1–2 kg are routine. Needs >=3 weigh-ins
// >=14 days apart and enough logged days, else returns null (fall back to Mifflin).
export function adaptiveMaintenance(weighIns: WeighIn[], history: Record<string, number>, mifflin: number): number | null {
  if (weighIns.length < 3) return null
  const sorted = [...weighIns].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const t0 = new Date(first.date + 'T00:00:00').getTime()
  const days = Math.round((new Date(last.date + 'T00:00:00').getTime() - t0) / 86_400_000)
  if (days < 14) return null

  // least-squares slope (kg/day) over every weigh-in in the window
  const pts = sorted.map((w) => ({ x: (new Date(w.date + 'T00:00:00').getTime() - t0) / 86_400_000, y: w.kg }))
  const N = pts.length
  const sx = pts.reduce((a, p) => a + p.x, 0)
  const sy = pts.reduce((a, p) => a + p.y, 0)
  const sxx = pts.reduce((a, p) => a + p.x * p.x, 0)
  const sxy = pts.reduce((a, p) => a + p.x * p.y, 0)
  const denom = N * sxx - sx * sx
  if (denom === 0) return null
  const slope = (N * sxy - sx * sy) / denom // kg/day, negative while losing

  let sum = 0
  let n = 0
  for (const date in history) {
    if (date >= first.date && date <= last.date && history[date] > 0) {
      sum += history[date]
      n++
    }
  }
  if (n < Math.max(7, Math.round(days * 0.4))) return null
  const avgIntake = sum / n

  const maintenance = avgIntake - slope * KCAL_PER_KG
  if (maintenance < 800 || maintenance > 6000) return null
  if (mifflin > 0 && Math.abs(maintenance - mifflin) / mifflin > 0.4) return null // reject noise-driven outliers
  return Math.round(maintenance / 10) * 10
}

export interface MacroTargets {
  protein: number
  carbs: number
  fat: number
}

export function macroTargets(target: number, weightKg: number, goal: Goal): MacroTargets {
  const proteinPerKg = goal === 'lose' ? 2.0 : goal === 'gain' ? 1.6 : 1.8
  // Cap protein so it can't consume the whole target (leaves room for fat/carbs);
  // at normal targets this never binds and the split is unchanged.
  const protein = Math.min(Math.round(proteinPerKg * weightKg), Math.floor((target * 0.9) / 4))
  // Fat targets 25% of calories, but never more than what's left after protein,
  // so protein*4 + fat*9 can't exceed the target and carbs stays non-negative.
  const fatKcal = Math.min(target * 0.25, Math.max(0, target - protein * 4))
  const fat = Math.round(fatKcal / 9)
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4))
  return { protein, carbs, fat }
}
