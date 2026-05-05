import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../component/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../component/common/LanguageSwitcher';

const MainLayout = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ps';

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar role={user?.role} />
      <main className={`flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 ${isRtl ? 'lg:mr-64' : 'lg:ml-64'}`}>
        <div className="max-w-6xl mx-auto w-full relative">
          <div className={`absolute -top-6 ${isRtl ? 'left-0' : 'right-0'}`}>
            <LanguageSwitcher />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
