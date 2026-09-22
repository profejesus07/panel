import { useContext } from 'react'
import { ActiveChildContext } from '@/contexts/active-child-context'

export function useActiveChild() {
  const ctx = useContext(ActiveChildContext)
  if (!ctx) throw new Error('useActiveChild debe usarse dentro de <ActiveChildProvider>')
  return ctx
}
