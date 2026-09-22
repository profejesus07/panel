import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('animate-spin text-brand-600', className)} />
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <Spinner className="h-8 w-8" />
    </div>
  )
}
