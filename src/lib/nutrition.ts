import type { Goal, Profile } from '../types'

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
