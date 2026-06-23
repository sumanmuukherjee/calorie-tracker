import { supabase } from './supabase'
import type { AppState } from '../types'

// We persist everything except transient UI flags.
export type PersistedState = Omit<AppState, 'sheetOpen' | 'screen' | 'hydrating'>

export function toPersisted(state: AppState): PersistedState {
  const { sheetOpen, screen, hydrating, ...rest } = state
  return rest
}

export async function loadUserState(userId: string): Promise<PersistedState | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_state')
    .select('state')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('loadUserState failed:', error.message)
    return null
  }
  const state = data?.state as PersistedState | undefined
  // A brand-new row defaults to {}, which has no onboarded flag — treat as empty.
  if (!state || typeof state.onboarded !== 'boolean') return null
  return state
}

export async function saveUserState(userId: string, state: PersistedState): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('user_state')
    .upsert({ id: userId, state, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  if (error) console.error('saveUserState failed:', error.message)
}
