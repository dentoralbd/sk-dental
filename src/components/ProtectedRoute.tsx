import { Navigate } from 'react-router-dom'
import clinicConfig from '@/config/clinic.json'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = localStorage.getItem(clinicConfig.storageKeys.auth) === 'true'

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
