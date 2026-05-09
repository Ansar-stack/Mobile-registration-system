import { useState, useEffect } from 'react';
import { adminDetectedStolenMobileService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../component/ui/dialog';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { ShieldAlert, Search, Filter, X, Eye, Trash2, Phone, User, Calendar, Smartphone, Receipt, BarChart3 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const DetectedStolenMobiles = () => {
  const { t } = useTranslation();
  const [detectedStolenMobiles, setDetectedStolenMobiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ q: '', imei: '', reporterName: '', reporterPhone: '', brand: '', model: '', startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchDetectedStolenMobiles = async () => {
    setIsLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      Object.keys(params).forEach(key => { if (params[key] === '' || params[key] === undefined) delete params[key]; });
      const res = await adminDetectedStolenMobileService.getAll(params);
      const data = res?.data?.data;
      setDetectedStolenMobiles(Array.isArray(data?.detectedStolenMobiles) ? data.detectedStolenMobiles : []);
      setPagination(data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (error) {
      toast.error(error.message || t('detectedStolen.failedLoad'));
      setDetectedStolenMobiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminDetectedStolenMobileService.getStats();
      setStats(res?.data?.data?.stats || {});
    } catch {}
  };

  useEffect(() => { fetchDetectedStolenMobiles(); fetchStats(); }, [pagination.page, filters]);

  const handlePageChange = (page) => setPagination(prev => ({ ...prev, page }));
  const handleFilterChange = (key, value) => { setFilters(prev => ({ ...prev, [key]: value })); setPagination(prev => ({ ...prev, page: 1 })); };
  const handleApplyFilters = () => { fetchDetectedStolenMobiles(); setShowFilters(false); };
  const handleClearFilters = () => {
    setFilters({ q: '', imei: '', reporterName: '', reporterPhone: '', brand: '', model: '', startDate: '', endDate: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    try {
      await adminDetectedStolenMobileService.delete(id);
      toast.success(t('detectedStolen.deleteSuccess'));
      setDetectedStolenMobiles(prev => prev.filter(item => item.id !== id));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchStats();
    } catch (error) {
      toast.error(error.message || t('detectedStolen.failedDelete'));
    }
  };

  const openDeleteDialog = (id) => { setItemToDelete(id); setDeleteDialogOpen(true); };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy · HH:mm');
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '—';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const hasActiveFilters = filters.imei || filters.reporterName || filters.reporterPhone || filters.brand || filters.model || filters.startDate || filters.endDate;

  return (
    <div className="space-y-8">

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('detectedStolen.totalDetected')}</p>
                <p className="text-2xl font-bold">{stats.totalDetected || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('detectedStolen.uniqueStolenMobiles')}</p>
                <p className="text-2xl font-bold">{stats.uniqueStolenMobilesDetected || 0}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('detectedStolen.last7Days')}</p>
                <p className="text-2xl font-bold">{stats.detectedLast7Days || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('detectedStolen.last30Days')}</p>
                <p className="text-2xl font-bold">{stats.detectedLast30Days || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            {t('detectedStolen.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('detectedStolen.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('detectedStolen.searchPlaceholder')}
              className="pl-9 w-full lg:w-64"
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className={showFilters ? 'bg-primary/10' : ''}>
            <Filter className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-1">
              <X className="h-3.5 w-3.5" /> {t('detectedStolen.clear')}
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{t('detectedStolen.advancedFilters')}</h3>
            <Button variant="outline" size="sm" onClick={handleApplyFilters}>{t('detectedStolen.applyFilters')}</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imei">{t('detectedStolen.imeiFilter')}</Label>
              <Input id="imei" placeholder={t('detectedStolen.searchByImei')} value={filters.imei} onChange={(e) => handleFilterChange('imei', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reporterName">{t('detectedStolen.reporterNameFilter')}</Label>
              <Input id="reporterName" placeholder={t('detectedStolen.reporterNamePlaceholder')} value={filters.reporterName} onChange={(e) => handleFilterChange('reporterName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reporterPhone">{t('detectedStolen.reporterPhoneFilter')}</Label>
              <Input id="reporterPhone" placeholder={t('detectedStolen.reporterPhonePlaceholder')} value={filters.reporterPhone} onChange={(e) => handleFilterChange('reporterPhone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">{t('detectedStolen.brandFilter')}</Label>
              <Input id="brand" placeholder={t('detectedStolen.brandPlaceholder')} value={filters.brand} onChange={(e) => handleFilterChange('brand', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">{t('detectedStolen.modelFilter')}</Label>
              <Input id="model" placeholder={t('detectedStolen.modelPlaceholder')} value={filters.model} onChange={(e) => handleFilterChange('model', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">{t('detectedStolen.startDate')}</Label>
              <Input id="startDate" type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">{t('detectedStolen.endDate')}</Label>
              <Input id="endDate" type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('detectedStolen.stolenMobile')}</TableHead>
                <TableHead>{t('detectedStolen.registeredMobile')}</TableHead>
                <TableHead>{t('detectedStolen.transaction')}</TableHead>
                <TableHead>{t('detectedStolen.user')}</TableHead>
                <TableHead>{t('detectedStolen.customer')}</TableHead>
                <TableHead>{t('detectedStolen.detected')}</TableHead>
                <TableHead className="text-right">{t('detectedStolen.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="p-0"><SectionLoader /></TableCell></TableRow>
              ) : detectedStolenMobiles.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">{t('detectedStolen.noDetected')}</TableCell></TableRow>
              ) : detectedStolenMobiles.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                        <span className="font-medium text-sm">{item.stolenMobile?.brand} {item.stolenMobile?.model}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>IMEI1: <span className="font-mono">{item.stolenMobile?.imei1}</span></div>
                        {item.stolenMobile?.imei2 && <div>IMEI2: <span className="font-mono">{item.stolenMobile.imei2}</span></div>}
                        <div className="flex items-center gap-1 mt-1"><User className="h-3 w-3" /><span>{item.stolenMobile?.reporterName}</span></div>
                        <div className="flex items-center gap-1"><Phone className="h-3 w-3" /><span>{item.stolenMobile?.reporterPhone}</span></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-medium text-sm">{item.mobile?.brand} {item.mobile?.model}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>IMEI1: <span className="font-mono">{item.mobile?.imei1}</span></div>
                        {item.mobile?.imei2 && <div>IMEI2: <span className="font-mono">{item.mobile.imei2}</span></div>}
                        <div>{item.mobile?.color}</div>
                        {item.mobile?.ram && <div>RAM: {item.mobile.ram}</div>}
                        {item.mobile?.storage && <div>{t('detectedStolen.ramStorage').split('/')[1]?.trim() || 'Storage'}: {item.mobile.storage}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-3.5 w-3.5 text-green-500" />
                        <span className="font-medium text-sm">{item.transaction?.type}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.transaction?.price && <div>{t('detectedStolen.price')}: ${item.transaction.price}</div>}
                        {item.transaction?.notes && <div className="truncate max-w-[150px]" title={item.transaction.notes}>{t('detectedStolen.notes')}: {item.transaction.notes}</div>}
                        <div>{t('detectedStolen.transactionDate')}: {formatDate(item.transaction?.createdAt)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.transaction?.user ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{item.transaction.user.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          <div>{item.transaction.user.email}</div>
                          {item.transaction.user.phone && <div>{item.transaction.user.phone}</div>}
                          {item.transaction.user.shopNumber && <div>{t('detectedStolen.shopNumber')}: {item.transaction.user.shopNumber}</div>}
                        </div>
                      </div>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell>
                    {item.transaction?.customer ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{item.transaction.customer.firstName} {item.transaction.customer.lastName}</div>
                        <div className="text-xs text-muted-foreground">
                          <div>{item.transaction.customer.phoneNumber}</div>
                          <div>ID: {item.transaction.customer.idCardNumber}</div>
                        </div>
                      </div>
                    ) : <span className="text-muted-foreground text-sm">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{formatDate(item.detectedAt)}</div>
                      <div className="text-xs text-muted-foreground">{formatRelativeTime(item.detectedAt)}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(item)} title={t('detectedStolen.viewDetails')}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openDeleteDialog(item.id)} title={t('detectedStolen.delete')}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {detectedStolenMobiles.length > 0 && (
          <div className="border-t px-4 py-3">
            <TablePagination currentPage={pagination.page} totalPages={pagination.totalPages} totalItems={pagination.total} itemsPerPage={pagination.limit} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              {t('detectedStolen.detailsTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('detectedStolen.detailsDesc')} {selected ? formatDate(selected.detectedAt) : ''}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" /> {t('detectedStolen.stolenReport')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.imei1')}</Label><p className="font-mono text-sm">{selected.stolenMobile?.imei1 || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.imei2')}</Label><p className="font-mono text-sm">{selected.stolenMobile?.imei2 || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.brandModel')}</Label><p className="text-sm">{selected.stolenMobile?.brand} {selected.stolenMobile?.model}</p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.color')}</Label><p className="text-sm">{selected.stolenMobile?.color || '—'}</p></div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t('detectedStolen.reporter')}</Label>
                    <p className="text-sm">{selected.stolenMobile?.reporterName}</p>
                    <p className="text-xs text-muted-foreground">{selected.stolenMobile?.reporterPhone}</p>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.reportedDate')}</Label><p className="text-sm">{formatDate(selected.stolenMobile?.createdAt)}</p></div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-500" /> {t('detectedStolen.registeredMobileSection')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.imei1')}</Label><p className="font-mono text-sm">{selected.mobile?.imei1 || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.imei2')}</Label><p className="font-mono text-sm">{selected.mobile?.imei2 || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.brandModel')}</Label><p className="text-sm">{selected.mobile?.brand} {selected.mobile?.model}</p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.color')}</Label><p className="text-sm">{selected.mobile?.color || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.ramStorage')}</Label><p className="text-sm">{selected.mobile?.ram || '—'} / {selected.mobile?.storage || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.registeredDate')}</Label><p className="text-sm">{formatDate(selected.mobile?.createdAt)}</p></div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-green-500" /> {t('detectedStolen.transactionDetails')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.type')}</Label><p className="text-sm"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100">{selected.transaction?.type}</span></p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.price')}</Label><p className="text-sm">{selected.transaction?.price ? `$${selected.transaction.price}` : '—'}</p></div>
                  <div className="md:col-span-2"><Label className="text-xs text-muted-foreground">{t('detectedStolen.notes')}</Label><p className="text-sm">{selected.transaction?.notes || '—'}</p></div>
                  <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.transactionDate')}</Label><p className="text-sm">{formatDate(selected.transaction?.createdAt)}</p></div>
                </div>
              </div>

              {selected.transaction?.user && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" /> {t('detectedStolen.registeredBy')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.name')}</Label><p className="text-sm">{selected.transaction.user.name || '—'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.email')}</Label><p className="text-sm">{selected.transaction.user.email}</p></div>
                    <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.phone')}</Label><p className="text-sm">{selected.transaction.user.phone || '—'}</p></div>
                    <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.shopNumber')}</Label><p className="text-sm">{selected.transaction.user.shopNumber || '—'}</p></div>
                  </div>
                </div>
              )}

              {selected.transaction?.customer && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-500" /> {t('detectedStolen.customerSection')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.name')}</Label><p className="text-sm">{selected.transaction.customer.firstName} {selected.transaction.customer.lastName}</p></div>
                    <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.phone')}</Label><p className="text-sm">{selected.transaction.customer.phoneNumber}</p></div>
                    <div><Label className="text-xs text-muted-foreground">{t('detectedStolen.idCardNumber')}</Label><p className="text-sm">{selected.transaction.customer.idCardNumber}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('detectedStolen.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('detectedStolen.deleteConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t('detectedStolen.cancel')}</Button>
            <Button variant="destructive" onClick={() => handleDelete(itemToDelete)}>{t('detectedStolen.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetectedStolenMobiles;
