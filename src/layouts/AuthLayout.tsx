import { GraduationCap } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { useSchoolSettings } from '@/hooks/useSchoolSettings'

export function AuthLayout() {
  const { settings } = useSchoolSettings()
  const schoolName = settings?.name ?? 'Panel Escolar'
  const tagline = settings?.motto ?? 'Sistema de gestión institucional'

  return (
    <div className="bg-mesh relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-950/95 to-brand-950" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={schoolName}
              className="h-14 w-14 rounded-xl object-contain shadow-elevated"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 text-white shadow-brand ring-1 ring-accent-300/30">
              <GraduationCap className="h-7 w-7" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white">{schoolName}</h1>
            <p className="text-sm text-neutral-400">{tagline}</p>
          </div>
        </div>
        <div className="animate-in-pop rounded-2xl border border-white/10 bg-white p-8 shadow-elevated">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
