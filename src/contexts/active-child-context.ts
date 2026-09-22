import { createContext } from 'react'
import type { StudentWithCourse } from '@/services/students.service'

export interface ActiveChildContextValue {
  children: StudentWithCourse[]
  activeChild: StudentWithCourse | null
  setActiveChildId: (id: string) => void
  loading: boolean
}

export const ActiveChildContext = createContext<ActiveChildContextValue | undefined>(undefined)
