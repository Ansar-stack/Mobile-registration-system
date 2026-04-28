import React, { lazy } from 'react';

// Auth Pages
const Login = lazy(() => import('@/pages/auth/Login.jsx'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword.jsx'));

// User Pages
const CreateEntry = lazy(() => import('@/pages/user/CreateEntry.jsx'));

// Admin Pages
const Dashboard = lazy(() => import('@/pages/admin/Dashboard.jsx'));
const Customers = lazy(() => import('@/pages/admin/Customer.jsx'));
const Mobiles = lazy(() => import('@/pages/admin/Mobiles.jsx'));
const Transactions = lazy(() => import('@/pages/admin/Transactions.jsx'));
const Notifications = lazy(() => import('@/pages/admin/Notifications.jsx'));
const StolenMobiles = lazy(() => import('@/pages/admin/StolenMobiles.jsx'));
const Users = lazy(() => import('@/pages/admin/Users.jsx'));

export const routes = [
  {
    path: '/',
    element: <Login />,
    isPublic: true,
  },
  {
    path: '/login',
    element: <Login />,
    isPublic: true,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
    isPublic: true,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
    isPublic: true,
  },
  {
    path: '/user',
    allowedRoles: ['user'],
    children: [
      {
        path: 'entry',
        element: <CreateEntry />,
      },
    ],
  },
  {
    path: '/admin',
    allowedRoles: ['admin'],
    children: [
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'customers',
        element: <Customers />,
      },
      {
        path: 'mobiles',
        element: <Mobiles />,
      },
      {
        path: 'transactions',
        element: <Transactions />,
      },
      {
        path: 'stolen-mobiles',
        element: <StolenMobiles />,
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
    ],
  },
];