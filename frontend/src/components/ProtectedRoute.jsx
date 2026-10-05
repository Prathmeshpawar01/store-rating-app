import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

/**
 * Guards a group of routes.
 *  - Not logged in            -> /login (remembering where the user wanted to go)
 *  - Logged in, wrong role    -> the user's own dashboard
 * The backend enforces the same rules on every API call; this only keeps the UI honest.
 */
export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user, checking, homePath } = useAuth();
  const location = useLocation();

  if (checking) return <Loading full label="Checking your session…" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePath} replace />;
  }

  return <Outlet />;
}

/** Login / register: send signed-in users to their dashboard instead. */
export function PublicOnlyRoute() {
  const { isAuthenticated, checking, homePath } = useAuth();
  if (checking) return <Loading full label="Checking your session…" />;
  return isAuthenticated ? <Navigate to={homePath} replace /> : <Outlet />;
}
