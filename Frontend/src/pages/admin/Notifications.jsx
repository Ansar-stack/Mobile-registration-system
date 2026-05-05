import { useState, useEffect } from 'react';
import { notificationService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../component/ui/dialog';
import { Bell, Copy, Trash2, CheckCheck, Check, ShieldAlert, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

const NOTIF_META = {
  STOLEN_MATCH: {
    icon: ShieldAlert,
    iconCls: 'text-red-500',
    badgeCls: 'bg-red-100 text-red-700',
    cardCls: 'border-red-200 bg-red-50/40',
    label: 'Stolen Match',
  },
  DUPLICATE_IMEI: {
    icon: Copy,
    iconCls: 'text-orange-500',
    badgeCls: 'bg-orange-100 text-orange-700',
    cardCls: 'border-orange-200 bg-orange-50/40',
    label: 'Duplicate IMEI',
  },
};

const getMeta = (type) => NOTIF_META[type] || {
  icon: Bell,
  iconCls: 'text-muted-foreground',
  badgeCls: 'bg-muted text-muted-foreground',
  cardCls: '',
  label: type || 'Info',
};

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function NotificationDetailModal({ notif, open, onClose }) {
  if (!notif) return null;
  const { mobile, registeredBy } = notif;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4 text-orange-500" />
            Duplicate IMEI Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Alert message */}
          <div className="rounded-lg bg-orange-50 border border-orange-200 px-4 py-3">
            <p className="text-sm text-orange-800">{notif.message}</p>
            <p className="text-xs text-orange-500 mt-1">
              {notif.createdAt ? format(new Date(notif.createdAt), 'MMM dd, yyyy · HH:mm') : '—'}
            </p>
          </div>

          {/* Mobile info */}
          {mobile && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mobile Details</p>
              <div className="rounded-lg border px-4 py-1">
                <DetailRow label="IMEI 1" value={mobile.imei1} />
                <DetailRow label="IMEI 2" value={mobile.imei2} />
                <DetailRow label="Brand" value={mobile.brand} />
                <DetailRow label="Model" value={mobile.model} />
                <DetailRow label="Color" value={mobile.color} />
                <DetailRow label="RAM" value={mobile.ram} />
                <DetailRow label="Storage" value={mobile.storage} />
                <DetailRow label="Registered" value={mobile.createdAt ? format(new Date(mobile.createdAt), 'MMM dd, yyyy · HH:mm') : null} />
              </div>
            </div>
          )}

          {/* Registered by */}
          {registeredBy && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Registered By</p>
              <div className="rounded-lg border px-4 py-1">
                <DetailRow label="Name" value={registeredBy.name} />
                <DetailRow label="Email" value={registeredBy.email} />
                <DetailRow label="Phone" value={registeredBy.phone} />
                <DetailRow label="Shop No." value={registeredBy.shopNumber} />
              </div>
            </div>
          )}

          {/* All transactions on this mobile */}
          {mobile?.transactions?.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                All Registrations ({mobile.transactions.length})
              </p>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mobile.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted">{tx.type}</span>
                        </TableCell>
                        <TableCell className="text-xs">{tx.user?.name || tx.user?.email || '—'}</TableCell>
                        <TableCell className="text-xs">
                          {tx.customer ? `${tx.customer.firstName} ${tx.customer.lastName}` : '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {tx.createdAt ? format(new Date(tx.createdAt), 'MMM dd, yyyy') : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [selected, setSelected]           = useState(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationService.getAll({ limit: 100 });
      const raw = res?.data?.data;
      setNotifications(Array.isArray(raw?.notifications) ? raw.notifications : []);
    } catch {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast.error('Failed to mark as read'); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { toast.error('Failed to delete notification'); }
  };

  const handleDeleteAllRead = async () => {
    try {
      await notificationService.deleteAllRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      toast.success('All read notifications deleted');
    } catch { toast.error('Failed to delete read notifications'); }
  };

  const handleOpen = (notif) => {
    setSelected(notif);
    if (!notif.isRead) handleMarkAsRead(notif.id);
  };

  const unreadCount   = notifications.filter((n) => !n.isRead).length;
  const stolenMatches = notifications.filter((n) => n.type === 'STOLEN_MATCH');

  return (
    <div className="space-y-10">
      <NotificationDetailModal notif={selected} open={!!selected} onClose={() => setSelected(null)} />

      {/* ── Notifications ──────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">System alerts for duplicate IMEIs and stolen mobile matches.</p>
          </div>
          {notifications.length > 0 && (
            <div className="flex flex-wrap gap-2 shrink-0">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-1.5">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDeleteAllRead} className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Delete read
              </Button>
            </div>
          )}
        </div>

        {isLoading ? (
          <SectionLoader />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 border border-dashed rounded-xl text-muted-foreground">
            <Bell className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notif) => {
              const meta = getMeta(notif.type);
              const Icon = meta.icon;
              const isDuplicate = notif.type === 'DUPLICATE_IMEI';
              return (
                <div
                  key={notif.id}
                  className={cn(
                    'flex items-start gap-4 rounded-xl border px-4 py-3.5 transition-colors',
                    notif.isRead ? 'bg-background' : meta.cardCls,
                    isDuplicate && 'cursor-pointer hover:shadow-sm',
                  )}
                  onClick={isDuplicate ? () => handleOpen(notif) : undefined}
                >
                  <div className={cn('shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center', notif.isRead ? 'bg-muted' : 'bg-background border')}>
                    <Icon className={cn('h-4 w-4', notif.isRead ? 'text-muted-foreground' : meta.iconCls)} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full', notif.isRead ? 'bg-muted text-muted-foreground' : meta.badgeCls)}>
                        {meta.label}
                      </span>
                      {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />}
                      {isDuplicate && (
                        <span className="text-[10px] text-orange-500 flex items-center gap-0.5 ml-1">
                          <Eye className="h-3 w-3" /> View details
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                        {notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : '—'}
                      </span>
                    </div>
                    <p className={cn('text-sm leading-snug', !notif.isRead && 'font-medium')}>{notif.message}</p>
                    {notif.imei && <p className="text-xs font-mono text-muted-foreground">IMEI: {notif.imei}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!notif.isRead && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Mark as read" onClick={() => handleMarkAsRead(notif.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" title="Delete" onClick={() => handleDelete(notif.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Detected Stolen Mobiles Link ────────────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Detected Stolen Mobiles
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            View detailed information about mobiles registered by users that matched stolen mobile reports.
          </p>
        </div>

        <div className="border rounded-lg bg-background p-6 text-center">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2">Stolen Mobile Detection System</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Our system automatically detects when registered mobiles match reported stolen devices. 
            View detailed matches with filtering and analytics.
          </p>
          <Button asChild>
            <a href="/admin/detected-stolen-mobiles">
              View Detected Stolen Mobiles
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
