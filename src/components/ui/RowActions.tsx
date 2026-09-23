import { clsx } from 'clsx'
import { MoreVertical } from 'lucide-react'
import { useState, type ReactNode } from 'react'

export interface RowAction {
  label: string
  icon?: ReactNode
  onClick: () => void
  variant?: 'default' | 'danger'
}

export function RowActions({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
        aria-label="Más acciones"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="animate-in-pop absolute right-0 z-20 mt-1 w-44 rounded-xl border border-neutral-200/80 bg-white py-1 shadow-elevated">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  setOpen(false)
                  action.onClick()
                }}
                className={clsx(
                  'flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm hover:bg-neutral-50',
                  action.variant === 'danger' ? 'text-danger-600' : 'text-neutral-700',
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
