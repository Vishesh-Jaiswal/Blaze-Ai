import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, ROLE_META } from '@/config/roles';
import Spinner from '@/components/ui/Spinner';

/**
 * Guards a route: requires authentication, and optionally a specific role set
 * or permission. Redirects unauthenticated users to /login (preserving intent)
 * and unauthorized users to their role home.
 */
export default function ProtectedRoute({ children, roles, permission }) {
  const { user, initialized } = useAuthStore();
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={36} label="Restoring session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_META[user.role]?.home || '/app'} replace />;
  }

  if (permission && !hasPermission(user.role, permission)) {
    return <Navigate to={ROLE_META[user.role]?.home || '/app'} replace />;
  }

  return children;
}
