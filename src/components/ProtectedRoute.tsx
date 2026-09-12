import { useTranslation } from '../i18n/useTranslation';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../auth/AuthContext';
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}
export default function ProtectedRoute({
  children,
  allowedRoles
}: ProtectedRouteProps) {
  const {
    t
  } = useTranslation();
  const {
    user,
    isAuthenticated,
    isLoading
  } = useContext(AuthContext);
  if (isLoading) {
    return <div className="auth-loading-screen">
        <div className="auth-loading-spinner"></div>
        <p>{t("Loading...")}</p>
      </div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization if restricted
  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = user?.role || 'farmer';
    if (!allowedRoles.includes(currentRole)) {
      // Role not authorized – redirect to permitted home
      return <Navigate to="/" replace />;
    }
  }
  return <>{children}</>;
}