import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './component/RouteGaurd';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import { routes } from './routes';
import { usePageTitle } from './lib/usePageTitle';

const App = () => {
  usePageTitle();

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="h-8 w-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" /></div>}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            {routes
              .filter((route) => route.isPublic)
              .map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
          </Route>
        </Route>

        {/* Protected Routes */}
        {routes
          .filter((route) => !route.isPublic)
          .map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<ProtectedRoute allowedRoles={route.allowedRoles} />}
            >
              <Route element={<MainLayout />}>
                {route.children.map((child) => (
                  <Route
                    key={child.path}
                    path={child.path}
                    element={child.element}
                  />
                ))}
              </Route>
            </Route>
          ))}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
