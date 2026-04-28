import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services';
import { Card, CardContent, CardHeader, CardTitle } from '../../component/ui/card';
import {
  Users, Smartphone, ArrowLeftRight, ShieldAlert, Bell, UserCheck, Loader2,
  TrendingUp, TrendingDown, Unlock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await dashboardService.getStats();
        setData(response.data.data);
      } catch {
        // silently fail — cards will show 0
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = data?.stats || {};

  const statCards = [
    { title: 'Total Customers',    value: stats.totalCustomers    ?? 0, icon: Users,          color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { title: 'Total Users',        value: stats.totalUsers        ?? 0, icon: UserCheck,       color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Total Transactions', value: stats.totalTransactions ?? 0, icon: ArrowLeftRight,  color: 'text-green-600',  bg: 'bg-green-50'  },
    { title: 'Buy Transactions',   value: stats.totalBuy          ?? 0, icon: TrendingUp,      color: 'text-emerald-600',bg: 'bg-emerald-50'},
    { title: 'Sell Transactions',  value: stats.totalSell         ?? 0, icon: TrendingDown,    color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Unlock Transactions',value: stats.totalUnlock       ?? 0, icon: Unlock,          color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Stolen Mobiles',     value: stats.totalStolenMobiles?? 0, icon: ShieldAlert,     color: 'text-red-600',    bg: 'bg-red-50'    },
    { title: 'Unread Notifications',value: stats.unreadNotifications??0,icon: Bell,            color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  // shape graph data for recharts
  const graphData = (data?.graph || []).map((row) => ({
    month: MONTHS[row.month - 1],
    BUY:    row.BUY    || 0,
    SELL:   row.SELL   || 0,
    UNLOCK: row.UNLOCK || 0,
  }));

  const recentTransactions = data?.recentTransactions || [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your business performance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="border shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={cn('p-2 rounded-lg', card.bg, card.color)}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Transactions Chart */}
      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Monthly Transactions ({new Date().getFullYear()})</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={graphData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend />
              <Bar dataKey="BUY"    fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SELL"   fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="UNLOCK" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet.</p>
          ) : (
            <div className="divide-y">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                      'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                      tx.type === 'BUY'    ? 'bg-emerald-100 text-emerald-700' :
                      tx.type === 'SELL'   ? 'bg-blue-100 text-blue-700' :
                                            'bg-purple-100 text-purple-700'
                    )}>
                      {tx.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {tx.mobile?.brand} {tx.mobile?.model}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tx.customer ? `${tx.customer.firstName} ${tx.customer.lastName}` : 'No customer'} · {tx.user?.name || tx.user?.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{tx.price ? `$${tx.price}` : '—'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true })}
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
