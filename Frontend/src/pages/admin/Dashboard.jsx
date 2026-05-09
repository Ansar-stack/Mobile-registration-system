import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Card, CardContent, CardHeader, CardTitle } from '../../component/ui/card';
import {
  Users, Smartphone, ShieldAlert, Bell, UserCheck, Copy, AlertTriangle, BarChart3, TrendingUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
  const chartData = data?.chartData || [];

  // Format chart data for display
  const formattedChartData = chartData.map(item => ({
    ...item,
    monthLabel: format(parseISO(item.month + '-01'), 'MMM yy'),
  }));

  const statCards = [
    { 
      title: t('dashboard.totalMobiles'), 
      value: stats.totalMobiles || 0, 
      icon: Smartphone, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      onClick: () => navigate('/admin/mobiles')
    },
    { 
      title: t('dashboard.stolenMobiles'), 
      value: stats.totalStolenMobiles || 0, 
      icon: ShieldAlert, 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      onClick: () => navigate('/admin/stolen-mobiles')
    },
    { 
      title: t('notifications.stolenTitle'), 
      value: stats.totalDetectedStolenMobiles || 0, 
      icon: AlertTriangle, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      onClick: () => navigate('/admin/detected-stolen-mobiles')
    },
    { 
      title: t('dashboard.duplicateImeiTitle'), 
      value: stats.duplicateIMEINotifications || 0, 
      icon: Copy, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      onClick: () => navigate('/admin/notifications')
    },
    { 
      title: t('dashboard.totalCustomers'), 
      value: stats.totalCustomers || 0, 
      icon: Users, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      onClick: () => navigate('/admin/customers')
    },
    { 
      title: t('dashboard.totalUsers'), 
      value: stats.totalUsers || 0, 
      icon: UserCheck, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      onClick: () => navigate('/admin/users')
    },
    { 
      title: t('dashboard.unreadNotifications'), 
      value: stats.unreadNotifications || 0, 
      icon: Bell, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50',
      onClick: () => navigate('/admin/notifications')
    },
    { 
      title: t('dashboard.systemHealth'), 
      value: t('dashboard.good'), 
      icon: BarChart3, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      onClick: null
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('dashboard.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t('dashboard.subtitle')}</p>
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
              <div className="text-2xl font-bold">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts COLUMN */}
      <div className="space-y-6">

        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <TrendingUp size={18} /> Activity
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer>
                <ComposedChart data={formattedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="mobilesRegistered" fill="#2563eb" />
                  <Bar dataKey="customersAdded" fill="#16a34a" />
                  <Line dataKey="transactions" stroke="#f97316" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex gap-2">
              <ShieldAlert size={18} /> Alerts
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer>
                <BarChart data={formattedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="monthLabel" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="stolenDetections" fill="#dc2626" />
                  <Bar dataKey="duplicateAlerts" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;