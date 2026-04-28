import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  ShieldAlert,
  Bell, 
  LogOut, 
  PlusCircle,
  Menu,
  X,
  UserCog
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

const Sidebar = ({ role }) => {
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const adminLinks = [
    { name: 'Dashboard',      icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Users',          icon: UserCog,         path: '/admin/users' },
    { name: 'Customers',      icon: Users,           path: '/admin/customers' },
    { name: 'Mobiles',        icon: Smartphone,      path: '/admin/mobiles' },
    { name: 'Stolen Mobiles', icon: ShieldAlert,     path: '/admin/stolen-mobiles' },
    { name: 'Notifications',  icon: Bell,            path: '/admin/notifications' },
  ];

  const userLinks = [
    { name: 'Create Entry', icon: PlusCircle, path: '/user/entry' },
  ];

  const links = role === 'admin' ? adminLinks : userLinks;

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-background"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r flex flex-col transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <h1 className="text-base font-bold tracking-tight leading-tight">Mobile Registration</h1>
          <p className="text-xs text-muted-foreground">Management System</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="relative group cursor-pointer" onClick={logout}>
              <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold uppercase select-none">
                {user?.email?.[0] || user?.name?.[0] || '?'}
              </div>
              <div className="absolute inset-0 rounded-full bg-destructive/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <LogOut className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
