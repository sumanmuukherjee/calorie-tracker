import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isCloud, supabase } from './lib/supabase'

interface AuthResult {
  error?: string
  needsConfirm?: boolean
}

interface AuthValue {
  isCloud: boolean
  loading: boolean
  session: Session | null
  user: User | null
  recovery: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isCloud)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    // 'PASSWORD_RECOVERY' fires when the user arrives via a reset-email link.
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthValue = {
    isCloud,
    loading,
    session,
    user: session?.user ?? null,
    recovery,
    signIn: async (email, password) => {
      if (!supabase) return {}
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message }
    },
    signUp: async (email, password) => {
      if (!supabase) return {}
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }
      return { needsConfirm: !data.session }
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut()
    },
    resetPassword: async (email) => {
      if (!supabase) return {}
      // Supabase emails a one-time link that returns the user to this app.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      return { error: error?.message }
    },
    updatePassword: async (password) => {
      if (!supabase) return {}
      const { error } = await supabase.auth.updateUser({ password })
      if (!error) setRecovery(false)
      return { error: error?.message }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
