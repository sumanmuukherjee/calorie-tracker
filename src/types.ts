export type MealName = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'
export const MEAL_ORDER: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

export type Goal = 'lose' | 'maintain' | 'gain'

export interface Food {
  id: string
  name: string
  portion: string
  kcal: number
  p: number
  c: number
  f: number
}

export interface LoggedFood extends Food {
  uid: string
  qty: number
  loggedAt?: number // epoch ms when this item was logged
}

export interface Profile {
  sex: 'male' | 'female'
  age: number
  heightCm: number
  weightKg: number
  activity: number
}

export interface WeighIn {
  date: string // YYYY-MM-DD
  kg: number
}

export type Screen = 'onboarding' | 'today' | 'photo' | 'trends'

export interface AppState {
  onboarded: boolean
  screen: Screen
  profile: Profile
  goal: Goal
  rate: number
  customTarget: number | null // manual daily calorie target; null = use computed
  exercise: number
  meals: Record<MealName, LoggedFood[]>
  sheetOpen: boolean
  sheetMeal: MealName
  hydrating: boolean
  avatarUrl?: string
  currentDate: string // YYYY-MM-DD the meals belong to
  history: Record<string, number> // date -> total kcal eaten that day
  weighIns: WeighIn[]
}
