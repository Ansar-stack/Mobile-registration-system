import { useState, useEffect } from 'react';
import { adminDetectedStolenMobileService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../component/ui/dialog';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../component/ui/select';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  X, 
  Eye, 
  Trash2, 
  Phone, 
  User, 
  Calendar,
  Smartphone,
  Receipt,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { TablePagination } from '../../component/ui/TablePagination';

const DetectedStolenMobiles = () => {
  const [detectedStolenMobiles, setDetectedStolenMobiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    q: '',
    imei: '',
    reporterName: '',
    reporterPhone: '',
    brand: '',
    model: '',
    startDate: '',
    endDate: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState(null);

  const fetchDetectedStolenMobiles = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const res = await adminDetectedStolenMobileService.getAll(params);
      const data = res?.data?.data;
      
      setDetectedStolenMobiles(Array.isArray(data?.detectedStolenMobiles) ? data.detectedStolenMobiles : []);
      setPagination(data?.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      });
    } catch (error) {
      toast.error(error.message || 'Failed to load detected stolen mobiles');
      setDetectedStolenMobiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await adminDetectedStolenMobileService.getStats();
      setStats(res?.data?.data?.stats || {});
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchDetectedStolenMobiles();
    fetchStats();
  }, [pagination.page, filters]);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filter changes
  };

  const handleApplyFilters = () => {
    fetchDetectedStolenMobiles();
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({
      q: '',
      imei: '',
      reporterName: '',
      reporterPhone: '',
      brand: '',
      model: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    try {
      await adminDetectedStolenMobileService.delete(id);
      toast.success('Detected stolen mobile deleted successfully');
      setDetectedStolenMobiles(prev => prev.filter(item => item.id !== id));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error(error.message || 'Failed to delete detected stolen mobile');
    }
  };

  const openDeleteDialog = (id) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy · HH:mm');
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '—';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Detected</p>
                <p className="text-2xl font-bold">{stats.totalDetected || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Stolen Mobiles</p>
                <p className="text-2xl font-bold">{stats.uniqueStolenMobilesDetected || 0}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last 7 Days</p>
                <p className="text-2xl font-bold">{stats.detectedLast7Days || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last 30 Days</p>
                <p className="text-2xl font-bold">{stats.detectedLast30Days || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            Detected Stolen Mobiles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mobiles registered by users that matched stolen mobile reports
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search IMEI, brand, model, reporter..."
              className="pl-9 w-full lg:w-64"
              value={filters.q}
              onChange={(e) => handleFilterChange('q', e.target.value)}
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10' : ''}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          {(filters.imei || filters.reporterName || filters.reporterPhone || filters.brand || filters.model || filters.startDate || filters.endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Advanced Filters</h3>
            <Button variant="outline" size="sm" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI</Label>
              <Input
                id="imei"
                placeholder="Search by IMEI"
                value={filters.imei}
                onChange={(e) => handleFilterChange('imei', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reporterName">Reporter Name</Label>
              <Input
                id="reporterName"
                placeholder="Reporter name"
                value={filters.reporterName}
                onChange={(e) => handleFilterChange('reporterName', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reporterPhone">Reporter Phone</Label>
              <Input
                id="reporterPhone"
                placeholder="Reporter phone"
                value={filters.reporterPhone}
                onChange={(e) => handleFilterChange('reporterPhone', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="Brand"
                value={filters.brand}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="Model"
                value={filters.model}
                onChange={(e) => handleFilterChange('model', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
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
                <TableHead>Stolen Mobile</TableHead>
                <TableHead>Registered Mobile</TableHead>
                <TableHead>Transaction</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Detected</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <SectionLoader />
                  </TableCell>
                </TableRow>
              ) : detectedStolenMobiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No detected stolen mobiles found.
                  </TableCell>
                </TableRow>
              ) : detectedStolenMobiles.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
                        <span className="font-medium text-sm">
                          {item.stolenMobile?.brand} {item.stolenMobile?.model}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>IMEI1: <span className="font-mono">{item.stolenMobile?.imei1}</span></div>
                        {item.stolenMobile?.imei2 && (
                          <div>IMEI2: <span className="font-mono">{item.stolenMobile.imei2}</span></div>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <User className="h-3 w-3" />
                          <span>{item.stolenMobile?.reporterName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{item.stolenMobile?.reporterPhone}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5 text-blue-500" />
                        <span className="font-medium text-sm">
                          {item.mobile?.brand} {item.mobile?.model}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>IMEI1: <span className="font-mono">{item.mobile?.imei1}</span></div>
                        {item.mobile?.imei2 && (
                          <div>IMEI2: <span className="font-mono">{item.mobile.imei2}</span></div>
                        )}
                        <div>Color: {item.mobile?.color}</div>
                        {item.mobile?.ram && <div>RAM: {item.mobile.ram}</div>}
                        {item.mobile?.storage && <div>Storage: {item.mobile.storage}</div>}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-3.5 w-3.5 text-green-500" />
                        <span className="font-medium text-sm">
                          {item.transaction?.type}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.transaction?.price && (
                          <div>Price: ${item.transaction.price}</div>
                        )}
                        {item.transaction?.notes && (
                          <div className="truncate max-w-[150px]" title={item.transaction.notes}>
                            Notes: {item.transaction.notes}
                          </div>
                        )}
                        <div>Date: {formatDate(item.transaction?.createdAt)}</div>
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
                          {item.transaction.user.shopNumber && (
                            <div>Shop: {item.transaction.user.shopNumber}</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {item.transaction?.customer ? (
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {item.transaction.customer.firstName} {item.transaction.customer.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>{item.transaction.customer.phoneNumber}</div>
                          <div>ID: {item.transaction.customer.idCardNumber}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{formatDate(item.detectedAt)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.detectedAt)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelected(item)}
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => openDeleteDialog(item.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {detectedStolenMobiles.length > 0 && (
          <div className="border-t px-4 py-3">
            <TablePagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              Detected Stolen Mobile Details
            </DialogTitle>
            <DialogDescription>
              Match detected on {selected ? formatDate(selected.detectedAt) : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selected && (
            <div className="space-y-6">
              {/* Stolen Mobile Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  Stolen Mobile Report
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">IMEI 1</Label>
                    <p className="font-mono text-sm">{selected.stolenMobile?.imei1 || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">IMEI 2</Label>
                    <p className="font-mono text-sm">{selected.stolenMobile?.imei2 || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Brand & Model</Label>
                    <p className="text-sm">{selected.stolenMobile?.brand} {selected.stolenMobile?.model}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <p className="text-sm">{selected.stolenMobile?.color || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Reporter</Label>
                    <p className="text-sm">{selected.stolenMobile?.reporterName}</p>
                    <p className="text-xs text-muted-foreground">{selected.stolenMobile?.reporterPhone}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Reported Date</Label>
                    <p className="text-sm">{formatDate(selected.stolenMobile?.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              {/* Registered Mobile Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-500" />
                  Registered Mobile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">IMEI 1</Label>
                    <p className="font-mono text-sm">{selected.mobile?.imei1 || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">IMEI 2</Label>
                    <p className="font-mono text-sm">{selected.mobile?.imei2 || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Brand & Model</Label>
                    <p className="text-sm">{selected.mobile?.brand} {selected.mobile?.model}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Color</Label>
                    <p className="text-sm">{selected.mobile?.color || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">RAM & Storage</Label>
                    <p className="text-sm">
                      {selected.mobile?.ram || '—'} / {selected.mobile?.storage || '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Registered Date</Label>
                    <p className="text-sm">{formatDate(selected.mobile?.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              {/* Transaction Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-green-500" />
                  Transaction Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <p className="text-sm">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100">
                        {selected.transaction?.type}
                      </span>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Price</Label>
                    <p className="text-sm">
                      {selected.transaction?.price ? `$${selected.transaction.price}` : '—'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <p className="text-sm">{selected.transaction?.notes || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Transaction Date</Label>
                    <p className="text-sm">{formatDate(selected.transaction?.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              {/* User Info */}
              {selected.transaction?.user && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    Registered By
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="text-sm">{selected.transaction.user.name || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm">{selected.transaction.user.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm">{selected.transaction.user.phone || '—'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Shop Number</Label>
                      <p className="text-sm">{selected.transaction.user.shopNumber || '—'}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Customer Info */}
              {selected.transaction?.customer && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-500" />
                    Customer
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Name</Label>
                      <p className="text-sm">
                        {selected.transaction.customer.firstName} {selected.transaction.customer.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm">{selected.transaction.customer.phoneNumber}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">ID Card Number</Label>
                      <p className="text-sm">{selected.transaction.customer.idCardNumber}</p>
                    </div>
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
            <DialogTitle>Delete Detected Stolen Mobile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this detected stolen mobile record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(itemToDelete)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetectedStolenMobiles;