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

export function dailyTarget(maintenance: number, goal: Goal, rateKgPerWeek: number): number {
  let adjustment = 0
  if (goal === 'lose') adjustment = -(rateKgPerWeek * KCAL_PER_KG) / 7
  else if (goal === 'gain') adjustment = ((rateKgPerWeek * KCAL_PER_KG) / 7) * 0.85
  const raw = maintenance + adjustment
  return Math.max(1200, Math.round(raw / 10) * 10)
}

export interface MacroTargets {
  protein: number
  carbs: number
  fat: number
}

export function macroTargets(target: number, weightKg: number, goal: Goal): MacroTargets {
  const proteinPerKg = goal === 'lose' ? 2.0 : goal === 'gain' ? 1.6 : 1.8
  const protein = Math.round(proteinPerKg * weightKg)
  const fat = Math.round((target * 0.25) / 9)
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4))
  return { protein, carbs, fat }
}
