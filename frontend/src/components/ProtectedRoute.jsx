import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { PageLoader } from './Spinner'

/**
 * Route guard.
 *  - `requireAuth`  : must be logged in
 *  - `requireAdmin` : must be an ADMIN (the Employee role is deliberately excluded)
 *  - `blockOnboarding`: send the user to finish onboarding first
 */
export default function ProtectedRoute({ children, requireAuth = true, requireAdmin = false, blockOnboarding = false }) {
  const { isLoggedIn, isAdmin, checking, needsOnboarding, user } = useAuth()
  const location = useLocation()

  if (checking) return <PageLoader label="Checking your session..." />

  if (requireAuth && !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  if (blockOnboarding && needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  // A seeded or admin-reset account must set a new password before it can be used.
  // /profile is the only page allowed while this is pending.
  if (isLoggedIn && user?.mustChangePassword && location.pathname !== '/profile') {
    return <Navigate to="/profile" replace />
  }

  // A guard used as a layout route (no children) must render the nested route.
  if (children) return children

  return <Outlet />
}
