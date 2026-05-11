import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { mobileService, customerService, transactionService } from '../../services';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Label } from '../../component/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../component/ui/select';
import { Textarea } from '../../component/ui/texterea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import { Loader2, Smartphone, ArrowLeftRight, Users, Check, ChevronRight, ChevronLeft, ShoppingCart, Tag, Unlock, Search, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { ProvinceInput, DistrictInput } from '../../component/ui/ProvinceInput';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ current }) {
  const { t } = useTranslation();
  const STEPS = [
    { id: 1, label: t('entry.stepMobile'),      icon: Smartphone },
    { id: 2, label: t('entry.stepTransaction'), icon: ArrowLeftRight },
    { id: 3, label: t('entry.stepCustomer'),    icon: Users },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-200 font-semibold text-sm',
                done   && 'bg-primary border-primary text-primary-foreground',
                active && 'border-primary text-primary bg-primary/10 shadow-sm',
                !done && !active && 'border-border text-muted-foreground bg-muted/40',
              )}>
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={cn(
                'text-xs font-semibold tracking-wide',
                active ? 'text-primary' : done ? 'text-primary/60' : 'text-muted-foreground',
              )}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'w-8 sm:w-20 h-0.5 mx-1 sm:mx-2 mb-5 rounded-full transition-all duration-300',
                current > step.id ? 'bg-primary' : 'bg-border',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, error, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label className="text-sm font-medium text-foreground/80">{label}</Label>}
      {children}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}

// ─── Step 1: Mobile ───────────────────────────────────────────────────────────

function StepMobile({ form, onNext }) {
  const { t } = useTranslation();
  const { register, handleSubmit, formState: { errors } } = form;
  const firstRef = useRef(null);
  useEffect(() => { firstRef.current?.focus(); }, []);
  const numOnly = (e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); };

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('entry.imei1')} error={errors.imei1?.message}>
          <Input
            ref={firstRef}
            {...register('imei1', {
              required: t('entry.imei1Required'),
              pattern: { value: /^\d{15}$/, message: t('entry.imeiPattern') },
            })}
            inputMode="numeric" maxLength={15} placeholder={t('entry.imei1Placeholder')}
            onKeyPress={numOnly}
            className={cn('h-12 text-base tracking-widest font-mono', errors.imei1 && 'border-destructive focus-visible:ring-destructive')}
          />
        </Field>
        <Field label={t('entry.imei2')} error={errors.imei2?.message}>
          <Input
            {...register('imei2', {
              pattern: { value: /^\d{15}$/, message: t('entry.imeiPattern') },
            })}
            inputMode="numeric" maxLength={15} placeholder={t('entry.imei2Placeholder')}
            onKeyPress={numOnly}
            className={cn('h-12 text-base tracking-widest font-mono', errors.imei2 && 'border-destructive focus-visible:ring-destructive')}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('entry.brand')} error={errors.brand?.message}>
          <Input
            {...register('brand', { required: t('entry.brandRequired'), minLength: { value: 2, message: t('entry.brandMin') } })}
            placeholder={t('entry.brandPlaceholder')}
            className={cn('h-11', errors.brand && 'border-destructive')}
          />
        </Field>
        <Field label={t('entry.model')} error={errors.model?.message}>
          <Input
            {...register('model', { required: t('entry.modelRequired'), minLength: { value: 1, message: t('entry.modelRequired') } })}
            placeholder={t('entry.modelPlaceholder')}
            className={cn('h-11', errors.model && 'border-destructive')}
          />
        </Field>
        <Field label={t('entry.color')} error={errors.color?.message}>
          <Input
            {...register('color', { required: t('entry.colorRequired') })}
            placeholder={t('entry.colorPlaceholder')}
            className={cn('h-11', errors.color && 'border-destructive')}
          />
        </Field>
        <Field label={t('entry.ram')} error={errors.ram?.message}>
          <Input
            {...register('ram', { min: { value: 1, message: t('stolen.ramMin') }, max: { value: 256, message: t('stolen.ramMax') } })}
            type="number" inputMode="numeric" min="1" max="256" placeholder={t('entry.ramPlaceholder')}
            className={cn('h-11', errors.ram && 'border-destructive')}
          />
        </Field>
        <Field label={t('entry.storage')} error={errors.storage?.message}>
          <Input
            {...register('storage', { min: { value: 1, message: t('stolen.storageMin') }, max: { value: 4096, message: t('stolen.storageMax') } })}
            type="number" inputMode="numeric" min="1" max="4096" placeholder={t('entry.storagePlaceholder')}
            className={cn('h-11', errors.storage && 'border-destructive')}
          />
        </Field>
      </div>

      <div className="flex justify-end pt-1">
        <Button type="submit" size="lg" className="gap-2 px-10 h-11">
          {t('entry.next')} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 2: Transaction ──────────────────────────────────────────────────────

