import React, { useState, useEffect } from 'react';
import { adminUserService } from '../../services';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../../component/ui/dialog';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious
} from '../../component/ui/pagination';
import { Search, Plus, Pencil, Trash2, Loader2, Filter, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const ROLE_BADGE = {
  admin: 'bg-purple-100 text-purple-700',
  user:  'bg-blue-100 text-blue-700',
};

const EMPTY_FILTERS = { q: '', role: '', phone: '', shopNumber: '' };

const Users = () => {
  const [users, setUsers]               = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);

  const [draft, setDraft]     = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const hasActiveFilters = Object.values(applied).some((v) => v !== '');

  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = async (filters = applied, currentPage = page) => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, limit: 10 };
      if (filters.q)          params.q          = filters.q;
      if (filters.role)       params.role       = filters.role;
      if (filters.phone)      params.phone      = filters.phone;
      if (filters.shopNumber) params.shopNumber = filters.shopNumber;

      const res = await adminUserService.getAll(params);
      setUsers(res.data.data?.users || []);
      setTotalPages(res.data.data?.pagination?.totalPages || 1);
      setTotal(res.data.data?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(applied, page); }, [page]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const applyFilters = () => {
    setPage(1);
    setApplied(draft);
    fetchUsers(draft, 1);
  };

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
    fetchUsers(EMPTY_FILTERS, 1);
  };

  // ── Form open ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setSelected(null);
    setShowPassword(false);
    reset({ name: '', email: '', password: '', phone: '', shopNumber: '', role: 'user' });
    setIsFormOpen(true);
  };

  const openEdit = (user) => {
    setSelected(user);
    setShowPassword(false);
    reset({
      name:       user.name       || '',
      email:      user.email,
      password:   '',
      phone:      user.phone      || '',
      shopNumber: user.shopNumber || '',
      role:       user.role,
    });
    setIsFormOpen(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== '')
    );
    setIsSubmitting(true);
    try {
      if (selected) {
        await adminUserService.update(selected.id, payload);
        toast.success('User updated successfully');
      } else {
        await adminUserService.create(payload);
        toast.success('User created successfully');
      }
      setIsFormOpen(false);
      fetchUsers(applied, page);
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminUserService.delete(deleteTarget.id);
      toast.success('User deleted successfully');
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchUsers(applied, page);
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const openDelete = (user) => {
    setDeleteTarget(user);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-sm text-muted-foreground">
            Manage system users — {total} total
          </p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email..."
              className="pl-9"
              value={draft.q}
              onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          <Input
            placeholder="Filter by phone..."
            value={draft.phone}
            onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
          <Input
            placeholder="Filter by shop number..."
            value={draft.shopNumber}
            onChange={(e) => setDraft((p) => ({ ...p, shopNumber: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
          <select
            value={draft.role}
            onChange={(e) => setDraft((p) => ({ ...p, role: e.target.value }))}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
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
              {[
                applied.q          && `"${applied.q}"`,
                applied.role       && `Role: ${applied.role}`,
                applied.phone      && `Phone: ${applied.phone}`,
                applied.shopNumber && `Shop: ${applied.shopNumber}`,
              ].filter(Boolean).join(' · ')}
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
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Shop No.</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name || '—'}</TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell className="text-sm">{user.phone || '—'}</TableCell>
                  <TableCell className="text-sm">{user.shopNumber || '—'}</TableCell>
                  <TableCell>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', ROLE_BADGE[user.role])}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { setDeleteTarget(user); setIsDeleteOpen(true); }}
                      >
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#"
                onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink href="#" isActive={page === i + 1}
                  onClick={(e) => { e.preventDefault(); setPage(i + 1); }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#"
                onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-lg mx-4 sm:mx-auto max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{selected ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {selected
                ? 'Update user details. Leave password blank to keep it unchanged.'
                : 'Fill in the details to create a new system user.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-1 py-2 space-y-5">

              {/* Name */}
              <div className="space-y-2">
                <Label>Full Name <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input
                  {...register('name', {
                    minLength: { value: 2, message: 'Name must be at least 2 characters' }
                  })}
                  placeholder="e.g. John Doe"
                  className={cn(errors.name && 'border-destructive')}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' }
                  })}
                  placeholder="user@example.com"
                  className={cn(errors.email && 'border-destructive')}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label>
                  Password {selected
                    ? <span className="text-muted-foreground text-xs font-normal">(leave blank to keep current)</span>
                    : '*'}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      ...(!selected && { required: 'Password is required' }),
                      minLength: { value: 8, message: 'Minimum 8 characters' }
                    })}
                    placeholder={selected ? '••••••••' : 'Min. 8 characters'}
                    className={cn('pr-10', errors.password && 'border-destructive')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              {/* Phone & Shop Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Input
                    {...register('phone')}
                    placeholder="e.g. +923001234567"
                    className={cn(errors.phone && 'border-destructive')}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Shop Number <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Input
                    {...register('shopNumber')}
                    placeholder="e.g. A-12"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Role *</Label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className={cn(
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    errors.role && 'border-destructive'
                  )}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
              </div>

            </div>

            <DialogFooter className="shrink-0 pt-4 border-t mt-2 flex flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selected ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ─────────────────────────────────────────────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (!open) setDeleteTarget(null); }}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteTarget?.name || deleteTarget?.email}</span>?{' '}
              This will also remove all their transactions and customers. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Users;
