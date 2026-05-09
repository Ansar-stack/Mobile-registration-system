import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const APP_NAME = 'Mobile Registration System';

const ROUTE_TITLES = {
  '/':                            'Login',
  '/login':                       'Login',
  '/forgot-password':             'Forgot Password',
  '/reset-password':              'Reset Password',
  '/admin/dashboard':             'Dashboard',
  '/admin/users':                 'Users',
  '/admin/customers':             'Customers',
  '/admin/mobiles':               'Mobiles',
  '/admin/transactions':          'Transactions',
  '/admin/stolen-mobiles':        'Stolen Mobiles',
  '/admin/detected-stolen-mobiles': 'Detected Stolen Mobiles',
  '/admin/notifications':         'Notifications',
  '/user/entry':                  'Create Entry',
};

export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Handle dynamic routes like /admin/users/:id
    let title = ROUTE_TITLES[pathname];
    if (!title && pathname.startsWith('/admin/users/')) title = 'User Details';

    document.title = title ? `${title} — ${APP_NAME}` : APP_NAME;
  }, [pathname]);
}