function StepTransaction({ form, onNext, onBack }) {
  const { t } = useTranslation();
  const { watch, setValue, register, formState: { errors } } = form;
  const selected = watch('transactionType') || 'BUY';

  const TX_TYPES = [
    { value: 'BUY',    label: t('entry.buy'),    desc: t('entry.buyDesc'),    icon: ShoppingCart,
      idle: 'bg-green-50 border-green-200 hover:border-green-400 hover:bg-green-100/60',
      active: 'bg-green-100 border-green-500 ring-2 ring-green-200', color: 'text-green-700' },
    { value: 'SELL',   label: t('entry.sell'),   desc: t('entry.sellDesc'),   icon: Tag,
      idle: 'bg-blue-50 border-blue-200 hover:border-blue-400 hover:bg-blue-100/60',
      active: 'bg-blue-100 border-blue-500 ring-2 ring-blue-200', color: 'text-blue-700' },
    { value: 'UNLOCK', label: t('entry.unlock'), desc: t('entry.unlockDesc'), icon: Unlock,
      idle: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:bg-purple-100/60',
      active: 'bg-purple-100 border-purple-500 ring-2 ring-purple-200', color: 'text-purple-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TX_TYPES.map(({ value, label, desc, icon: Icon, idle, active, color }) => {
          const isActive = selected === value;
          return (
            <button
              key={value} type="button"
              onClick={() => setValue('transactionType', value)}
              className={cn(
                'flex sm:flex-col items-center sm:items-center gap-3 sm:gap-3 p-4 sm:p-5 rounded-xl border-2 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left sm:text-center',
                isActive ? active : idle,
              )}
            >
              <Icon className={cn('w-6 h-6 sm:w-7 sm:h-7 shrink-0', color)} />
              <div className="flex-1 sm:flex-none sm:text-center">
                <p className={cn('font-bold text-sm', color)}>{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</p>
              </div>
              <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0', isActive ? `border-current ${color}` : 'border-border')}>
                {isActive && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('entry.price')} error={errors.price?.message}>
          <Input
            {...register('price', {
              min: { value: 0, message: t('entry.priceMin') },
              max: { value: 10000000, message: t('entry.priceMax') },
            })}
            type="number" inputMode="decimal" min="0" step="0.01" placeholder={t('entry.pricePlaceholder')}
            className={cn('h-11 text-base', errors.price && 'border-destructive')}
          />
        </Field>
        <Field label={t('entry.notes')}>
          <Textarea
            {...register('notes', { maxLength: { value: 500, message: 'Notes cannot exceed 500 characters' } })}
            placeholder={t('entry.notesPaceholder')}
            className="resize-none min-h-[44px]"
            rows={2}
          />
        </Field>
      </div>

      <div className="flex justify-between pt-1">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="gap-2 px-8 h-11">
          <ChevronLeft className="w-4 h-4" /> {t('common.back')}
        </Button>
        <Button type="button" size="lg" onClick={onNext} className="gap-2 px-10 h-11">
          {t('entry.next')} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Customer ─────────────────────────────────────────────────────────

function StepCustomer({ form, onBack, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const isSell = watch('transactionType') === 'SELL';
  const hasCurrentAddress = watch('hasCurrentAddress');
  const firstRef = useRef(null);
  useEffect(() => { firstRef.current?.focus(); }, []);

  const req = (msg) => isSell ? false : msg;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {isSell && (
        <div className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          <Tag className="w-4 h-4 shrink-0" />
          <span><strong>{t('entry.sell')}</strong> {t('entry.sellNotice')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={isSell ? t('entry.firstName') : t('entry.firstNameRequired')} error={errors.firstName?.message}>
          <Input
            ref={firstRef}
            {...register('firstName', {
              required: req(t('entry.firstNameReq')),
              minLength: { value: 2, message: t('entry.firstNameMin') },
              pattern: { value: /^[A-Za-z\u0600-\u06FF\s'-]+$/, message: t('entry.firstNamePattern') },
            })}
            className={cn('h-11', errors.firstName && 'border-destructive')}
            placeholder="e.g. Ahmad"
          />
        </Field>
        <Field label={isSell ? t('entry.lastName') : t('entry.lastNameRequired')} error={errors.lastName?.message}>
          <Input
            {...register('lastName', {
              required: req(t('entry.lastNameReq')),
              minLength: { value: 2, message: t('entry.lastNameMin') },
              pattern: { value: /^[A-Za-z\u0600-\u06FF\s'-]+$/, message: t('entry.lastNamePattern') },
            })}
            className={cn('h-11', errors.lastName && 'border-destructive')}
            placeholder="e.g. Khan"
          />
        </Field>

        <Field label={isSell ? t('entry.gender') : t('entry.genderRequired')}>
          <Select onValueChange={(v) => setValue('gender', v)} defaultValue="male">
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t('entry.male')}</SelectItem>
              <SelectItem value="female">{t('entry.female')}</SelectItem>
              <SelectItem value="other">{t('entry.other')}</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label={isSell ? t('entry.phone') : t('entry.phoneRequired')} error={errors.phoneNumber?.message}>
          <Input
            {...register('phoneNumber', {
              required: req(t('entry.phoneReq')),
              pattern: { value: /^(?:\+93|0093|0)7[0-9]{8}$|^\+93[0-9]{9}$/, message: t('entry.phonePattern') },
            })}
            type="tel" inputMode="tel"
            className={cn('h-11', errors.phoneNumber && 'border-destructive')}
            placeholder={t('entry.phonePlaceholder')}
          />
        </Field>

        <Field label={isSell ? t('entry.idCard') : t('entry.idCardRequired')} error={errors.idCardNumber?.message}>
          <Input
            {...register('idCardNumber', {
              required: req(t('entry.idCardReq')),
              minLength: { value: 5, message: t('entry.idCardMin') },
            })}
            className={cn('h-11', errors.idCardNumber && 'border-destructive')}
            placeholder={t('entry.idCardPlaceholder')}
          />
        </Field>

        <Field label={t('entry.idImage')}>
          <Input type="file" {...register('idImage')} accept="image/*" className="h-11" />
        </Field>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">{isSell ? t('entry.permanentAddressOptional') : t('entry.permanentAddress')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ProvinceInput
            value={watch('p_province') || ''}
            onChange={(v) => { setValue('p_province', v); setValue('p_district', ''); }}
            placeholder={t('entry.province')}
            hasError={!!errors.p_province}
          />
          <Input {...register('p_city', { required: isSell ? false : 'City is required' })} placeholder={t('entry.city')}
            className={cn('h-10', errors.p_city && 'border-destructive')} />
          <DistrictInput
            value={watch('p_district') || ''}
            onChange={(v) => setValue('p_district', v)}
            province={watch('p_province') || ''}
            placeholder={t('entry.district')}
            hasError={!!errors.p_district}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input type="checkbox" {...register('hasCurrentAddress')} className="w-4 h-4 rounded border-border accent-primary" />
          <span className="text-sm font-semibold">{t('entry.currentAddressToggle')}</span>
        </label>
        {hasCurrentAddress && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ProvinceInput
              value={watch('c_province') || ''}
              onChange={(v) => { setValue('c_province', v); setValue('c_district', ''); }}
              placeholder={t('entry.province')}
              hasError={!!errors.c_province}
            />
            <Input {...register('c_city', { required: !!hasCurrentAddress })} placeholder={t('entry.city')}
              className={cn('h-10', errors.c_city && 'border-destructive')} />
            <DistrictInput
              value={watch('c_district') || ''}
              onChange={(v) => setValue('c_district', v)}
              province={watch('c_province') || ''}
              placeholder={t('entry.district')}
              hasError={!!errors.c_district}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between pt-1">
        <Button type="button" variant="outline" size="lg" onClick={onBack} className="gap-2 px-8 h-11">
          <ChevronLeft className="w-4 h-4" /> {t('common.back')}
        </Button>
        <Button type="submit" size="lg" className="gap-2 px-10 h-11" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {t('entry.submitEntry')}
        </Button>
      </div>
    </form>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreateEntry() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [isFetchingEntries, setIsFetchingEntries] = useState(false);

  const EMPTY_FILTERS = { q: '', brand: '', type: '' };
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const hasActiveFilters = useMemo(() => Object.values(applied).some((v) => v !== ''), [applied]);

  const form = useForm({ defaultValues: { transactionType: 'BUY', gender: 'male' } });

  const fetchRecentEntries = async (filters = applied) => {
    setIsFetchingEntries(true);
    try {
      const params = { limit: 10, sort: 'createdAt:desc' };
      if (filters.q)     params.q     = filters.q;
      if (filters.brand) params.brand = filters.brand;
      if (filters.type)  params.type  = filters.type;
      const res = await transactionService.getAll(params);
      const raw = res?.data?.data;
      setRecentEntries(Array.isArray(raw?.transactions) ? raw.transactions : Array.isArray(raw?.items) ? raw.items : []);
    } catch {
      setRecentEntries([]);
    } finally {
      setIsFetchingEntries(false);
    }
  };

  const applyFilters = () => { setApplied(draft); fetchRecentEntries(draft); };
  const clearFilters = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); fetchRecentEntries(EMPTY_FILTERS); };

  useEffect(() => {
    fetchRecentEntries();
    const id = setInterval(() => fetchRecentEntries(applied), 60000);
    return () => clearInterval(id);
  }, []);

  const handleFinalSubmit = async (data) => {
    setIsLoading(true);
    let customerId = null;
    try {
      const isSell = data.transactionType === 'SELL';
      const hasCustomerData = !!(data.firstName?.trim() || data.phoneNumber?.trim() || data.idCardNumber?.trim());

      if (!isSell || hasCustomerData) {
        const fd = new FormData();
        fd.append('firstName', data.firstName || '');
        fd.append('lastName', data.lastName || '');
        fd.append('gender', data.gender || 'male');
        fd.append('idCardNumber', data.idCardNumber || '');
        fd.append('phoneNumber', data.phoneNumber || '');
        if (data.idImage?.[0]) fd.append('idImage', data.idImage[0]);
        fd.append('addresses', JSON.stringify({
          permanent: (data.p_province || data.p_city || data.p_district)
            ? { province: data.p_province || null, city: data.p_city || null, district: data.p_district || null }
            : null,
          current: data.hasCurrentAddress
            ? { province: data.c_province || null, city: data.c_city || null, district: data.c_district || null }
            : null,
        }));
        const customerRes = await customerService.create(fd);
        customerId = customerRes.data.data?.customer?.id ?? customerRes.data.data?.id ?? customerRes.data.id;
      }

      await mobileService.create({
        imei1: data.imei1,
        imei2: data.imei2 || undefined,
        brand: data.brand,
        model: data.model,
        color: data.color,
        ram: data.ram || undefined,
        storage: data.storage || undefined,
        type: data.transactionType,
        price: data.price || undefined,
        notes: data.notes || undefined,
        ...(customerId && { customerId }),
      });

      toast.success(t('entry.entrySuccess'));
      form.reset({ transactionType: 'BUY', gender: 'male' });
      setStep(1);
      fetchRecentEntries();
    } catch (err) {
      toast.error(err.message || t('entry.entryFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('entry.title')}</h2>
        <p className="text-muted-foreground mt-1">{t('entry.subtitle')}</p>
      </div>

      <div className="border rounded-xl bg-card shadow-sm p-4 sm:p-6 lg:p-8">
        <Stepper current={step} />
        <div>
          {step === 1 && <StepMobile form={form} onNext={() => setStep(2)} />}
          {step === 2 && <StepTransaction form={form} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <StepCustomer form={form} onBack={() => setStep(2)} onSubmit={handleFinalSubmit} isLoading={isLoading} />}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight">{t('entry.recentEntries')}</h3>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('entry.filterImei')}
                className="pl-9"
                value={draft.q}
                onChange={(e) => setDraft((p) => ({ ...p, q: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
            <Input
              placeholder={t('entry.filterBrand')}
              value={draft.brand}
              onChange={(e) => setDraft((p) => ({ ...p, brand: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
            <Select value={draft.type} onValueChange={(v) => setDraft((p) => ({ ...p, type: v === 'ALL' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder={t('entry.filterType')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('entry.filterTypeAll')}</SelectItem>
                <SelectItem value="BUY">{t('entry.buy')}</SelectItem>
                <SelectItem value="SELL">{t('entry.sell')}</SelectItem>
                <SelectItem value="UNLOCK">{t('entry.unlock')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={applyFilters} size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" /> {t('entry.applyFilter')}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> {t('entry.clearFilter')}
              </Button>
            )}
            {hasActiveFilters && (
              <span className="text-xs text-muted-foreground">
                {[applied.q && `${t('entry.imeiFilter')}: "${applied.q}"`, applied.brand && `${t('entry.brandFilter')}: "${applied.brand}"`, applied.type && `${t('entry.typeFilter')}: ${applied.type}`].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>{t('entry.mobile')}</TableHead>
                <TableHead>{t('entry.type')}</TableHead>
                <TableHead>{t('entry.priceCol')}</TableHead>
                <TableHead>{t('entry.time')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetchingEntries ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : recentEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                    {t('entry.noRecentEntries')}
                  </TableCell>
                </TableRow>
              ) : recentEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.customer
                      ? `${entry.customer.firstName} ${entry.customer.lastName}`.trim()
                      : <span className="text-muted-foreground italic text-xs">{t('entry.noCustomer')}</span>}
                  </TableCell>
                  <TableCell>{entry.mobile?.brand} {entry.mobile?.model}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                      entry.type === 'BUY'  ? 'bg-green-100 text-green-700' :
                      entry.type === 'SELL' ? 'bg-blue-100 text-blue-700' :
                                              'bg-purple-100 text-purple-700',
                    )}>{entry.type}</span>
                  </TableCell>
                  <TableCell>{entry.price ? `$${entry.price}` : '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.createdAt ? formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true }) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </div>
      </div>
    </div>
  );
}
