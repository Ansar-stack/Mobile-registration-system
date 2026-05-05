import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Card, CardContent, CardHeader, CardTitle } from '../../component/ui/card';
import {
  Users, Smartphone, ShieldAlert, Bell, UserCheck, Copy, AlertTriangle, BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const response = await dashboardService.getStats();
      setData(response.data.data);
    } catch {}
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (isLoading) return <SectionLoader />;

  const stats = data?.stats || {};
  const recentDetectedStolenMobiles = data?.recentDetectedStolenMobiles || [];
  const recentDuplicateIMEIs = data?.recentDuplicateIMEIs || [];

  const statCards = [
    { 
      title: 'Total Mobiles', 
      value: stats.totalMobiles || 0, 
      icon: Smartphone, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      onClick: () => navigate('/admin/mobiles')
    },
    { 
      title: 'Stolen Mobiles', 
      value: stats.totalStolenMobiles || 0, 
      icon: ShieldAlert, 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      onClick: () => navigate('/admin/stolen-mobiles')
    },
    { 
      title: 'Stolen Mobile Detected', 
      value: stats.totalDetectedStolenMobiles || 0, 
      icon: AlertTriangle, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      onClick: () => navigate('/admin/detected-stolen-mobiles')
    },
    { 
      title: 'Duplicate IMEI Detected', 
      value: stats.duplicateIMEINotifications || 0, 
      icon: Copy, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      onClick: () => navigate('/admin/notifications')
    },
    { 
      title: 'Total Customers', 
      value: stats.totalCustomers || 0, 
      icon: Users, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      onClick: () => navigate('/admin/customers')
    },
    { 
      title: 'Total Users', 
      value: stats.totalUsers || 0, 
      icon: UserCheck, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      onClick: () => navigate('/admin/users')
    },
    { 
      title: 'Unread Notifications', 
      value: stats.unreadNotifications || 0, 
      icon: Bell, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50',
      onClick: () => navigate('/admin/notifications')
    },
    { 
      title: 'System Health', 
      value: 'Good', 
      icon: BarChart3, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      onClick: null
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of your mobile registration system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card) => (
          <Card 
            key={card.title} 
            className="border shadow-none hover:shadow-sm transition-shadow cursor-pointer"
            onClick={card.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4 sm:p-5">
              <CardTitle className="text-xs font-medium text-muted-foreground leading-tight pr-2">
                {card.title}
              </CardTitle>
              <div className={cn('shrink-0 p-2 rounded-lg', card.bg, card.color)}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0">
              <div className="text-2xl font-bold">{card.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Detected Stolen Mobiles */}
      <Card className="border shadow-none">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Recent Stolen Mobile Detections
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentDetectedStolenMobiles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No stolen mobile detections yet</p>
          ) : (
            <div className="divide-y">
              {recentDetectedStolenMobiles.map((detection) => (
                <div key={detection.id} className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-3 gap-2 sm:gap-3">
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={cn('shrink-0 mt-0.5 sm:mt-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', 'bg-red-100', 'text-red-700')}>
                      STOLEN
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {detection.stolenMobile?.brand} {detection.stolenMobile?.model} → {detection.mobile?.brand} {detection.mobile?.model}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Reporter: {detection.stolenMobile?.reporterName} · 
                        IMEI: {detection.stolenMobile?.imei1} · 
                        User: {detection.transaction?.user?.name || detection.transaction?.user?.email || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {detection.detectedAt ? formatDistanceToNow(new Date(detection.detectedAt), { addSuffix: true }) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Duplicate IMEIs */}
      <Card className="border shadow-none">
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Copy className="h-5 w-5 text-purple-500" />
            Recent Duplicate IMEI Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentDuplicateIMEIs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No duplicate IMEI alerts yet</p>
          ) : (
            <div className="divide-y">
              {recentDuplicateIMEIs.map((notification) => (
                <div key={notification.id} className="flex items-start sm:items-center justify-between px-4 sm:px-6 py-3 gap-2 sm:gap-3">
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className={cn('shrink-0 mt-0.5 sm:mt-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', 'bg-purple-100', 'text-purple-700')}>
                      DUPLICATE
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notification.mobile?.brand} {notification.mobile?.model}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        IMEI: {notification.imei} · 
                        Transactions: {notification.mobile?.transactions?.length || 0} · 
                        Users: {[...new Set(notification.mobile?.transactions?.map(tx => tx.user?.name || tx.user?.email) || [])].join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;