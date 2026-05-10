import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminStolenMobileService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../component/ui/dialog';
import TablePagination from '../../component/ui/TablePagination';
import { Search, Plus, Pencil, Trash2, Loader2, ShieldAlert, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const StolenMobiles = () => {
  const { t } = useTranslation();
  const [mobiles, setMobiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const EMPTY_FILTERS = { imei: '', brand: '', model: '', reporterName: '', reporterPhone: '' };
  const [draft, setDraft]     = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const hasActiveFilters = Object.values(applied).some((v) => v !== '');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchMobiles = async (filters = applied, currentPage = page) => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, limit: 7 };
      if (filters.imei)          params.imei          = filters.imei;
      if (filters.brand)         params.brand         = filters.brand;
      if (filters.model)         params.model         = filters.model;
      if (filters.reporterName)  params.reporterName  = filters.reporterName;
      if (filters.reporterPhone) params.reporterPhone = filters.reporterPhone;
      const response = await adminStolenMobileService.getAll(params);
      setMobiles(response.data.data?.stolenMobiles || []);
      setTotalPages(response.data.data?.pagination?.totalPages || 1);
      setTotal(response.data.data?.pagination?.total || 0);
    } catch {
      toast.error(t('stolen.failedLoad'));
      setMobiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMobiles(applied, page); }, [page]);

  const applyFilters = () => { setPage(1); setApplied(draft); fetchMobiles(draft, 1); };
  const clearFilters = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); fetchMobiles(EMPTY_FILTERS, 1); };

  const openAdd = () => {
    setSelected(null);
    reset({ imei1: '', imei2: '', brand: '', model: '', color: '', ram: '', storage: '', reporterName: '', reporterPhone: '' });
    setIsFormOpen(true);
  };

  const openEdit = (mobile) => {
    setSelected(mobile);
    reset({
      imei1: mobile.imei1, imei2: mobile.imei2 || '', brand: mobile.brand, model: mobile.model,
      color: mobile.color || '', ram: mobile.ram || '', storage: mobile.storage || '',
      reporterName: mobile.reporterName || '', reporterPhone: mobile.reporterPhone || '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data) => {
    const payload = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== ''));
    setIsSubmitting(true);
    try {
      if (selected) {
        await adminStolenMobileService.update(selected.id, payload);
        toast.success(t('stolen.updateSuccess'));
      } else {
        await adminStolenMobileService.create(payload);
        toast.success(t('stolen.reportSuccess'));
      }
      setIsFormOpen(false);
      fetchMobiles(applied, page);
    } catch (error) {
      toast.error(error.message || t('stolen.operationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminStolenMobileService.delete(deleteTarget.id);
      toast.success(t('stolen.deleteSuccess'));
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchMobiles(applied, page);
    } catch (error) {
      toast.error(error.message || t('stolen.failedDelete'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" /> {t('stolen.title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('stolen.subtitle')}</p>
        </div>
        <Button className="flex items-center gap-2 w-full sm:w-auto" onClick={openAdd}>
          <Plus className="h-4 w-4" /> {t('stolen.reportBtn')}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('stolen.searchPlaceholder')} className="pl-9" value={draft.imei}
              onChange={(e) => setDraft((p) => ({ ...p, imei: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          </div>
          <Input placeholder={t('stolen.filterBrand')} value={draft.brand}
            onChange={(e) => setDraft((p) => ({ ...p, brand: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          <Input placeholder={t('stolen.filterModel')} value={draft.model}
            onChange={(e) => setDraft((p) => ({ ...p, model: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          <Input placeholder={t('stolen.reporterName')} value={draft.reporterName}
            onChange={(e) => setDraft((p) => ({ ...p, reporterName: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          <Input placeholder={t('stolen.reporterPhone')} value={draft.reporterPhone}
            onChange={(e) => setDraft((p) => ({ ...p, reporterPhone: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={applyFilters} size="sm" className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" /> {t('stolen.applyFilters')}
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-3.5 w-3.5" /> {t('stolen.clear')}
            </Button>
          )}
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              {[
                applied.imei          && `${t('stolen.imeiFilter')}: "${applied.imei}"`,
                applied.brand         && `${t('stolen.brandFilter')}: "${applied.brand}"`,
                applied.model         && `${t('stolen.modelFilter')}: "${applied.model}"`,
                applied.reporterName  && `${t('stolen.reporter')}: "${applied.reporterName}"`,
                applied.reporterPhone && `${t('stolen.reporterPhone')}: "${applied.reporterPhone}"`,
              ].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>

      <div className="border rounded-lg bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('stolen.brandModel')}</TableHead>
              <TableHead>{t('stolen.imei1')}</TableHead>
              <TableHead>{t('stolen.imei2')}</TableHead>
              <TableHead>{t('stolen.color')}</TableHead>
              <TableHead>{t('stolen.ramStorage')}</TableHead>
              <TableHead>{t('stolen.reporter')}</TableHead>
              <TableHead>{t('stolen.reported')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="p-0"><SectionLoader /></TableCell></TableRow>
            ) : mobiles.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t('stolen.noStolen')}</TableCell></TableRow>
            ) : (
              mobiles.map((mobile) => (
                <TableRow key={mobile.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{mobile.brand}</span>
                      <span className="text-xs text-muted-foreground">{mobile.model}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{mobile.imei1}</TableCell>
                  <TableCell className="font-mono text-xs">{mobile.imei2 || '-'}</TableCell>
                  <TableCell>{mobile.color || '-'}</TableCell>
                  <TableCell className="text-xs">
                    {mobile.ram ? `${mobile.ram}GB` : '-'} / {mobile.storage ? `${mobile.storage}GB` : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{mobile.reporterName}</span>
                      <span className="text-xs text-muted-foreground">{mobile.reporterPhone}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {mobile.createdAt ? format(new Date(mobile.createdAt), 'MMM dd, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openEdit(mobile)}>
                        <Pencil className="h-4 w-4 cursor-pointer" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { setDeleteTarget(mobile); setIsDeleteOpen(true); }}>
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

      <TablePagination page={page} totalPages={totalPages} total={total} limit={7} onPageChange={setPage} />

      {/* Add / Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
            <DialogHeader>
              <DialogTitle>{selected ? t('stolen.editTitle') : t('stolen.reportTitle')}</DialogTitle>
              <DialogDescription>
                {selected ? t('stolen.editDesc') : t('stolen.reportDesc')}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('stolen.reporterName')}</Label>
                  <Input
                    {...register('reporterName', {
                      required: t('stolen.reporterNameRequired'),
                      minLength: { value: 2, message: t('stolen.reporterNameMin') },
                      pattern: { value: /^[A-Za-z\u0600-\u06FF\s'-]+$/, message: t('stolen.reporterNamePattern') },
                    })}
                    placeholder={t('stolen.reporterNamePlaceholder')}
                    className={cn(errors.reporterName && 'border-destructive')}
                  />
                  {errors.reporterName && <p className="text-xs text-destructive">{errors.reporterName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('stolen.reporterPhone')}</Label>
                  <Input
                    {...register('reporterPhone', {
                      required: t('stolen.reporterPhoneRequired'),
                      pattern: { value: /^(?:\+93|0093|0)7[0-9]{8}$|^\+93[0-9]{9}$/, message: t('stolen.reporterPhoneInvalid') },
                    })}
                    type="tel" inputMode="tel"
                    placeholder={t('stolen.reporterPhonePlaceholder')}
                    className={cn(errors.reporterPhone && 'border-destructive')}
                  />
                  {errors.reporterPhone && <p className="text-xs text-destructive">{errors.reporterPhone.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('stolen.imei1Label')}</Label>
                  <Input
                    {...register('imei1', {
                      required: t('stolen.imei1Required'),
                      pattern: { value: /^\d{15}$/, message: t('stolen.imei1Pattern') },
                    })}
                    type="text" inputMode="numeric" maxLength={15}
                    placeholder={t('stolen.imei1Placeholder')}
                    onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                    className={cn('font-mono tracking-widest', errors.imei1 && 'border-destructive')}
                  />
                  {errors.imei1 && <p className="text-xs text-destructive">{errors.imei1.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('stolen.imei2Label')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional')})</span></Label>
                  <Input
                    {...register('imei2', {
                      pattern: { value: /^\d{15}$/, message: t('stolen.imei2Pattern') },
                    })}
                    type="text" inputMode="numeric" maxLength={15}
                    placeholder={t('stolen.imei2Placeholder')}
                    onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                    className={cn('font-mono tracking-widest', errors.imei2 && 'border-destructive')}
                  />
                  {errors.imei2 && <p className="text-xs text-destructive">{errors.imei2.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('stolen.brandLabel')}</Label>
                  <Input
                    {...register('brand', {
                      required: t('stolen.brandRequired'),
                      minLength: { value: 2, message: t('stolen.brandMin') },
                    })}
                    placeholder={t('stolen.brandPlaceholder')}
                    className={cn(errors.brand && 'border-destructive')}
                  />
                  {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('stolen.modelLabel')}</Label>
                  <Input
                    {...register('model', { required: t('stolen.modelRequired') })}
                    placeholder={t('stolen.modelPlaceholder')}
                    className={cn(errors.model && 'border-destructive')}
                  />
                  {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('stolen.colorLabel')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional')})</span></Label>
                <Input {...register('color')} placeholder={t('stolen.colorPlaceholder')} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('stolen.ramLabel')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional')})</span></Label>
                  <Input
                    {...register('ram', {
                      min: { value: 1, message: t('stolen.ramMin') },
                      max: { value: 256, message: t('stolen.ramMax') },
                    })}
                    type="number" inputMode="numeric" min="1" max="256"
                    placeholder={t('stolen.ramPlaceholder')}
                    className={cn(errors.ram && 'border-destructive')}
                  />
                  {errors.ram && <p className="text-xs text-destructive">{errors.ram.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('stolen.storageLabel')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional')})</span></Label>
                  <Input
                    {...register('storage', {
                      min: { value: 1, message: t('stolen.storageMin') },
                      max: { value: 4096, message: t('stolen.storageMax') },
                    })}
                    type="number" inputMode="numeric" min="1" max="4096"
                    placeholder={t('stolen.storagePlaceholder')}
                    className={cn(errors.storage && 'border-destructive')}
                  />
                  {errors.storage && <p className="text-xs text-destructive">{errors.storage.message}</p>}
                </div>
              </div>
            </div>

            <div className="shrink-0 px-4 sm:px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selected ? t('stolen.updateBtn') : t('stolen.reportBtn2')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (!open) setDeleteTarget(null); }}>
        <DialogContent className="max-w-md">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
            <DialogHeader>
              <DialogTitle>{t('stolen.deleteTitle')}</DialogTitle>
              <DialogDescription>
                {t('stolen.deleteConfirm')} <span className="font-semibold">{deleteTarget?.brand} {deleteTarget?.model}</span> (IMEI: {deleteTarget?.imei1}) {t('stolen.deleteWarning')}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}>{t('common.cancel')}</Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StolenMobiles;
