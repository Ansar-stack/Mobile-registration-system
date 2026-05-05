import React, { useState, useEffect } from 'react';
import { adminCustomerService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../component/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../component/ui/pagination';
import { Search, Trash2, Filter, X, Eye, Pencil, Loader2, User, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { useForm } from 'react-hook-form';

const EMPTY_FILTERS = { q: '', phone: '', idCardNumber: '' };
const LIMIT = 7;

const GENDER_BADGE = {
  male:   'bg-blue-100 text-blue-700',
  female: 'bg-pink-100 text-pink-700',
};

const Customers = () => {
  const [customers, setCustomers]   = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);

  const [draft, setDraft]     = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const hasActiveFilters = Object.values(applied).some((v) => v !== '');

  // modal states
  const [viewOpen, setViewOpen]     = useState(false);
  const [editOpen, setEditOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [activeCustomer, setActiveCustomer]   = useState(null); // list-row data
  const [detailData, setDetailData]           = useState(null); // full detail from API
  const [detailLoading, setDetailLoading]     = useState(false);
  const [isSubmitting, setIsSubmitting]       = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // ── Fetch list ──────────────────────────────────────────────────────────────
  const fetchCustomers = async (filters = applied, currentPage = page) => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, limit: LIMIT };
      if (filters.q)            params.q            = filters.q;
      if (filters.phone)        params.phoneNumber  = filters.phone;
      if (filters.idCardNumber) params.idCardNumber = filters.idCardNumber;
      const res = await adminCustomerService.getAll(params);
      setCustomers(res.data.data?.customers || []);
      setTotalPages(res.data.data?.pagination?.totalPages || 1);
      setTotal(res.data.data?.pagination?.total || 0);
    } catch (err) {
      toast.error(err.message || 'Failed to load customers');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(applied, page); }, [page]);

  // ── Filters ─────────────────────────────────────────────────────────────────
  const applyFilters = () => { setPage(1); setApplied(draft); fetchCustomers(draft, 1); };
  const clearFilters = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); fetchCustomers(EMPTY_FILTERS, 1); };

  // ── Fetch full detail ────────────────────────────────────────────────────────
  const fetchDetail = async (id) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await adminCustomerService.getById(id);
      setDetailData(res.data.data?.customer ?? res.data.data ?? res.data);
    } catch {
      toast.error('Failed to load customer details');
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Open modals ──────────────────────────────────────────────────────────────
  const openView = (customer) => {
    setActiveCustomer(customer);
    setViewOpen(true);
    fetchDetail(customer.id);
  };

  const openEdit = (customer) => {
    setActiveCustomer(customer);
    reset({
      firstName:    customer.firstName    || '',
      lastName:     customer.lastName     || '',
      phoneNumber:  customer.phoneNumber  || '',
      idCardNumber: customer.idCardNumber || '',
      gender:       customer.gender       || '',
    });
    setEditOpen(true);
  };

  const openDelete = (customer) => {
    setActiveCustomer(customer);
    setDeleteOpen(true);
  };

  // ── Submit edit ──────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== ''));
    setIsSubmitting(true);
    try {
      await adminCustomerService.update(activeCustomer.id, payload);
      toast.success('Customer updated successfully');
      setEditOpen(false);
      fetchCustomers(applied, page);
    } catch (err) {
      toast.error(err.message || 'Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await adminCustomerService.delete(activeCustomer.id);
      toast.success('Customer deleted successfully');
      setDeleteOpen(false);
      setActiveCustomer(null);
      fetchCustomers(applied, page);
    } catch (err) {
      toast.error(err.message || 'Failed to delete customer');
    }
  };

  // ── Pagination window ────────────────────────────────────────────────────────
  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
        <p className="text-sm text-muted-foreground">Manage your customer database — {total} total</p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name..." className="pl-9" value={draft.q}
              onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          </div>
          <Input placeholder="Filter by phone..." value={draft.phone}
            onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          <Input placeholder="Filter by ID card number..." value={draft.idCardNumber}
            onChange={(e) => setDraft((p) => ({ ...p, idCardNumber: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={applyFilters} size="sm" className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" /> Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              {[applied.q && `Name: "${applied.q}"`, applied.phone && `Phone: "${applied.phone}"`, applied.idCardNumber && `ID: "${applied.idCardNumber}"`].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>ID Card</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="p-0"><SectionLoader /></TableCell></TableRow>
            ) : customers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No customers found.</TableCell></TableRow>
            ) : (
              customers.map((c) => {
                const gender = c.gender?.toLowerCase();
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium whitespace-nowrap">{c.firstName} {c.lastName}</TableCell>
                    <TableCell>
                      {gender
                        ? <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', GENDER_BADGE[gender] || 'bg-muted text-muted-foreground')}>{gender}</span>
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{c.phoneNumber || '—'}</TableCell>
                    <TableCell className="text-sm">{c.idCardNumber || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {c.createdAt ? format(new Date(c.createdAt), 'MMM dd, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => openView(c)} title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer hover:bg-accent"
                          onClick={() => openEdit(c)} title="Edit customer">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => openDelete(c)} title="Delete customer">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 7 && (
        <>
          {/* Mobile */}
          <div className="flex sm:hidden items-center justify-between gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
          {/* Desktop */}
          <div className="hidden sm:flex">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} className={page === 1 ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
                {pageNums().map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink href="#" isActive={page === n} onClick={(e) => { e.preventDefault(); setPage(n); }}>{n}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} className={page === totalPages ? 'pointer-events-none opacity-50' : ''} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      {/* ── VIEW DETAIL MODAL ─────────────────────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={(o) => { setViewOpen(o); if (!o) { setDetailData(null); setActiveCustomer(null); } }}>
        <DialogContent className="max-w-lg rounded-2xl p-0">

          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b shrink-0">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-bold leading-tight truncate">
                {activeCustomer?.firstName} {activeCustomer?.lastName}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {activeCustomer?.gender && <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mr-1.5', GENDER_BADGE[activeCustomer.gender?.toLowerCase()] || 'bg-muted text-muted-foreground')}>{activeCustomer.gender}</span>}
                Customer profile
              </DialogDescription>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : detailData ? (
              <>
                {/* Personal info */}
                <section className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Personal Info</p>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      { label: 'First Name',    value: detailData.firstName },
                      { label: 'Last Name',     value: detailData.lastName  },
                      { label: 'Gender',        value: detailData.gender    },
                      { label: 'Phone',         value: detailData.phoneNumber },
                      { label: 'ID Card No.',   value: detailData.idCardNumber, mono: true },
                      { label: 'Joined',        value: detailData.createdAt ? format(new Date(detailData.createdAt), 'MMM dd, yyyy') : null },
                    ].map(({ label, value, mono }) => (
                      <div key={label}>
                        <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                        <p className={cn('text-sm font-semibold break-all', mono && 'font-mono tracking-wide')}>{value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Added by */}
                {detailData.user && (
                  <>
                    <div className="border-t" />
                    <section className="space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Added By</p>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        {[
                          { label: 'Name',    value: detailData.user.name },
                          { label: 'Shop #',  value: detailData.user.shopNumber },
                          { label: 'Email',   value: detailData.user.email },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                            <p className="text-sm font-semibold break-all">{value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {/* ID Image */}
                <div className="border-t" />
                <section className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">ID Image</p>
                  {detailData.idImage ? (
                    <a href={detailData.idImage} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={detailData.idImage}
                        alt="ID Card"
                        className="w-full max-h-48 object-cover rounded-xl border cursor-pointer hover:opacity-90 transition-opacity"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1.5 text-center">Click to open full image</p>
                    </a>
                  ) : (
                    <div className="flex items-center justify-center h-24 rounded-xl border border-dashed bg-muted/30">
                      <p className="text-sm text-muted-foreground">No image uploaded</p>
                    </div>
                  )}
                </section>

                {/* Addresses */}
                {detailData.addresses?.length > 0 && (
                  <>
                    <div className="border-t" />
                    <section className="space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Addresses</p>
                      <div className="space-y-3">
                        {detailData.addresses.map((addr, i) => (
                          <div key={addr.id ?? i} className="rounded-xl border bg-muted/20 p-4">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-2">{addr.type}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
                              {[
                                { label: 'Province', value: addr.province },
                                { label: 'City',     value: addr.city     },
                                { label: 'District', value: addr.district },
                              ].map(({ label, value }) => (
                                <div key={label}>
                                  <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                                  <p className="text-sm font-semibold">{value || '—'}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No details available.</p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
            <Button onClick={() => { setViewOpen(false); openEdit(activeCustomer); }}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── EDIT MODAL ────────────────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setActiveCustomer(null); }}>
        <DialogContent className="max-w-lg rounded-xl">
          <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update the customer's information below.</DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input {...register('firstName', { required: 'First name is required' })}
                    placeholder="e.g. John"
                    className={cn(errors.firstName && 'border-destructive')} />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input {...register('lastName', { required: 'Last name is required' })}
                    placeholder="e.g. Doe"
                    className={cn(errors.lastName && 'border-destructive')} />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input {...register('phoneNumber')} placeholder="e.g. +923001234567" />
              </div>
              <div className="space-y-2">
                <Label>ID Card Number</Label>
                <Input {...register('idCardNumber')} placeholder="e.g. 35202-1234567-1" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select {...register('gender')}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">Select gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
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

      {/* ── DELETE MODAL ──────────────────────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setActiveCustomer(null); }}>
        <DialogContent className="max-w-md rounded-xl">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
            <DialogHeader>
              <DialogTitle>Delete Customer</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{' '}
                <span className="font-semibold text-foreground">{activeCustomer?.firstName} {activeCustomer?.lastName}</span>?
                {' '}This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setDeleteOpen(false); setActiveCustomer(null); }}>Cancel</Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Customers;
