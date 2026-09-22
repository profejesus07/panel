import type { Session, User } from '@supabase/supabase-js'
import { createContext } from 'react'
import type { UserRole } from '@/types/database.types'

export interface Profile {
  id: string
  role: UserRole
  fullName: string
  email: string
  avatarUrl: string | null
}

export interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
