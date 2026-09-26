import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function ProtectedRoute() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function RoleRoute({ roles, children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  const userRoles = user.roles || (user.role ? [user.role] : [])
  return roles.some((role) => userRoles.includes(role)) ? children : <Navigate to="/" replace />
}
