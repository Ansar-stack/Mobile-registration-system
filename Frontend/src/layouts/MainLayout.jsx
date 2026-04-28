import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../component/Sidebar';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar role={user?.role} />
      <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;