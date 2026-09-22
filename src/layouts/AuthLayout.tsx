import { GraduationCap } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { useSchoolSettings } from '@/hooks/useSchoolSettings'

export function AuthLayout() {
  const { settings } = useSchoolSettings()
  const schoolName = settings?.name ?? 'Panel Escolar'
  const tagline = settings?.motto ?? 'Sistema de gestión institucional'

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={schoolName}
              className="h-14 w-14 rounded-xl object-contain shadow-sm"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
              <GraduationCap className="h-7 w-7" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{schoolName}</h1>
            <p className="text-sm text-neutral-500">{tagline}</p>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
