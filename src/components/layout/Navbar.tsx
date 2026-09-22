import { ChevronDown, LogOut, Menu, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { USER_ROLE_LABELS } from '@/utils/labels'

export function Navbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 print:hidden sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden lg:block" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-neutral-100"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <UserIcon className="h-4 w-4" />
          </div>
          <span className="hidden text-left sm:block">
            <span className="block font-medium text-neutral-900">
              {profile?.fullName ?? 'Usuario'}
            </span>
            <span className="block text-xs text-neutral-500">
              {profile ? USER_ROLE_LABELS[profile.role] : ''}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-neutral-400" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
