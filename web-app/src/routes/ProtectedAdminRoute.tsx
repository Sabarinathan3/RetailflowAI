import { Navigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '@/store/admin.store';
import type { ReactNode } from 'react';

interface ProtectedAdminRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredRole?: string | string[];
}

/**
 * Protected Admin Route
 * Ensures only authenticated admins with required permissions/roles can access
 */
export const ProtectedAdminRoute = ({
  children,
  requiredPermission,
  requiredRole,
}: ProtectedAdminRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, admin, hasPermission, hasRole } = useAdminStore();

  // Not authenticated
  if (!isAuthenticated || !admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Check permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this resource
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Only {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole} can access this resource
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
