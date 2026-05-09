import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../component/common/LanguageSwitcher';

const TITLES = {
  '/login':           { title: 'auth.signIn',                sub: 'auth.systemName' },
  '/':                { title: 'auth.signIn',                sub: 'auth.systemName' },
  '/forgot-password': { title: 'forgotPassword.sendResetLink', sub: 'auth.systemName' },
  '/reset-password':  { title: 'resetPassword.resetBtn',      sub: 'auth.systemName' },
};

const AuthLayout = () => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const isRtl = i18n.language === 'ps';
  const meta = TITLES[pathname] || TITLES['/login'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4 relative">
      <div className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'}`}>
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md bg-background border rounded-lg p-6 sm:p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">{t(meta.title)}</h1>
          <p className="text-center text-gray-600 text-sm">{t(meta.sub)}</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
