import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isSessionExpired, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={isSessionExpired ? '/login?reason=session_expired' : '/login'} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
