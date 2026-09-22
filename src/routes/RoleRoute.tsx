import { Navigate, Outlet } from 'react-router-dom'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/database.types'
import { homePathForRole } from '@/utils/roles'

export function RoleRoute({ allowed }: { allowed: UserRole[] }) {
  const { role, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!role) return <Navigate to="/login" replace />
  if (!allowed.includes(role)) return <Navigate to={homePathForRole(role)} replace />

  return <Outlet />
}
