import { GraduationCap } from 'lucide-react'
import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Panel Escolar</h1>
            <p className="text-sm text-neutral-500">Sistema de gestión institucional</p>
          </div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
