import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminMobileService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../component/ui/dialog';
import TablePagination from '../../component/ui/TablePagination';
import { Search, Trash2, Filter, X, Eye, Pencil, Loader2, Smartphone, ShoppingCart, Tag, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';

const LIMIT = 7;
const EMPTY_FILTERS = { q: '', brand: '', model: '' };

const TX_META = {
  BUY:    { icon: ShoppingCart, cls: 'bg-green-100 text-green-700'   },
  SELL:   { icon: Tag,          cls: 'bg-blue-100 text-blue-700'     },
  UNLOCK: { icon: Unlock,       cls: 'bg-purple-100 text-purple-700' },
};

export default function Mobiles() {
  const [mobiles, setMobiles]       = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  const [draft, setDraft]     = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const hasActiveFilters = useMemo(() => Object.values(applied).some((v) => v !== ''), [applied]);

  const [viewOpen,   setViewOpen]   = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [selected,      setSelected]      = useState(null);
  const [detail,        setDetail]        = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchMobiles = useCallback(async (filters = applied, pg = page) => {
    setIsLoading(true);
    try {
      const params = { page: pg, limit: LIMIT };
      if (filters.q)     params.q     = filters.q;
      if (filters.brand) params.brand = filters.brand;
      if (filters.model) params.model = filters.model;
      const res = await adminMobileService.getAll(params);
      setMobiles(res.data.data?.mobiles || []);
      setTotalPages(res.data.data?.pagination?.totalPages || 1);
      setTotal(res.data.data?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load mobiles');
      setMobiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMobiles(applied, page); }, [page]);

  const applyFilters = () => { setPage(1); setApplied(draft); fetchMobiles(draft, 1); };
  const clearFilters = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); fetchMobiles(EMPTY_FILTERS, 1); };

  const fetchDetail = async (id) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await adminMobileService.getById(id);
      setDetail(res.data.data?.mobile ?? res.data.data ?? res.data);
    } catch {
      toast.error('Failed to load mobile details');
    } finally {
      setDetailLoading(false);
    }
  };

  const openView   = (mob) => { setSelected(mob); setViewOpen(true); fetchDetail(mob.id); };
  const openEdit   = (mob) => { setSelected(mob); reset({ brand: mob.brand, model: mob.model, color: mob.color, ram: mob.ram || '', storage: mob.storage || '' }); setEditOpen(true); };
  const openDelete = (mob) => { setSelected(mob); setDeleteOpen(true); };

  const onEditSubmit = async (data) => {
    const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== ''));
    setIsSubmitting(true);
    try {
      await adminMobileService.update(selected.id, payload);
      toast.success('Mobile updated');
      setEditOpen(false);
      fetchMobiles(applied, page);
    } catch (err) {
      toast.error(err.message || 'Failed to update mobile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminMobileService.delete(selected.id);
      toast.success('Mobile deleted');
      setDeleteOpen(false);
      setSelected(null);
      fetchMobiles(applied, page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete mobile');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mobiles</h2>
        <p className="text-sm text-muted-foreground">All registered mobile devices — {total} total</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by IMEI..." className="pl-9" value={draft.q}
              onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          </div>
          <Input placeholder="Filter by brand..." value={draft.brand}
            onChange={(e) => setDraft((p) => ({ ...p, brand: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          <Input placeholder="Filter by model..." value={draft.model}
            onChange={(e) => setDraft((p) => ({ ...p, model: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={applyFilters} size="sm" className="gap-1.5"><Filter className="h-3.5 w-3.5" /> Apply</Button>
          {hasActiveFilters && <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5"><X className="h-3.5 w-3.5" /> Clear</Button>}
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              {[applied.q && `IMEI: "${applied.q}"`, applied.brand && `Brand: "${applied.brand}"`, applied.model && `Model: "${applied.model}"`].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>IMEI 1</TableHead>
              <TableHead>IMEI 2</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>RAM / Storage</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="p-0"><SectionLoader /></TableCell></TableRow>
            ) : mobiles.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No mobiles found.</TableCell></TableRow>
            ) : mobiles.map((mob) => (
              <TableRow key={mob.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{mob.brand}</p>
                      <p className="text-xs text-muted-foreground">{mob.model}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{mob.imei1}</TableCell>
                <TableCell className="font-mono text-xs">{mob.imei2 || '—'}</TableCell>
                <TableCell className="text-sm">{mob.color}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {mob.ram ? `${mob.ram} GB` : '—'} / {mob.storage ? `${mob.storage} GB` : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {mob.createdAt ? format(new Date(mob.createdAt), 'MMM dd, yyyy') : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => openView(mob)} title="View"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent" onClick={() => openEdit(mob)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => openDelete(mob)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />

      {/* ── VIEW MODAL ──────────────────────────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) { setDetail(null); setSelected(null); } }}>
        <DialogContent className="max-w-lg rounded-2xl p-0">

          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b shrink-0">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold leading-tight truncate">
                {selected?.brand} {selected?.model}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5 truncate">
                {[selected?.color, selected?.ram && `${selected.ram}GB RAM`, selected?.storage && `${selected.storage}GB`].filter(Boolean).join(' · ')}
              </DialogDescription>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : detail ? (
              <>
                {/* Device info */}
                <section className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Device Info</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      { label: 'IMEI 1',      value: detail.imei1,                                                    mono: true  },
                      { label: 'IMEI 2',      value: detail.imei2,                                                    mono: true  },
                      { label: 'Brand',       value: detail.brand                                                                 },
                      { label: 'Model',       value: detail.model                                                                 },
                      { label: 'Color',       value: detail.color                                                                 },
                      { label: 'RAM',         value: detail.ram     ? `${detail.ram} GB`     : null                              },
                      { label: 'Storage',     value: detail.storage ? `${detail.storage} GB` : null                              },
                      { label: 'Registered',  value: detail.createdAt ? format(new Date(detail.createdAt), 'MMM dd, yyyy') : null },
                    ].map(({ label, value, mono }) => (
                      <div key={label}>
                        <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                        <p className={cn('text-sm font-semibold break-all', mono && 'font-mono tracking-wide')}>{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="border-t" />

                {/* Transactions */}
                <section className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Transactions ({detail.transactions?.length ?? 0})
                  </p>
                  {detail.transactions?.length > 0 ? (
                    <div className="space-y-3">
                      {detail.transactions.map((tx, i) => {
                        const meta  = TX_META[tx.type] || TX_META.BUY;
                        const TxIcon = meta.icon;
                        return (
                          <div key={tx.id ?? i} className="rounded-xl border bg-muted/20 p-4 space-y-3">
                            {/* type + price */}
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn('inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full', meta.cls)}>
                                <TxIcon className="h-3 w-3" />{tx.type}
                              </span>
                              <div className="text-right">
                                <p className="text-sm font-bold">{tx.price ? `$${tx.price}` : '—'}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {tx.createdAt ? format(new Date(tx.createdAt), 'MMM dd, yyyy · HH:mm') : '—'}
                                </p>
                              </div>
                            </div>
                            {/* customer */}
                            {tx.customer ? (
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t">
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Customer</p>
                                  <p className="text-xs font-semibold">{tx.customer.firstName} {tx.customer.lastName}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Phone</p>
                                  <p className="text-xs font-semibold">{tx.customer.phoneNumber || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-[10px] text-muted-foreground">ID Card</p>
                                  <p className="text-xs font-semibold font-mono">{tx.customer.idCardNumber || '—'}</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic pt-2 border-t">No customer linked</p>
                            )}
                            {/* added by */}
                            {tx.user && (
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t">
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Added By</p>
                                  <p className="text-xs font-semibold">{tx.user.name || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Shop #</p>
                                  <p className="text-xs font-semibold">{tx.user.shopNumber || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-[10px] text-muted-foreground">Email</p>
                                  <p className="text-xs font-semibold">{tx.user.email || '—'}</p>
                                </div>
                              </div>
                            )}
                            {tx.notes && (
                              <p className="text-xs text-muted-foreground italic border-t pt-2">Note: {tx.notes}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No transactions recorded.</p>
                  )}
                </section>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No details available.</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            <Button onClick={() => { setViewOpen(false); openEdit(selected); }}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EDIT MODAL ──────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setSelected(null); }}>
        <DialogContent className="max-w-md rounded-xl">
          <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
            <DialogHeader>
              <DialogTitle>Edit Mobile</DialogTitle>
              <DialogDescription>{selected?.brand} {selected?.model}</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit(onEditSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Brand *</Label>
                  <Input {...register('brand', { required: 'Required' })} className={cn(errors.brand && 'border-destructive')} />
                  {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Model *</Label>
                  <Input {...register('model', { required: 'Required' })} className={cn(errors.model && 'border-destructive')} />
                  {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Color *</Label>
                  <Input {...register('color', { required: 'Required' })} className={cn(errors.color && 'border-destructive')} />
                  {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>RAM (GB)</Label>
                  <Input {...register('ram')} type="number" min="1" placeholder="e.g. 8" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Storage (GB)</Label>
                  <Input {...register('storage')} type="number" min="1" placeholder="e.g. 256" />
                </div>
              </div>
            </div>
            <div className="shrink-0 px-4 sm:px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE MODAL ────────────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setSelected(null); }}>
        <DialogContent className="max-w-md rounded-xl">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
            <DialogHeader>
              <DialogTitle>Delete Mobile</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-foreground">{selected?.brand} {selected?.model}</span>{' '}
                (IMEI: <span className="font-mono">{selected?.imei1}</span>)?
                This will also remove all associated transactions and cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setDeleteOpen(false); setSelected(null); }}>Cancel</Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
