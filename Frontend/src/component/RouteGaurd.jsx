import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultPath = user.role === 'admin' ? '/admin/dashboard' : '/user/entry';
    return <Navigate to={defaultPath} replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
    </div>
  );

  if (user) {
    const defaultPath = user.role === 'admin' ? '/admin/dashboard' : '/user/entry';
    return <Navigate to={defaultPath} replace />;
  }

  return <Outlet />;
};