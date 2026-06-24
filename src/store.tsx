import { createContext, useContext, useEffect, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import type { AppState, Food, Goal, LoggedFood, MealName, Profile, Screen } from './types'
import { MEAL_ORDER } from './types'
import { FOODS, SEED_MEALS } from './data/foods'
import { adaptiveMaintenance, dailyTarget, macroTargets, tdee } from './lib/nutrition'
import { isCloud } from './lib/supabase'
import { loadUserState, saveUserState, toPersisted, type PersistedState } from './lib/cloud'
import { useAuth } from './auth'

type Action =
  | { type: 'ADD_FOOD'; meal: MealName; food: Food; qty?: number }
  | { type: 'ADD_MANY'; meal: MealName; foods: { food: Food; qty: number }[] }
  | { type: 'REMOVE_FOOD'; meal: MealName; uid: string }
  | { type: 'UPDATE_FOOD'; meal: MealName; uid: string; qty: number }
  | { type: 'OPEN_SHEET'; meal: MealName }
  | { type: 'OPEN_EDIT'; meal: MealName; uid: string }
  | { type: 'CLOSE_SHEET' }
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_GOAL'; goal: Goal }
  | { type: 'SET_RATE'; rate: number }
  | { type: 'SET_CUSTOM_TARGET'; value: number | null }
  | { type: 'SET_ADAPTIVE_TDEE'; value: boolean }
  | { type: 'FINISH_ONBOARDING'; profile: Profile; goal: Goal; rate: number; customTarget: number | null }
  | { type: 'HYDRATE'; state: PersistedState }
  | { type: 'SET_HYDRATING'; value: boolean }
  | { type: 'SET_AVATAR'; url: string }
  | { type: 'LOG_WEIGHT'; kg: number }
  | { type: 'ADD_CUSTOM_FOOD'; food: Food }
  | { type: 'RESET' }

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

function emptyMeals(): Record<MealName, LoggedFood[]> {
  return { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] }
}

// Local calendar date as YYYY-MM-DD.
export function todayStr(): string {
  return new Date().toLocaleDateString('en-CA')
}

function totalKcal(meals: Record<MealName, LoggedFood[]>): number {
  let t = 0
  for (const m of MEAL_ORDER) for (const i of meals[m]) t += i.kcal * i.qty
  return Math.round(t)
}

function totalMacros(meals: Record<MealName, LoggedFood[]>): { p: number; c: number; f: number } {
  let p = 0
  let c = 0
  let f = 0
  for (const m of MEAL_ORDER)
    for (const i of meals[m]) {
      p += i.p * i.qty
      c += i.c * i.qty
      f += i.f * i.qty
    }
  return { p: Math.round(p), c: Math.round(c), f: Math.round(f) }
}

// Single source of truth for the logging streak (consecutive days back from today
// with calories logged). Used by both the Today header and Trends so they agree.
export function currentStreak(history: Record<string, number>, currentDate: string, todayEaten: number): number {
  let streak = 0
  const base = new Date()
  for (let i = 0; i < 400; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    const ds = d.toLocaleDateString('en-CA')
    const kcal = ds === currentDate ? todayEaten : history[ds] ?? 0
    if (kcal > 0) streak++
    else break
  }
  return streak
}

// When a new calendar day starts, archive the finished day's total into
// history and clear the meals so the diary is fresh for today.
function rolloverIfNeeded(s: AppState): AppState {
  const today = todayStr()
  if (s.currentDate === today) return s
  const history = { ...(s.history || {}) }
  const macroHistory = { ...(s.macroHistory || {}) }
  const finished = totalKcal(s.meals)
  if (s.currentDate && finished > 0) {
    history[s.currentDate] = finished
    macroHistory[s.currentDate] = totalMacros(s.meals)
  }
  return { ...s, currentDate: today, history, macroHistory, meals: emptyMeals() }
}

function seededMeals(): Record<MealName, LoggedFood[]> {
  const byId = Object.fromEntries(FOODS.map((f) => [f.id, f]))
  const out = {} as Record<MealName, LoggedFood[]>
  for (const meal of MEAL_ORDER) {
    out[meal] = (SEED_MEALS[meal] || [])
      .map((id) => byId[id])
      .filter(Boolean)
      .map((f) => ({ ...f, uid: uid(), qty: 1 }))
  }
  return out
}

const defaultProfile: Profile = { sex: 'male', age: 32, heightCm: 178, weightKg: 82, activity: 1.55 }
const STORAGE_KEY = 'nourish.v1'

// Clean slate — used for cloud new-users and on sign-out.
function freshDefault(): AppState {
  return {
    onboarded: false,
    screen: 'onboarding',
    profile: defaultProfile,
    goal: 'lose',
    rate: 0.5,
    customTarget: null,
    adaptiveTdee: false,
    exercise: 0,
    meals: emptyMeals(),
    sheetOpen: false,
    sheetMeal: 'Lunch',
    editing: null,
    hydrating: false,
    currentDate: todayStr(),
    history: {},
    macroHistory: {},
    weighIns: [],
    customFoods: [],
  }
}

// Local (no-login) mode: seeded demo data, restored from localStorage if present.
function localInitialState(): AppState {
  const base: AppState = { ...freshDefault(), meals: seededMeals() }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      // exercise: 0 clears the legacy seeded "320" — there's no real exercise
      // source yet, so any persisted value is the phantom. Drop this override
      // once exercise is fed by Health (active energy) or a manual editor.
      const merged = { ...base, ...saved, exercise: 0, sheetOpen: false, hydrating: false, screen: saved.onboarded ? 'today' : 'onboarding' }
      return rolloverIfNeeded(merged)
    }
  } catch {
    /* ignore corrupt storage */
  }
  return base
}

