import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserRole } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, redirectTo = '/' }) => {
  const role = getUserRole();

  if (!role) {
    // Chưa đăng nhập, chuyển về home
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Không có quyền, chuyển về home hoặc trang phù hợp
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;