import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { mobileService, customerService, transactionService } from '../../services';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../component/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../component/ui/select';
import { Textarea } from '../../component/ui/texterea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import { Loader2, Plus, Pencil, Trash2, Smartphone as SmartphoneIcon, Users as UsersIcon, ArrowLeftRight as ArrowLeftRightIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Icon wrappers
const Smartphone = ({ className }) => <SmartphoneIcon className={className} />;
const Users = ({ className }) => <UsersIcon className={className} />;
const ArrowLeftRight = ({ className }) => <ArrowLeftRightIcon className={className} />;

const CreateEntry = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [isFetchingEntries, setIsFetchingEntries] = useState(true);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      transactionType: 'BUY',
      gender: 'MALE',
    }
  });

  const fetchRecentEntries = async () => {
    setIsFetchingEntries(true);
    try {
      // For demo, we might need a specific "my recent entries" endpoint or filter
      const response = await transactionService.getAll({ limit: 5, sort: 'createdAt:desc' });
      console.log(response)
      // setRecentEntries(response.data.data?.items || response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch recent entries:', error);
    } finally {
      setIsFetchingEntries(false);
    }
  };

  useEffect(() => {
    fetchRecentEntries();
    const interval = setInterval(fetchRecentEntries, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // 1. Create Mobile
      const mobileRes = await mobileService.create({
        imei1: data.imei1,
        imei2: data.imei2,
        brand: data.brand,
        model: data.model,
        color: data.color,
        ram: data.ram,
        storage: data.storage,
      });
      const mobileId = mobileRes.data.data?.id || mobileRes.data.id;

      // 2. Create Customer
      const customerFormData = new FormData();
      customerFormData.append('firstName', data.firstName);
      customerFormData.append('lastName', data.lastName);
      customerFormData.append('gender', data.gender);
      customerFormData.append('idCardNumber', data.idCardNumber);
      customerFormData.append('phoneNumber', data.phoneNumber);
      if (data.idImage?.[0]) {
        customerFormData.append('idImage', data.idImage[0]);
      }
      
      // Addresses
      const addresses = {
        permanent: {
          province: data.p_province,
          city: data.p_city,
          district: data.p_district,
          street: data.p_street,
          postalCode: data.p_postalCode,
        },
        current: data.hasCurrentAddress ? {
          province: data.c_province,
          city: data.c_city,
          district: data.c_district,
          street: data.c_street,
          postalCode: data.c_postalCode,
        } : null,
      };
      customerFormData.append('addresses', JSON.stringify(addresses));

      const customerRes = await customerService.create(customerFormData);
      const customerId = customerRes.data.data?.id || customerRes.data.id;

      // 3. Create Transaction
      await transactionService.create({
        mobileId,
        customerId,
        type: data.transactionType,
        price: data.price,
        notes: data.notes,
      });

      toast.success('Entry created successfully');
      reset();
      fetchRecentEntries();
    } catch (error) {
      toast.error(error.message || 'Failed to create entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Create Entry</h2>
        <p className="text-muted-foreground">Submit mobile, customer, and transaction data in one go.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Mobile Section */}
        <Card className="border-none shadow-none bg-background">
          <CardHeader className="px-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Smartphone className="h-5 w-5" /> Mobile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IMEI 1 (15 digits) *</Label>
              <Input {...register('imei1', { required: true, pattern: /^\d{15}$/ })} placeholder="Enter 15-digit IMEI" />
              {errors.imei1 && <p className="text-xs text-destructive">Valid 15-digit IMEI required</p>}
            </div>
            <div className="space-y-2">
              <Label>IMEI 2 (Optional, 15 digits)</Label>
              <Input {...register('imei2', { pattern: /^\d{15}$/ })} placeholder="Enter 15-digit IMEI" />
              {errors.imei2 && <p className="text-xs text-destructive">Must be 15 digits if provided</p>}
            </div>
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Input {...register('brand', { required: true })} placeholder="e.g. Apple, Samsung" />
            </div>
            <div className="space-y-2">
              <Label>Model *</Label>
              <Input {...register('model', { required: true })} placeholder="e.g. iPhone 15 Pro" />
            </div>
            <div className="space-y-2">
              <Label>Color *</Label>
              <Input {...register('color', { required: true })} placeholder="e.g. Titanium Grey" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>RAM (GB)</Label>
                <Input {...register('ram')} placeholder="8" />
              </div>
              <div className="space-y-2">
                <Label>Storage (GB)</Label>
                <Input {...register('storage')} placeholder="256" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Section */}
        <Card className="border-none shadow-none bg-background">
          <CardHeader className="px-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" /> Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input {...register('firstName', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Last Name *</Label>
              <Input {...register('lastName', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select onValueChange={(v) => setValue('gender', v)} defaultValue="MALE">
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID Card Number *</Label>
              <Input {...register('idCardNumber', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input {...register('phoneNumber', { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>ID Image Upload *</Label>
              <Input type="file" {...register('idImage', { required: true })} accept="image/*" />
            </div>
          </CardContent>
        </Card>

        {/* Addresses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-none bg-background">
            <CardHeader className="px-0">
              <CardTitle className="text-sm font-semibold">Permanent Address *</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <Input {...register('p_province', { required: true })} placeholder="Province" />
              <Input {...register('p_city', { required: true })} placeholder="City" />
              <Input {...register('p_district', { required: true })} placeholder="District" />
              <Input {...register('p_street', { required: true })} placeholder="Street" />
              <Input {...register('p_postalCode', { required: true })} placeholder="Postal Code" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-none bg-background">
            <CardHeader className="px-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">Current Address</CardTitle>
                <input type="checkbox" {...register('hasCurrentAddress')} className="rounded border-gray-300" />
                <span className="text-xs text-muted-foreground">Different from permanent?</span>
              </div>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              {watch('hasCurrentAddress') && (
                <>
                  <Input {...register('c_province', { required: true })} placeholder="Province" />
                  <Input {...register('c_city', { required: true })} placeholder="City" />
                  <Input {...register('c_district', { required: true })} placeholder="District" />
                  <Input {...register('c_street', { required: true })} placeholder="Street" />
                  <Input {...register('c_postalCode', { required: true })} placeholder="Postal Code" />
                </>
              )}
              {!watch('hasCurrentAddress') && (
                <div className="h-full flex items-center justify-center border border-dashed rounded-lg p-8">
                  <p className="text-xs text-muted-foreground italic text-center">Same as permanent address</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction Section */}
        <Card className="border-none shadow-none bg-background">
          <CardHeader className="px-0">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" /> Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Transaction Type *</Label>
              <Select onValueChange={(v) => setValue('transactionType', v)} defaultValue="BUY">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                  <SelectItem value="UNLOCK">Unlock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price (Optional)</Label>
              <Input type="number" {...register('price')} placeholder="0.00" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes (Optional)</Label>
              <Textarea {...register('notes')} placeholder="Any additional details..." />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full md:w-auto px-12" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Complete Entry
        </Button>
      </form>

      {/* Recent Entries */}
      <div className="space-y-4 pt-8 border-t">
        <h3 className="text-xl font-bold tracking-tight">Recent Entries</h3>
        <div className="border rounded-lg overflow-hidden bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetchingEntries ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : recentEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No recent entries found.
                  </TableCell>
                </TableRow>
              ) : (
                recentEntries.map((entry) => {
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.customer?.firstName} {entry.customer?.lastName}
                      </TableCell>
                      <TableCell>
                        {entry.mobile?.brand} {entry.mobile?.model}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          entry.type === 'BUY' ? "bg-green-100 text-green-700" :
                          entry.type === 'SELL' ? "bg-blue-100 text-blue-700" :
                          "bg-purple-100 text-purple-700"
                        )}>
                          {entry.type}
                        </span>
                      </TableCell>
                      <TableCell>${entry.price || '0'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete"
                            disabled
                          >
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
      </div>
    </div>
  );
};

export default CreateEntry;