function bootstrap(): AppState {
  if (isCloud) return { ...freshDefault(), hydrating: true }
  return localInitialState()
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_FOOD':
      return {
        ...state,
        meals: {
          ...state.meals,
          [action.meal]: [...state.meals[action.meal], { ...action.food, uid: uid(), qty: action.qty ?? 1, loggedAt: Date.now() }],
        },
      }
    case 'ADD_MANY':
      return {
        ...state,
        meals: {
          ...state.meals,
          [action.meal]: [
            ...state.meals[action.meal],
            ...action.foods.map(({ food, qty }) => ({ ...food, uid: uid(), qty, loggedAt: Date.now() })),
          ],
        },
      }
    case 'REMOVE_FOOD':
      return {
        ...state,
        meals: { ...state.meals, [action.meal]: state.meals[action.meal].filter((i) => i.uid !== action.uid) },
      }
    case 'UPDATE_FOOD':
      return {
        ...state,
        meals: {
          ...state.meals,
          [action.meal]: state.meals[action.meal].map((i) => (i.uid === action.uid ? { ...i, qty: action.qty } : i)),
        },
      }
    case 'OPEN_SHEET':
      return { ...state, sheetOpen: true, sheetMeal: action.meal, editing: null }
    case 'OPEN_EDIT':
      return { ...state, sheetOpen: true, sheetMeal: action.meal, editing: { meal: action.meal, uid: action.uid } }
    case 'CLOSE_SHEET':
      return { ...state, sheetOpen: false, editing: null }
    case 'SET_SCREEN':
      return { ...state, screen: action.screen, sheetOpen: false }
    case 'SET_GOAL':
      return { ...state, goal: action.goal }
    case 'SET_RATE':
      return { ...state, rate: action.rate }
    case 'SET_CUSTOM_TARGET':
      return { ...state, customTarget: action.value }
    case 'SET_ADAPTIVE_TDEE':
      return { ...state, adaptiveTdee: action.value }
    case 'FINISH_ONBOARDING':
      return { ...state, profile: action.profile, goal: action.goal, rate: action.rate, customTarget: action.customTarget, onboarded: true, screen: 'today' }
    case 'HYDRATE':
      return rolloverIfNeeded({
        ...state,
        ...action.state,
        exercise: 0, // clear the legacy seeded value until a real source exists
        sheetOpen: false,
        hydrating: false,
        screen: action.state.onboarded ? 'today' : 'onboarding',
      })
    case 'SET_HYDRATING':
      return { ...state, hydrating: action.value }
    case 'SET_AVATAR':
      return { ...state, avatarUrl: action.url }
    case 'LOG_WEIGHT': {
      const date = todayStr()
      const others = state.weighIns.filter((w) => w.date !== date)
      return {
        ...state,
        weighIns: [...others, { date, kg: action.kg }].sort((a, b) => a.date.localeCompare(b.date)),
      }
    }
    case 'ADD_CUSTOM_FOOD':
      return { ...state, customFoods: [action.food, ...state.customFoods.filter((f) => f.id !== action.food.id)] }
    case 'RESET':
      return freshDefault()
    default:
      return state
  }
}

interface StoreValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [state, dispatch] = useReducer(reducer, undefined, bootstrap)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cloud mode: load this user's state when they sign in; clear it on sign-out.
  useEffect(() => {
    if (!isCloud) return
    let cancelled = false
    if (!userId) {
      dispatch({ type: 'RESET' })
      return
    }
    dispatch({ type: 'SET_HYDRATING', value: true })
    loadUserState(userId).then((loaded) => {
      if (cancelled) return
      if (loaded) {
        dispatch({ type: 'HYDRATE', state: loaded })
      } else {
        const seed = freshDefault()
        dispatch({ type: 'RESET' })
        saveUserState(userId, toPersisted(seed))
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  // Persist on change: localStorage in local mode, Supabase (debounced) in cloud mode.
  useEffect(() => {
    if (isCloud) {
      if (!userId || state.hydrating) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => saveUserState(userId, toPersisted(state)), 600)
      return
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(state)))
    } catch {
      /* storage may be unavailable */
    }
  }, [state, userId])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export interface DerivedTotals {
  maintenance: number
  target: number
  eaten: number
  remaining: number
  macros: { p: number; c: number; f: number }
  macroGoals: { protein: number; carbs: number; fat: number }
}

export function useTotals(): DerivedTotals {
  const { state } = useStore()
  const adaptive = state.adaptiveTdee ? adaptiveMaintenance(state.weighIns, state.history) : null
  const maintenance = adaptive ?? tdee(state.profile)
  const recommended = dailyTarget(maintenance, state.goal, state.rate)
  const target = state.customTarget != null ? state.customTarget : recommended
  const macroGoals = macroTargets(target, state.profile.weightKg, state.goal)

  let eaten = 0
  let p = 0
  let c = 0
  let f = 0
  for (const meal of MEAL_ORDER) {
    for (const item of state.meals[meal]) {
      eaten += item.kcal * item.qty
      p += item.p * item.qty
      c += item.c * item.qty
      f += item.f * item.qty
    }
  }
  return {
    maintenance,
    target,
    eaten: Math.round(eaten),
    remaining: Math.round(target + state.exercise - eaten),
    macros: { p: Math.round(p), c: Math.round(c), f: Math.round(f) },
    macroGoals,
  }
}
