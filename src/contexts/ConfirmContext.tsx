import { AlertTriangle } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmContext, type ConfirmOptions } from './confirm-context'

interface PendingConfirm {
  options: ConfirmOptions
  resolve: (result: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve })
    })
  }, [])

  function handleResolve(result: boolean) {
    pending?.resolve(result)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-neutral-900/50"
            onClick={() => handleResolve(false)}
            aria-hidden="true"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
          >
            <div
              className={
                pending.options.variant === 'danger'
                  ? 'mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 text-danger-600'
                  : 'mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700'
              }
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-neutral-900">{pending.options.title}</h2>
            {pending.options.description && (
              <p className="mt-1.5 text-sm text-neutral-500">{pending.options.description}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => handleResolve(false)}>
                {pending.options.cancelLabel ?? 'Cancelar'}
              </Button>
              <Button
                variant={pending.options.variant === 'danger' ? 'danger' : 'primary'}
                onClick={() => handleResolve(true)}
              >
                {pending.options.confirmLabel ?? 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
