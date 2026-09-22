import { Navigate } from 'react-router-dom'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'
import { homePathForRole } from '@/utils/roles'

export function RoleHomeRedirect() {
  const { session, role, loading } = useAuth()

  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />
  if (!role) return <FullPageSpinner />

  return <Navigate to={homePathForRole(role)} replace />
}
