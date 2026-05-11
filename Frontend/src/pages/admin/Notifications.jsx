import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationService, adminDetectedStolenMobileService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../component/ui/table';
import TablePagination from '../../component/ui/TablePagination';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../../component/ui/dialog';
import {
  Bell, Copy, Trash2, CheckCheck, Check, ShieldAlert, Eye, Search, Filter, X, FileDown, Smartphone,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

/* ── Notification type meta ── */
const NOTIF_META = {
  STOLEN_MATCH:      { icon: ShieldAlert, iconCls: 'text-red-500',    cardCls: 'border-red-200 bg-red-50/40',      badgeCls: 'bg-red-100 text-red-700',      labelKey: 'notifications.stolenMatch'      },
  DUPLICATE_IMEI:    { icon: Copy,        iconCls: 'text-orange-500',  cardCls: 'border-orange-200 bg-orange-50/40', badgeCls: 'bg-orange-100 text-orange-700', labelKey: 'notifications.duplicateImei'    },
  MOBILE_REGISTERED: { icon: Smartphone,  iconCls: 'text-blue-500',    cardCls: 'border-blue-200 bg-blue-50/40',    badgeCls: 'bg-blue-100 text-blue-700',    labelKey: 'notifications.mobileRegistered' },
};
const getMeta = (type) =>
  NOTIF_META[type] || { icon: Bell, iconCls: 'text-muted-foreground', cardCls: '', badgeCls: 'bg-muted', labelKey: null };

/* ── Notification detail modal ── */
function NotificationModal({ notif, open, onClose, onDownloadPdf, t }) {
  if (!notif) return null;
  const meta = getMeta(notif.type);
  const label = meta.labelKey ? t(meta.labelKey) : notif.type;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <div className="flex items-center gap-3 px-6 py-5 border-b shrink-0">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <meta.icon className={cn('h-5 w-5', meta.iconCls)} />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-bold leading-tight">
              {t('notifications.notifDetails')}
            </DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mr-1.5', meta.badgeCls)}>
                {label}
              </span>
              {notif.createdAt ? format(new Date(notif.createdAt), 'MMM dd, yyyy · HH:mm') : '—'}
            </DialogDescription>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">{t('notifications.message')}</p>
            <p className="text-sm">{notif.message}</p>
          </div>
          {notif.imei && (
            <div>
              <p className="text-[10px] text-muted-foreground mb-0.5">{t('notifications.imei')}</p>
              <p className="text-sm font-mono tracking-wide">{notif.imei}</p>
            </div>
          )}
          {notif.mobile && (
            <>
              <div className="border-t" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{t('notifications.mobileDetails')}</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: t('notifications.brand'),      value: notif.mobile.brand },
                  { label: t('notifications.model'),      value: notif.mobile.model },
                  { label: t('notifications.imei1'),      value: notif.mobile.imei1, mono: true },
                  { label: t('notifications.imei2'),      value: notif.mobile.imei2, mono: true },
                  { label: t('notifications.color'),      value: notif.mobile.color },
                  { label: t('notifications.ramStorage'), value: notif.mobile.ram ? `${notif.mobile.ram}GB / ${notif.mobile.storage}GB` : null },
                ].map(({ label, value, mono }) => value ? (
                  <div key={label}>
                    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                    <p className={cn('text-sm font-semibold break-all', mono && 'font-mono tracking-wide')}>{value}</p>
                  </div>
                ) : null)}
              </div>
            </>
          )}
          {notif.registeredBy && (
            <>
              <div className="border-t" />
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{t('notifications.registeredBy')}</p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  { label: t('notifications.name'),   value: notif.registeredBy.name },
                  { label: t('notifications.email'),  value: notif.registeredBy.email },
                  { label: t('notifications.shopNo'), value: notif.registeredBy.shopNumber },
                ].map(({ label, value }) => value ? (
                  <div key={label}>
                    <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-semibold break-all">{value}</p>
                  </div>
                ) : null)}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t shrink-0 flex justify-between items-center">
          <Button variant="outline" size="sm" className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => { onDownloadPdf(notif.id); onClose(); }}>
            <FileDown className="h-4 w-4" /> {t('notifications.downloadPdf')}
          </Button>
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Detected stolen mobile detail modal ── */
function DetectedModal({ item, open, onClose }) {
  if (!item) return null;

  const sections = [
    {
      title: 'Stolen Mobile Report',
      fields: [
        { label: 'Brand & Model', value: item.stolenMobile ? `${item.stolenMobile.brand} ${item.stolenMobile.model}` : null },
        { label: 'IMEI 1', value: item.stolenMobile?.imei1, mono: true },
        { label: 'IMEI 2', value: item.stolenMobile?.imei2, mono: true },
        { label: 'Color', value: item.stolenMobile?.color },
        { label: 'RAM / Storage', value: item.stolenMobile?.ram ? `${item.stolenMobile.ram}GB / ${item.stolenMobile.storage}GB` : null },
        { label: 'Reporter', value: item.stolenMobile?.reporterName },
        { label: 'Reporter Phone', value: item.stolenMobile?.reporterPhone },
        { label: 'Reported At', value: item.stolenMobile?.createdAt ? format(new Date(item.stolenMobile.createdAt), 'MMM dd, yyyy') : null },
      ],
    },
    {
      title: 'Registered Mobile',
      fields: [
        { label: 'Brand & Model', value: item.mobile ? `${item.mobile.brand} ${item.mobile.model}` : null },
        { label: 'IMEI 1', value: item.mobile?.imei1, mono: true },
        { label: 'IMEI 2', value: item.mobile?.imei2, mono: true },
        { label: 'Color', value: item.mobile?.color },
        { label: 'RAM / Storage', value: item.mobile?.ram ? `${item.mobile.ram}GB / ${item.mobile.storage}GB` : null },
        { label: 'Registered At', value: item.mobile?.createdAt ? format(new Date(item.mobile.createdAt), 'MMM dd, yyyy') : null },
      ],
    },
    {
      title: 'Transaction Details',
      fields: [
        { label: 'Type', value: item.transaction?.type },
        { label: 'Price', value: item.transaction?.price ? `${item.transaction.price}` : null },
        { label: 'Notes', value: item.transaction?.notes },
        { label: 'Date', value: item.transaction?.createdAt ? format(new Date(item.transaction.createdAt), 'MMM dd, yyyy') : null },
      ],
    },
    {
      title: 'Registered By',
      fields: [
        { label: 'Name', value: item.transaction?.user?.name },
        { label: 'Email', value: item.transaction?.user?.email },
        { label: 'Phone', value: item.transaction?.user?.phone },
        { label: 'Shop No.', value: item.transaction?.user?.shopNumber },
      ],
    },
    {
      title: 'Customer',
      fields: [
        { label: 'Name', value: item.transaction?.customer ? `${item.transaction.customer.firstName} ${item.transaction.customer.lastName}` : null },
        { label: 'Phone', value: item.transaction?.customer?.phoneNumber },
        { label: 'ID Card', value: item.transaction?.customer?.idCardNumber, mono: true },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b shrink-0">
          <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-bold leading-tight">
              Detected Stolen Mobile Details
            </DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              Match detected on {item.detectedAt ? format(new Date(item.detectedAt), 'MMM dd, yyyy · HH:mm') : '—'}
            </DialogDescription>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[60vh] px-6 py-5 space-y-6">
          {sections.map((section) => {
            const visible = section.fields.filter((f) => f.value);
            if (!visible.length) return null;
            return (
              <section key={section.title} className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{section.title}</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {visible.map(({ label, value, mono }) => (
                    <div key={label}>
                      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                      <p className={cn('text-sm font-semibold break-all', mono && 'font-mono tracking-wide')}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t" />
              </section>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t shrink-0 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main component ── */
const LIMIT = 7;
const EMPTY_FILTERS = { q: '' };

export default function Notifications() {
  const { t } = useTranslation();

  /* notifications */
  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedNotif, setSelectedNotif] = useState(null);

  /* detected table */
  const [detected, setDetected] = useState([]);
  const [loadingDetected, setLoadingDetected] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const hasActiveFilters = Object.values(applied).some((v) => v !== '');

  /* modals */
  const [selectedDetected, setSelectedDetected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── fetch notifications ── */
  const fetchNotifications = async (type = typeFilter) => {
    setLoadingNotif(true);
    try {
      const params = { limit: 100, isRead: false };
      if (type) params.type = type;
      const res = await notificationService.getAll(params);
      setNotifications(res?.data?.data?.notifications || []);
    } catch {
      toast.error(t('notifications.failedLoad'));
      setNotifications([]);
    } finally {
      setLoadingNotif(false);
    }
  };

  /* ── fetch detected ── */
  const fetchDetected = async (filters = applied, currentPage = page) => {
    setLoadingDetected(true);
    try {
      const params = { page: currentPage, limit: LIMIT };
      if (filters.q) params.q = filters.q;
      const res = await adminDetectedStolenMobileService.getAll(params);
      const data = res?.data?.data;
      setDetected(data?.detectedStolenMobiles || []);
      setTotal(data?.pagination?.total || 0);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch {
      toast.error(t('notifications.failedLoad'));
      setDetected([]);
    } finally {
      setLoadingDetected(false);
    }
  };

  const isMounted = useRef(false);

  useEffect(() => {
    fetchNotifications();
    fetchDetected(EMPTY_FILTERS, 1);
  }, []);

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    fetchDetected(applied, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  /* ── notification actions ── */
  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success(t('notifications.markedReadSuccess'));
    } catch {
      toast.error(t('notifications.errorMarkAsRead'));
    }
  };

  const markAll = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications([]);
      toast.success(t('notifications.allMarkedReadSuccess'));
    } catch {
      toast.error(t('notifications.errorMarkAllAsRead'));
    }
  };

  const deleteNotif = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success(t('notifications.deleteSuccess'));
    } catch {
      toast.error(t('notifications.errorDeleteNotification'));
    }
  };

  const deleteAllRead = async () => {
    try {
      await notificationService.deleteAllRead();
      toast.success(t('notifications.allReadDeletedSuccess'));
      fetchNotifications();
    } catch {
      toast.error(t('notifications.errorDeleteRead'));
    }
  };

  const downloadPdf = async (id) => {
    try {
      const res = await notificationService.downloadPdf(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `mobile-registration-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download PDF');
    }
  };

  /* ── detected actions ── */
  const handleDeleteDetected = async () => {
    if (!deleteTarget) return;
    try {
      await adminDetectedStolenMobileService.delete(deleteTarget.id);
      toast.success(t('notifications.deletedDetectedSuccess'));
      setDeleteTarget(null);
      fetchDetected(applied, page);
    } catch {
      toast.error(t('notifications.errorDeleteDetected'));
    }
  };

  /* ── filters ── */
  const applyFilters = () => { setPage(1); setApplied(draft); fetchDetected(draft, 1); };
  const clearFilters = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); fetchDetected(EMPTY_FILTERS, 1); };

  const handleTypeFilter = (type) => {
    const next = typeFilter === type ? '' : type;
    setTypeFilter(next);
    fetchNotifications(next);
  };

  const unread = notifications.length;

  return (
    <div className="space-y-10">

      {/* ── NOTIFICATIONS SECTION ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {t('notifications.title')}
              {unread > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">{t('notifications.subtitle')}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* type filter pills */}
            {['STOLEN_MATCH', 'DUPLICATE_IMEI', 'MOBILE_REGISTERED'].map((type) => {
              const meta = getMeta(type);
              return (
                <button
                  key={type}
                  onClick={() => handleTypeFilter(type)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors',
                    typeFilter === type ? meta.badgeCls + ' border-transparent' : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  {meta.label}
                </button>
              );
            })}
            <Button size="sm" variant="outline" onClick={deleteAllRead} className="flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> {t('notifications.deleteRead')}
            </Button>
            <Button size="sm" onClick={markAll} className="flex items-center gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" /> {t('notifications.markAllRead')}
            </Button>
          </div>
        </div>

        {loadingNotif ? (
          <SectionLoader />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg bg-muted/20">
            <Bell className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">{t('notifications.noNotifications')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const meta = getMeta(n.type);
              const Icon = meta.icon;
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex justify-between items-start border rounded-lg p-3 transition-colors',
                    !n.isRead && meta.cardCls
                  )}
                >
                  <div className="flex gap-3 cursor-pointer flex-1 min-w-0" onClick={() => setSelectedNotif(n)}>
                    <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', meta.iconCls)} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase', meta.badgeCls)}>
                          {meta.label}
                        </span>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                        )}
                      </div>
                      <p className="text-sm">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0 ml-2">
                    {!n.isRead && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" title={t('notifications.markAsRead')} onClick={() => markAsRead(n.id)}>
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                    {n.type === 'MOBILE_REGISTERED' && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" title="Download PDF" onClick={() => downloadPdf(n.id)}>
                        <FileDown className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" title={t('notifications.delete')} onClick={() => deleteNotif(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── DETECTED STOLEN MOBILES TABLE ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            {t('notifications.detectedTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('notifications.detectedSubtitle')} — {total} {t('common.total')}
          </p>
        </div>

        {/* filters */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('notifications.searchPlaceholder')}
                className="pl-9"
                value={draft.q}
                onChange={(e) => setDraft({ q: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={applyFilters} size="sm" className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" /> {t('notifications.applyFilters')}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
                <X className="h-3.5 w-3.5" /> {t('common.cancel')}
              </Button>
            )}
            {hasActiveFilters && (
              <span className="text-xs text-muted-foreground">
                {applied.q && `"${applied.q}"`}
              </span>
            )}
          </div>
        </div>

        {/* table */}
        <div className="border rounded-lg bg-background overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('detectedStolenMobiles.mobile')}</TableHead>
                <TableHead>IMEI 1</TableHead>
                <TableHead>{t('detectedStolenMobiles.reporter')}</TableHead>
                <TableHead>Reporter Phone</TableHead>
                <TableHead>{t('detectedStolenMobiles.detectedAt')}</TableHead>
                <TableHead className="text-right rtl:text-left">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingDetected ? (
                <TableRow><TableCell colSpan={6} className="p-0"><SectionLoader /></TableCell></TableRow>
              ) : detected.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No detected stolen mobiles found.
                  </TableCell>
                </TableRow>
              ) : (
                detected.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {item.mobile?.brand} {item.mobile?.model}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.mobile?.imei1 || '—'}</TableCell>
                    <TableCell>{item.stolenMobile?.reporterName || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.stolenMobile?.reporterPhone || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {item.detectedAt ? format(new Date(item.detectedAt), 'MMM dd, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right rtl:text-left">
                      <div className="flex justify-end rtl:justify-start gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => setSelectedDetected(item)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <TablePagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={(p) => setPage(p)} />
      </section>

      {/* ── MODALS ── */}
      <NotificationModal notif={selectedNotif} open={!!selectedNotif} onClose={() => setSelectedNotif(null)} />

      <DetectedModal item={selectedDetected} open={!!selectedDetected} onClose={() => setSelectedDetected(null)} />

      {/* Delete confirmation modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
            <DialogHeader>
              <DialogTitle>{t('notifications.deleteDetectedTitle')}</DialogTitle>
              <DialogDescription>{t('notifications.deleteDetectedDescription')}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDeleteDetected}>
              {t('common.delete')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
