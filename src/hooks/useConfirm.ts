import { useContext } from 'react'
import { ConfirmContext } from '@/contexts/confirm-context'

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>')
  return ctx.confirm
}
