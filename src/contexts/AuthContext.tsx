import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { getAuthErrorMessage } from '@/utils/errors'
import { AuthContext, type AuthContextValue, type Profile } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue['session'] | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (!newSession) setProfile(null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    let active = true

    supabase
      .from('profiles')
      .select('id, role, full_name, email, avatar_url')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (!active) return
        setProfile(
          error || !data
            ? null
            : {
                id: data.id,
                role: data.role,
                fullName: data.full_name,
                email: data.email,
                avatarUrl: data.avatar_url,
              },
        )
      })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: getAuthErrorMessage(error.message) }
    return { error: null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  const loading = session === undefined || (session !== null && profile === undefined)

  const value: AuthContextValue = {
    user: session?.user ?? null,
    session: session ?? null,
    profile: profile ?? null,
    role: profile?.role ?? null,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
