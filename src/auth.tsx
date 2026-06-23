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
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isCloud)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => sub.subscription.unsubscribe()
  }, [])

  const value: AuthValue = {
    isCloud,
    loading,
    session,
    user: session?.user ?? null,
    signIn: async (email, password) => {
      if (!supabase) return {}
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message }
    },
    signUp: async (email, password) => {
      if (!supabase) return {}
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }
      // If email confirmation is on, no session is returned until the user confirms.
      return { needsConfirm: !data.session }
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
