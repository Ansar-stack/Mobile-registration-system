import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminUserService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../component/ui/dialog';
import TablePagination from '../../component/ui/TablePagination';
import { Search, Plus, Pencil, Trash2, Loader2, Filter, X, Eye, EyeOff, ExternalLink, UserCheck, UserX, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

const ROLE_BADGE = { admin: 'bg-purple-100 text-purple-700', user: 'bg-blue-100 text-blue-700' };
const EMPTY_FILTERS = { q: '', role: '', phone: '', shopNumber: '' };
const LIMIT = 7;

const Users = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [users, setUsers]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [draft, setDraft]           = useState(EMPTY_FILTERS);
  const [applied, setApplied]       = useState(EMPTY_FILTERS);
  const hasActiveFilters = useMemo(() => Object.values(applied).some((v) => v !== ''), [applied]);

  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [isDeleteOpen, setIsDeleteOpen]   = useState(false);
  const [isViewOpen, setIsViewOpen]       = useState(false);
  const [selected, setSelected]           = useState(null);
  const [viewTarget, setViewTarget]       = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [togglingId, setTogglingId]       = useState(null);
  const [showPassword, setShowPassword]   = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const isPrimaryAdmin = currentUser?.isPrimaryAdmin === true;

  const fetchUsers = useCallback(async (filters = applied, currentPage = page) => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, limit: LIMIT };
      if (filters.q)          params.q          = filters.q;
      if (filters.role)       params.role       = filters.role;
      if (filters.phone)      params.phone      = filters.phone;
      if (filters.shopNumber) params.shopNumber = filters.shopNumber;
      const res = await adminUserService.getAll(params);
      setUsers(res.data.data?.users || []);
      setTotalPages(res.data.data?.pagination?.totalPages || 1);
      setTotal(res.data.data?.pagination?.total || 0);
    } catch {
      toast.error(t('users.failedLoad'));
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(applied, page); }, [page]);

  const applyFilters = useCallback(() => { setPage(1); setApplied(draft); fetchUsers(draft, 1); }, [draft, fetchUsers]);
  const clearFilters = useCallback(() => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setPage(1); fetchUsers(EMPTY_FILTERS, 1); }, [fetchUsers]);

  const openAdd  = useCallback(() => {
    setSelected(null);
    setShowPassword(false);
    reset({ name: '', email: '', password: '', phone: '', shopNumber: '', idCardNumber: '', address: '', role: 'user' });
    setIsFormOpen(true);
  }, [reset]);

  const openEdit = useCallback((user) => {
    setSelected(user);
    setShowPassword(false);
    reset({ name: user.name || '', email: user.email, password: '', phone: user.phone || '', shopNumber: user.shopNumber || '', idCardNumber: user.idCardNumber || '', address: user.address || '', role: user.role });
    setIsFormOpen(true);
  }, [reset]);

  const openView = useCallback((user) => { setViewTarget(user); setIsViewOpen(true); }, []);

  const onSubmit = async (data) => {
    const payload = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== ''));
    setIsSubmitting(true);
    try {
      if (selected) { await adminUserService.update(selected.id, payload); toast.success(t('users.updateSuccess')); }
      else          { await adminUserService.create(payload);              toast.success(t('users.createSuccess')); }
      setIsFormOpen(false);
      fetchUsers(applied, page);
    } catch (error) {
      toast.error(error.message || t('users.operationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminUserService.delete(deleteTarget.id);
      toast.success(t('users.deleteSuccess'));
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchUsers(applied, page);
    } catch (error) {
      toast.error(error.message || t('users.failedDelete'));
    }
  };

  const handleToggleActive = async (user) => {
    setTogglingId(user.id);
    try {
      await adminUserService.toggleActive(user.id);
      toast.success(user.isActive ? t('users.deactivateSuccess') : t('users.activateSuccess'));
      fetchUsers(applied, page);
    } catch (error) {
      toast.error(error.message || t('users.operationFailed'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('users.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('users.subtitle')} — {total} {t('common.total')}</p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> {t('users.addUser')}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('users.searchPlaceholder')} className="pl-9" value={draft.q}
              onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          </div>
          <Input placeholder={t('users.filterPhone')} value={draft.phone}
            onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          <Input placeholder={t('users.filterShop')} value={draft.shopNumber}
            onChange={(e) => setDraft((p) => ({ ...p, shopNumber: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()} />
          <select value={draft.role} onChange={(e) => setDraft((p) => ({ ...p, role: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="">{t('users.allRoles')}</option>
            <option value="user">{t('users.userRole')}</option>
            <option value="admin">{t('users.adminRole')}</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={applyFilters} size="sm" className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" /> {t('users.applyFilters')}
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-3.5 w-3.5" /> {t('users.clear')}
            </Button>
          )}
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              {[applied.q && `"${applied.q}"`, applied.role && `${t('users.roleFilter')}: ${applied.role}`, applied.phone && `${t('users.phone')}: ${applied.phone}`, applied.shopNumber && `${t('users.shopFilter')}: ${applied.shopNumber}`].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      </div>

      <div className="border rounded-lg bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('users.name')}</TableHead>
              <TableHead>{t('users.email')}</TableHead>
              <TableHead>{t('users.phone')}</TableHead>
              <TableHead>{t('users.shopNo')}</TableHead>
              <TableHead>{t('users.role')}</TableHead>
              <TableHead>{t('users.status')}</TableHead>
              <TableHead>{t('users.joined')}</TableHead>
              <TableHead className="text-right rtl:text-left">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="p-0"><SectionLoader /></TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">{t('users.noUsers')}</TableCell></TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className={cn(!user.isActive && 'opacity-60')}>
                  <TableCell className="font-medium">{user.name || '—'}</TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell className="text-sm">{user.phone || '—'}</TableCell>
                  <TableCell className="text-sm">{user.shopNumber || '—'}</TableCell>
                  <TableCell>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', ROLE_BADGE[user.role])}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                      {user.isActive ? t('users.active') : t('users.inactive')}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-right rtl:text-left">
                    <div className="flex justify-end rtl:justify-start gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => navigate(`/admin/users/${user.id}`)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                        onClick={() => openView(user)}>
                        <Info className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {isPrimaryAdmin && user.id !== currentUser?.id && (
                        <Button variant="ghost" size="icon"
                          className={cn('h-8 w-8 cursor-pointer', user.isActive ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50')}
                          disabled={togglingId === user.id}
                          onClick={() => handleToggleActive(user)}>
                          {togglingId === user.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { setDeleteTarget(user); setIsDeleteOpen(true); }}>
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

      <TablePagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />

      {/* View Detail Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
            <DialogHeader>
              <DialogTitle>{t('users.viewUser')}</DialogTitle>
              <DialogDescription>{t('users.viewDesc')}</DialogDescription>
            </DialogHeader>
          </div>
          {viewTarget && (
            <div className="px-4 sm:px-6 py-4 space-y-3">
              {[
                { label: t('users.fullName'),     value: viewTarget.name },
                { label: t('users.emailLabel'),   value: viewTarget.email },
                { label: t('users.phoneLabel'),   value: viewTarget.phone },
                { label: t('users.shopLabel'),    value: viewTarget.shopNumber },
                { label: t('users.idCardLabel'),  value: viewTarget.idCardNumber },
                { label: t('users.addressLabel'), value: viewTarget.address },
                { label: t('users.roleLabel'),    value: viewTarget.role },
                { label: t('users.status'),       value: viewTarget.isActive ? t('users.active') : t('users.inactive') },
                { label: t('users.joined'),       value: viewTarget.createdAt ? format(new Date(viewTarget.createdAt), 'MMM dd, yyyy') : null },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-2 text-sm">
                  <span className="text-muted-foreground w-28 shrink-0">{label}</span>
                  <span className="font-medium break-all">{value || '—'}</span>
                </div>
              ))}
            </div>
          )}
          <div className="px-4 sm:px-6 pb-4 flex justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>{t('common.close')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg flex flex-col max-h-[90dvh]">
          <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
            <DialogHeader>
              <DialogTitle>{selected ? t('users.editUser') : t('users.addNewUser')}</DialogTitle>
              <DialogDescription>
                {selected ? t('users.editDesc') : t('users.addDesc')}
              </DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-0 flex-1">
            <div className="overflow-y-auto px-4 sm:px-6 py-4 space-y-4 flex-1">
              <div className="space-y-2">
                <Label>{t('users.fullName')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional')})</span></Label>
                <Input
                  {...register('name', {
                    minLength: { value: 2, message: t('users.nameMin') },
                    pattern: { value: /^[A-Za-z\u0600-\u06FF\s'-]+$/, message: t('users.namePattern') },
                  })}
                  placeholder={t('users.namePlaceholder')}
                  className={cn(errors.name && 'border-destructive')}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('users.emailLabel')}</Label>
                <Input
                  type="email" inputMode="email"
                  {...register('email', {
                    required: t('users.emailRequired'),
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('users.emailInvalid') },
                  })}
                  placeholder={t('users.emailPlaceholder')}
                  className={cn(errors.email && 'border-destructive')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('users.passwordLabel')} {selected ? <span className="text-muted-foreground text-xs font-normal">({t('users.passwordKeep')})</span> : '*'}</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'}
                    {...register('password', { ...(!selected && { required: t('users.passwordRequired') }), minLength: { value: 8, message: t('users.passwordMin') } })}
                    placeholder={selected ? '••••••••' : t('users.passwordPlaceholder')} className={cn('pr-10', errors.password && 'border-destructive')} />
                  <button type="button" onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>{t('users.idCardLabel')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional')})</span></Label>
                <Input {...register('idCardNumber')} placeholder={t('users.idCardPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label>{t('users.addressLabel')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional')})</span></Label>
                <Input {...register('address')} placeholder={t('users.addressPlaceholder')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('users.phoneLabel')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional')})</span></Label>
                  <Input
                    {...register('phone', {
                      pattern: { value: /^(?:\+93|0093|0)7[0-9]{8}$|^\+93[0-9]{9}$/, message: t('users.phoneInvalid') },
                    })}
                    type="tel" inputMode="tel"
                    placeholder={t('users.phonePlaceholder')}
                    className={cn(errors.phone && 'border-destructive')}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t('users.shopLabel')} <span className="text-muted-foreground text-xs font-normal">({t('common.optional')})</span></Label>
                  <Input {...register('shopNumber')} placeholder={t('users.shopPlaceholder')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('users.roleLabel')}</Label>
                <select {...register('role', { required: t('users.roleRequired') })}
                  className={cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring', errors.role && 'border-destructive')}>
                  <option value="user">{t('users.userRole')}</option>
                  <option value="admin">{t('users.adminRole')}</option>
                </select>
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
              </div>
            </div>
            <div className="shrink-0 px-4 sm:px-6 py-4 border-t flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsFormOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selected ? t('common.saveChanges') : t('users.createUser')}
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
              <DialogTitle>{t('users.deleteUser')}</DialogTitle>
              <DialogDescription>
                {t('users.deleteConfirm')} <span className="font-semibold">{deleteTarget?.name || deleteTarget?.email}</span>? {t('users.deleteWarning')}
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

export default Users;
