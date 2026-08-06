import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../context/useAdminAuth'

export default function RequireAdminRoles({ children, allowedRoles }) {
  const { admin, isAuthenticated, loading } = useAdminAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  if (admin && !allowedRoles.includes(admin.role)) {
    // Redirect to admin dashboard if role is unauthorized
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}
