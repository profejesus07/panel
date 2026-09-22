import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

type Variant = 'neutral' | 'brand' | 'success' | 'danger' | 'warning'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-success-50 text-success-700',
  danger: 'bg-danger-50 text-danger-700',
  warning: 'bg-warning-50 text-warning-600',
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
