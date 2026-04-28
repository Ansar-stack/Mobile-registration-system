import React, { useState, useEffect } from 'react';
import { adminStolenMobileService } from '../../services';
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
import { Search, Plus, Pencil, Trash2, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const StolenMobiles = () => {
  const [mobiles, setMobiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchMobiles = async () => {
    setIsLoading(true);
    try {
      const response = await adminStolenMobileService.getAll({ page, q: search, limit: 10 });
      setMobiles(response.data.data?.stolenMobiles || []);
      setTotalPages(response.data.data?.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load stolen mobiles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMobiles(); }, [page, search]);

  const openAdd = () => {
    setSelected(null);
    reset({ imei1: '', imei2: '', brand: '', model: '', color: '', ram: '', storage: '' });
    setIsFormOpen(true);
  };

  const openEdit = (mobile) => {
    setSelected(mobile);
    reset({
      imei1: mobile.imei1,
      imei2: mobile.imei2 || '',
      brand: mobile.brand,
      model: mobile.model,
      color: mobile.color || '',
      ram: mobile.ram || '',
      storage: mobile.storage || '',
    });
    setIsFormOpen(true);
  };

  const onSubmit = async (data) => {
    // strip empty optional fields
    const payload = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== '')
    );
    setIsSubmitting(true);
    try {
      if (selected) {
        await adminStolenMobileService.update(selected.id, payload);
        toast.success('Stolen mobile updated');
      } else {
        await adminStolenMobileService.create(payload);
        toast.success('Stolen mobile reported');
      }
      setIsFormOpen(false);
      fetchMobiles();
    } catch (error) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminStolenMobileService.delete(deleteTarget.id);
      toast.success('Record deleted');
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      fetchMobiles();
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-destructive" /> Stolen Mobiles
          </h2>
          <p className="text-sm text-muted-foreground">Manage reported stolen mobile devices.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Report Stolen Mobile
        </Button>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by IMEI, brand, model, or color..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="border rounded-lg bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand & Model</TableHead>
              <TableHead>IMEI 1</TableHead>
              <TableHead>IMEI 2</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>RAM / Storage</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : mobiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No stolen mobiles reported.
                </TableCell>
              </TableRow>
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
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(mobile.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => openEdit(mobile)}>
                        <Pencil className="h-4 w-4 cursor-pointer" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => { setDeleteTarget(mobile); setIsDeleteOpen(true); }}
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

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={page === i + 1}
                  onClick={(e) => { e.preventDefault(); setPage(i + 1); }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Add / Edit Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-lg mx-4 sm:mx-auto max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{selected ? 'Edit Stolen Mobile' : 'Report Stolen Mobile'}</DialogTitle>
            <DialogDescription>
              {selected ? 'Update the stolen mobile record.' : 'Enter the details of the stolen mobile device.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-1 py-2 space-y-5">

              {/* IMEI Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IMEI 1 *</Label>
                  <Input
                    {...register('imei1', {
                      required: 'IMEI 1 is required',
                      pattern: { value: /^\d{15}$/, message: 'Must be exactly 15 digits' }
                    })}
                    placeholder="15-digit IMEI"
                    className={cn(errors.imei1 && 'border-destructive')}
                  />
                  {errors.imei1 && <p className="text-xs text-destructive">{errors.imei1.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>IMEI 2 <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Input
                    {...register('imei2', {
                      pattern: { value: /^\d{15}$/, message: 'Must be exactly 15 digits' }
                    })}
                    placeholder="15-digit IMEI"
                    className={cn(errors.imei2 && 'border-destructive')}
                  />
                  {errors.imei2 && <p className="text-xs text-destructive">{errors.imei2.message}</p>}
                </div>
              </div>

              {/* Brand & Model Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand *</Label>
                  <Input
                    {...register('brand', { required: 'Brand is required' })}
                    placeholder="e.g. Samsung"
                    className={cn(errors.brand && 'border-destructive')}
                  />
                  {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Model *</Label>
                  <Input
                    {...register('model', { required: 'Model is required' })}
                    placeholder="e.g. Galaxy S24"
                    className={cn(errors.model && 'border-destructive')}
                  />
                  {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
                </div>
              </div>

              {/* Color — full width */}
              <div className="space-y-2">
                <Label>Color <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                <Input {...register('color')} placeholder="e.g. Midnight Black" />
              </div>

              {/* RAM & Storage Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>RAM <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Input {...register('ram')} placeholder="e.g. 8GB" />
                </div>
                <div className="space-y-2">
                  <Label>Storage <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
                  <Input {...register('storage')} placeholder="e.g. 256GB" />
                </div>
              </div>

            </div>

            <DialogFooter className="shrink-0 pt-4 border-t mt-2 flex flex-col-reverse sm:flex-row gap-2">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setIsFormOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selected ? 'Update' : 'Report'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={(open) => { setIsDeleteOpen(open); if (!open) setDeleteTarget(null); }}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-semibold">{deleteTarget?.brand} {deleteTarget?.model}</span> (IMEI: {deleteTarget?.imei1}) from stolen records? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setIsDeleteOpen(false); setDeleteTarget(null); }}>Cancel</Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StolenMobiles;
