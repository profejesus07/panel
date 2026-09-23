import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { NavItem } from '@/routes/navigation'
import { BrandLogo } from './BrandLogo'

interface SidebarProps {
  basePath: string
  items: NavItem[]
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ basePath, items, mobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-brand-950 transition-transform duration-200 print:hidden lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div className="leading-tight">
              <span className="block text-sm font-bold text-white">Panel Escolar</span>
              <span className="block text-[11px] font-medium uppercase tracking-wider text-accent-300/80">
                Gestión docente
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1.5 text-brand-200 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const href = item.segment ? `${basePath}/${item.segment}` : basePath
            const Icon = item.icon
            return (
              <NavLink
                key={href}
                to={href}
                end={item.segment === ''}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-700 text-white shadow-sm'
                      : 'text-brand-100/80 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
