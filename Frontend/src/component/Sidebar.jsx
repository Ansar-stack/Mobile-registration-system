import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Smartphone, ShieldAlert, Bell, LogOut,
  PlusCircle, Menu, X, UserCog, KeyRound, Eye, EyeOff, Loader2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter,
} from './ui/dialog';
import { notificationService, authService } from '../services';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ role }) => {
  const { logout, user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ps';
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const menuRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (role !== 'admin') return;
    const fetchUnread = async () => {
      if (location.pathname === '/admin/notifications') { setUnreadCount(0); return; }
      try {
        const res = await notificationService.getAll({ limit: 1, isRead: false });
        setUnreadCount(res?.data?.data?.unreadCount ?? 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [role, location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const adminLinks = [
    { name: t('sidebar.dashboard'),     icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: t('sidebar.users'),         icon: UserCog,         path: '/admin/users' },
    { name: t('sidebar.customers'),     icon: Users,           path: '/admin/customers' },
    { name: t('sidebar.mobiles'),       icon: Smartphone,      path: '/admin/mobiles' },
    { name: t('sidebar.stolenMobiles'), icon: ShieldAlert,     path: '/admin/stolen-mobiles' },
    { name: t('sidebar.notifications'), icon: Bell,            path: '/admin/notifications' },
  ];

  const userLinks = [
    { name: t('sidebar.createEntry'), icon: PlusCircle, path: '/user/entry' },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  const validate = () => {
    const e = {};
    if (!form.currentPassword) e.currentPassword = t('sidebar.required');
    if (!form.newPassword) e.newPassword = t('sidebar.required');
    else if (form.newPassword.length < 8) e.newPassword = t('sidebar.minChars');
    if (!form.confirmPassword) e.confirmPassword = t('sidebar.required');
    else if (form.newPassword !== form.confirmPassword) e.confirmPassword = t('sidebar.passwordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await authService.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success(t('sidebar.passwordChanged'));
      setIsChangePassOpen(false);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch (err) {
      toast.error(err?.response?.data?.message || t('sidebar.passwordChangeFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChangePass = () => {
    setMenuOpen(false);
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    setIsChangePassOpen(true);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className={`lg:hidden fixed top-4 ${isRtl ? 'right-4' : 'left-4'} z-50`}>
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-background">
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        'fixed inset-y-0 z-40 w-64 bg-background border-r flex flex-col transition-transform duration-300 lg:translate-x-0',
        isRtl ? 'right-0 border-l border-r-0' : 'left-0',
        isOpen ? 'translate-x-0' : (isRtl ? 'translate-x-full' : '-translate-x-full'),
      )}>
        <div className="p-6">
          <h1 className="text-base font-bold tracking-tight leading-tight">{t('sidebar.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('sidebar.subtitle')}</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <div className="relative">
                <link.icon className="h-4 w-4" />
                {link.path === '/admin/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
              {link.name}
              {link.path === '/admin/notifications' && unreadCount > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t" ref={menuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold uppercase select-none shrink-0">
                {user?.name?.[0] || user?.email?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </button>

            {menuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border rounded-md shadow-lg overflow-hidden z-50">
                <button
                  type="button"
                  onClick={openChangePass}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  {t('sidebar.changePassword')}
                </button>
                <div className="border-t" />
                <button
                  type="button"
                  onClick={async () => { await logout(); navigate('/login', { replace: true }); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 hover:text-red-600 transition-colors text-left text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  {t('sidebar.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Change Password Modal */}
      <Dialog open={isChangePassOpen} onOpenChange={(open) => { setIsChangePassOpen(open); if (!open) setErrors({}); }}>
        <DialogContent className="max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t('sidebar.changePassword')}</DialogTitle>
            <DialogDescription>{t('sidebar.changePasswordDesc')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label>{t('sidebar.currentPassword')}</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder={t('sidebar.currentPasswordPlaceholder')}
                  value={form.currentPassword}
                  onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  className={cn('pr-10', errors.currentPassword && 'border-destructive')}
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('sidebar.newPassword')}</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  placeholder={t('sidebar.newPasswordPlaceholder')}
                  value={form.newPassword}
                  onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className={cn('pr-10', errors.newPassword && 'border-destructive')}
                />
                <button type="button" onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label>{t('sidebar.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder={t('sidebar.confirmPasswordPlaceholder')}
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                  className={cn('pr-10', errors.confirmPassword && 'border-destructive')}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsChangePassOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('sidebar.changePassword')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;
