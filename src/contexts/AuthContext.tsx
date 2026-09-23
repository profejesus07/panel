import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { guardianAuthEmail, studentAuthEmail } from '@/utils/authIdentifiers'
import { getAuthErrorMessage } from '@/utils/errors'
import { isValidEmail } from '@/utils/validation'
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

  // El admin inicia sesión con su correo real. Estudiantes y padres lo hacen
  // con un usuario (código estudiantil o documento) sin dominio, así que no
  // hay forma de saber su rol de antemano: se intenta primero como si fuera
  // estudiante y, si falla, como si fuera padre. Supabase responde el mismo
  // error genérico en ambos casos (no revela si el usuario existe o no), así
  // que intentar dos veces no cambia el mensaje final que ve la persona.
  async function signIn(identifier: string, password: string) {
    const trimmed = identifier.trim()

    if (isValidEmail(trimmed)) {
      const { error } = await supabase.auth.signInWithPassword({ email: trimmed, password })
      return { error: error ? getAuthErrorMessage(error.message) : null }
    }

    const asStudent = await supabase.auth.signInWithPassword({
      email: studentAuthEmail(trimmed),
      password,
    })
    if (!asStudent.error) return { error: null }

    const asGuardian = await supabase.auth.signInWithPassword({
      email: guardianAuthEmail(trimmed),
      password,
    })
    if (!asGuardian.error) return { error: null }

    return { error: getAuthErrorMessage(asGuardian.error.message) }
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
