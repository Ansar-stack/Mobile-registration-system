import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md bg-background border rounded-lg p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Sign In</h1>
          <p className="text-center text-gray-600 text-sm mb-6">Mobile Registry System</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;