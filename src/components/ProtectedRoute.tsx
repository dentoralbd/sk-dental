import { Navigate } from 'react-router-dom'
import clinicConfig from '@/config/clinic.json'
import { getAppRole } from '@/lib/appSession'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = localStorage.getItem(clinicConfig.storageKeys.auth) === 'true'

  if (!isAuthenticated || !getAppRole()) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
