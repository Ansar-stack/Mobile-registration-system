import React, { useState, useEffect } from 'react';
import { notificationService } from '../../services';
import { Card, CardContent } from '../../component/ui/card';
import { Button } from '../../component/ui/button';
import { Bell, Info, AlertTriangle, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await notificationService.getAll();
      setNotifications(response.data.data?.items || response.data.data || []);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const handleDeleteAllRead = async () => {
    try {
      await notificationService.deleteAllRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success('All read notifications deleted');
    } catch {
      toast.error('Failed to delete read notifications');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'WARNING': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'SUCCESS': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'INFO':    return <Info className="h-5 w-5 text-blue-500" />;
      default:        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-sm text-muted-foreground">Stay updated with the latest system activities.</p>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDeleteAllRead} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              Delete all read
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <p>No notifications at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                'border shadow-none transition-colors',
                !notif.isRead && 'bg-accent/40'
              )}
            >
              <CardContent className="p-4 flex gap-4 items-start">
                <div className="shrink-0 mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className={cn('text-sm', !notif.isRead && 'font-semibold')}>{notif.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase shrink-0">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!notif.isRead && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => handleMarkAsRead(notif.id)}>
                      Mark read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(notif.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 cursor-pointer" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
