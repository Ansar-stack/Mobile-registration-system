import React, { useState, useEffect } from 'react';
import { adminMobileService } from '../../services';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../../component/ui/dialog';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious
} from '../../component/ui/pagination';
import { Search, Trash2, Loader2, Filter, X } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FILTERS = { imei: '', brand: '', model: '' };

const Mobiles = () => {
  const [mobiles, setMobiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMobile, setSelectedMobile] = useState(null);

  // filter state — draft (what user types) vs applied (what gets sent to API)
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);

  const hasActiveFilters = Object.values(applied).some((v) => v !== '');

  const fetchMobiles = async (filters = applied, currentPage = page) => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, limit: 10 };
      if (filters.imei)  params.q     = filters.imei;
      if (filters.brand) params.brand = filters.brand;
      if (filters.model) params.model = filters.model;

      const response = await adminMobileService.getAll(params);
      setMobiles(response.data.data?.mobiles || []);
      setTotalPages(response.data.data?.pagination?.totalPages || 1);
    } catch {
      toast.error('Failed to load mobiles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMobiles(applied, page); }, [page]);

  const handleApplyFilters = () => {
    setPage(1);
    setApplied(draft);
    fetchMobiles(draft, 1);
  };

  const handleClearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
    fetchMobiles(EMPTY_FILTERS, 1);
  };

  const handleDelete = async () => {
    try {
      await adminMobileService.delete(selectedMobile.id);
      toast.success('Mobile deleted successfully');
      setIsDeleteModalOpen(false);
      fetchMobiles(applied, page);
    } catch (error) {
      toast.error(error.message || 'Failed to delete mobile');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mobiles</h2>
        <p className="text-sm text-muted-foreground">Inventory of all registered mobile devices.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* IMEI */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by IMEI..."
              className="pl-9"
              value={draft.imei}
              onChange={(e) => setDraft((p) => ({ ...p, imei: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
            />
          </div>
          {/* Brand */}
          <Input
            placeholder="Filter by brand..."
            value={draft.brand}
            onChange={(e) => setDraft((p) => ({ ...p, brand: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          />
          {/* Model */}
          <Input
            placeholder="Filter by model..."
            value={draft.model}
            onChange={(e) => setDraft((p) => ({ ...p, model: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleApplyFilters} className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
          {hasActiveFilters && (
            <span className="text-xs text-muted-foreground">
              Filtering by: {[applied.imei && `IMEI "${applied.imei}"`, applied.brand && `Brand "${applied.brand}"`, applied.model && `Model "${applied.model}"`].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Brand & Model</TableHead>
              <TableHead>IMEI 1</TableHead>
              <TableHead>IMEI 2</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>RAM / Storage</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : mobiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No mobiles found.
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
                  <TableCell>{mobile.color}</TableCell>
                  <TableCell className="text-xs">
                    {mobile.ram ? `${mobile.ram}GB` : '-'} / {mobile.storage ? `${mobile.storage}GB` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => { setSelectedMobile(mobile); setIsDeleteModalOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4 cursor-pointer" />
                    </Button>
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

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="w-full max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Delete Mobile</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-semibold">{selectedMobile?.brand} {selectedMobile?.model}</span> (IMEI: {selectedMobile?.imei1}) from inventory? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="w-full sm:w-auto" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Mobiles;
