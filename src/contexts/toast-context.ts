import { createContext } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  variant: ToastVariant
  message: string
}

export interface ToastContextValue {
  showToast: (variant: ToastVariant, message: string) => void
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined)
