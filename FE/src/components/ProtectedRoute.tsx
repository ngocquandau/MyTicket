import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserRole } from '../utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

const getDefaultPathByRole = (role: string | null) => {
  if (role === 'admin') return '/admin/events';
  if (role === 'organizer') return '/organizer/events';
  if (role === 'user') return '/my-tickets';
  return '/';
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, redirectTo = '/' }) => {
  const role = getUserRole();

  if (!role) {
    // Chưa đăng nhập, chuyển về home
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Không có quyền, chuyển về trang đúng theo role
    const fallback = redirectTo !== '/' ? redirectTo : getDefaultPathByRole(role);
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;