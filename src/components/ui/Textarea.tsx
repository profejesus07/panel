import { clsx } from 'clsx'
import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, rows = 3, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = id ?? generatedId

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={clsx(
            'block w-full resize-y rounded-lg border px-3.5 py-2.5 text-sm text-neutral-900 shadow-soft transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-4',
            error
              ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/10'
              : 'border-neutral-200 focus:border-brand-500 focus:ring-brand-500/10',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-danger-600">{error}</p>}
        {!error && hint && <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
