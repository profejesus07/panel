import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { clsx } from 'clsx'
import { ToastContext, type ToastItem, type ToastVariant } from './toast-context'

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-success-500/30 bg-white text-neutral-900',
  error: 'border-danger-500/30 bg-white text-neutral-900',
  info: 'border-brand-500/30 bg-white text-neutral-900',
}

const VARIANT_ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 shrink-0 text-success-600" />,
  error: <AlertCircle className="h-5 w-5 shrink-0 text-danger-600" />,
  info: <Info className="h-5 w-5 shrink-0 text-brand-600" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, variant, message }])
      setTimeout(() => dismiss(id), 5000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={clsx(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg',
              VARIANT_STYLES[toast.variant],
            )}
          >
            {VARIANT_ICONS[toast.variant]}
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="text-neutral-400 hover:text-neutral-600"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
