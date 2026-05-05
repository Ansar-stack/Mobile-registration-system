import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../component/common/LanguageSwitcher';

const AuthLayout = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ps';

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4 relative">
      <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'}`}>
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md bg-background border rounded-lg p-6 sm:p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">{t('auth.signIn')}</h1>
          <p className="text-center text-gray-600 text-sm">{t('auth.systemName')}</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
