import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageSpinner } from '@/components/ui/Spinner'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
