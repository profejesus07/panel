import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

type Variant = 'neutral' | 'brand' | 'success' | 'danger' | 'warning' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  neutral: 'bg-neutral-100 text-neutral-700 ring-1 ring-inset ring-neutral-200',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200/60',
  success: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20',
  danger: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20',
  warning: 'bg-warning-50 text-warning-600 ring-1 ring-inset ring-warning-500/25',
  info: 'bg-info-50 text-info-600 ring-1 ring-inset ring-info-500/20',
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
