import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminUserService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import TablePagination from '../../component/ui/TablePagination';
import { ArrowLeft, Smartphone, Users, ArrowLeftRight, Search, ShoppingCart, Tag, Unlock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const LIMIT = 10;

const TX_META = {
  BUY:    { icon: ShoppingCart, cls: 'bg-green-100 text-green-700'   },
  SELL:   { icon: Tag,          cls: 'bg-blue-100 text-blue-700'     },
  UNLOCK: { icon: Unlock,       cls: 'bg-purple-100 text-purple-700' },
};

export default function UserDetail() {
  const { t } = useTranslation();
  const { id }   = useParams();
  const navigate = useNavigate();

  const TABS = [
    { key: 'mobiles',      label: t('userDetail.mobiles'),      icon: Smartphone     },
    { key: 'customers',    label: t('userDetail.customers'),    icon: Users          },
    { key: 'transactions', label: t('userDetail.transactions'), icon: ArrowLeftRight },
  ];

  const [user,        setUser]        = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [activeTab,   setActiveTab]   = useState('mobiles');

  const [mobiles,       setMobiles]       = useState([]);
  const [mobLoading,    setMobLoading]    = useState(false);
  const [mobPage,       setMobPage]       = useState(1);
  const [mobTotal,      setMobTotal]      = useState(0);
  const [mobTotalPages, setMobTotalPages] = useState(1);
  const [mobSearch,     setMobSearch]     = useState('');
  const mobDebounce = useRef(null);

  const [customers,       setCustomers]     = useState([]);
  const [custLoading,     setCustLoading]   = useState(false);
  const [custPage,        setCustPage]      = useState(1);
  const [custTotal,       setCustTotal]     = useState(0);
  const [custTotalPages,  setCustTotalPages] = useState(1);
  const [custSearch,      setCustSearch]    = useState('');
  const custDebounce = useRef(null);

  const [transactions,  setTransactions]  = useState([]);
  const [txLoading,     setTxLoading]     = useState(false);
  const [txPage,        setTxPage]        = useState(1);
  const [txTotal,       setTxTotal]       = useState(0);
  const [txTotalPages,  setTxTotalPages]  = useState(1);
  const [txType,        setTxType]        = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminUserService.getById(id);
        setUser(res.data.data?.user ?? res.data.data);
      } catch {
        toast.error(t('userDetail.userNotFound'));
        navigate('/admin/users');
      } finally {
        setUserLoading(false);
      }
    };
    load();
  }, [id]);

  const fetchMobiles = useCallback(async (pg = 1, q = mobSearch) => {
    setMobLoading(true);
    try {
      const res = await adminUserService.getUserMobiles(id, { page: pg, limit: LIMIT, ...(q && { q }) });
      const raw = res.data.data;
      setMobiles(raw?.mobiles || []);
      setMobTotal(raw?.pagination?.total || 0);
      setMobTotalPages(raw?.pagination?.totalPages || 1);
    } catch { setMobiles([]); } finally { setMobLoading(false); }
  }, [id]);

  const fetchCustomers = useCallback(async (pg = 1, q = custSearch) => {
    setCustLoading(true);
    try {
      const res = await adminUserService.getUserCustomers(id, { page: pg, limit: LIMIT, ...(q && { q }) });
      const raw = res.data.data;
      setCustomers(raw?.customers || []);
      setCustTotal(raw?.pagination?.total || 0);
      setCustTotalPages(raw?.pagination?.totalPages || 1);
    } catch { setCustomers([]); } finally { setCustLoading(false); }
  }, [id]);

  const fetchTransactions = useCallback(async (pg = 1, type = txType) => {
    setTxLoading(true);
    try {
      const res = await adminUserService.getUserTransactions(id, { page: pg, limit: LIMIT, ...(type && { type }) });
      const raw = res.data.data;
      setTransactions(raw?.transactions || []);
      setTxTotal(raw?.pagination?.total || 0);
      setTxTotalPages(raw?.pagination?.totalPages || 1);
    } catch { setTransactions([]); } finally { setTxLoading(false); }
  }, [id]);

  const tabMounted = useRef({ mobiles: false, customers: false, transactions: false });

  useEffect(() => {
    if (activeTab === 'mobiles')      fetchMobiles(1, '');
    if (activeTab === 'customers')    fetchCustomers(1, '');
    if (activeTab === 'transactions') fetchTransactions(1, '');
  }, [activeTab]);

  useEffect(() => {
    if (!tabMounted.current.mobiles) { tabMounted.current.mobiles = true; return; }
    if (activeTab === 'mobiles') fetchMobiles(mobPage);
  }, [mobPage]);

  useEffect(() => {
    if (!tabMounted.current.customers) { tabMounted.current.customers = true; return; }
    if (activeTab === 'customers') fetchCustomers(custPage);
  }, [custPage]);

  useEffect(() => {
    if (!tabMounted.current.transactions) { tabMounted.current.transactions = true; return; }
    if (activeTab === 'transactions') fetchTransactions(txPage);
  }, [txPage]);

  if (userLoading) return <SectionLoader />;

  return (
    <div className="space-y-6">

      <div className="flex items-start gap-3">
        <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 mt-0.5" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight">{user?.name || t('userDetail.unnamedUser')}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {user?.email}{user?.shopNumber ? ` · ${t('userDetail.shopNo')} ${user.shopNumber}` : ''}{user?.phone ? ` · ${user.phone}` : ''}
          </p>
        </div>
        <span className={cn('shrink-0 mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase',
          user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
          {user?.role}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: t('userDetail.mobiles'),      value: mobTotal,  icon: Smartphone,     color: 'text-primary'    },
          { label: t('userDetail.customers'),    value: custTotal,  icon: Users,          color: 'text-green-600'  },
          { label: t('userDetail.transactions'), value: txTotal,    icon: ArrowLeftRight, color: 'text-orange-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-background px-4 py-3 flex items-center gap-3">
            <Icon className={cn('h-5 w-5 shrink-0', color)} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{label}</p>
              <p className="text-lg font-bold leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b flex overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
              activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Mobiles Tab */}
      {activeTab === 'mobiles' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={mobSearch} placeholder={t('userDetail.searchMobiles')} className="pl-9"
              onChange={(e) => {
                setMobSearch(e.target.value); setMobPage(1);
                clearTimeout(mobDebounce.current);
                mobDebounce.current = setTimeout(() => fetchMobiles(1, e.target.value), 400);
              }} />
          </div>
          <div className="border rounded-lg bg-background overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('userDetail.device')}</TableHead>
                  <TableHead>{t('userDetail.imei1')}</TableHead>
                  <TableHead>{t('userDetail.imei2')}</TableHead>
                  <TableHead>{t('userDetail.color')}</TableHead>
                  <TableHead>{t('userDetail.ramStorage')}</TableHead>
                  <TableHead>{t('userDetail.registered')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mobLoading ? (
                  <TableRow><TableCell colSpan={6} className="p-0"><SectionLoader /></TableCell></TableRow>
                ) : mobiles.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t('userDetail.noMobiles')}</TableCell></TableRow>
                ) : mobiles.map((mob) => (
                  <TableRow key={mob.id}>
                    <TableCell>
                      <p className="font-semibold text-sm">{mob.brand}</p>
                      <p className="text-xs text-muted-foreground">{mob.model}</p>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={mobPage} totalPages={mobTotalPages} total={mobTotal} limit={LIMIT} onPageChange={setMobPage} />
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={custSearch} placeholder={t('userDetail.searchCustomers')} className="pl-9"
              onChange={(e) => {
                setCustSearch(e.target.value); setCustPage(1);
                clearTimeout(custDebounce.current);
                custDebounce.current = setTimeout(() => fetchCustomers(1, e.target.value), 400);
              }} />
          </div>
          <div className="border rounded-lg bg-background overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>{t('userDetail.gender')}</TableHead>
                  <TableHead>{t('userDetail.phone')}</TableHead>
                  <TableHead>{t('userDetail.idCard')}</TableHead>
                  <TableHead>{t('userDetail.added')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custLoading ? (
                  <TableRow><TableCell colSpan={5} className="p-0"><SectionLoader /></TableCell></TableRow>
                ) : customers.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">{t('userDetail.noCustomers')}</TableCell></TableRow>
                ) : customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.firstName} {c.lastName}</TableCell>
                    <TableCell>
                      {c.gender && (
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                          c.gender === 'male' ? 'bg-blue-100 text-blue-700' :
                          c.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-muted text-muted-foreground')}>
                          {c.gender}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{c.phoneNumber || '—'}</TableCell>
                    <TableCell className="text-sm font-mono">{c.idCardNumber || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {c.createdAt ? format(new Date(c.createdAt), 'MMM dd, yyyy') : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={custPage} totalPages={custTotalPages} total={custTotal} limit={LIMIT} onPageChange={setCustPage} />
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <select value={txType}
            onChange={(e) => { setTxType(e.target.value); setTxPage(1); fetchTransactions(1, e.target.value); }}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full sm:w-40">
            <option value="">{t('userDetail.allTypes')}</option>
            <option value="BUY">{t('userDetail.buy')}</option>
            <option value="SELL">{t('userDetail.sell')}</option>
            <option value="UNLOCK">{t('userDetail.unlock')}</option>
          </select>
          <div className="border rounded-lg bg-background overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('userDetail.type')}</TableHead>
                  <TableHead>{t('userDetail.mobile')}</TableHead>
                  <TableHead>{t('userDetail.imei')}</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>{t('userDetail.price')}</TableHead>
                  <TableHead>{t('userDetail.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txLoading ? (
                  <TableRow><TableCell colSpan={6} className="p-0"><SectionLoader /></TableCell></TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">{t('userDetail.noTransactions')}</TableCell></TableRow>
                ) : transactions.map((tx) => {
                  const meta   = TX_META[tx.type] || TX_META.BUY;
                  const TxIcon = meta.icon;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', meta.cls)}>
                          <TxIcon className="h-3 w-3" />{tx.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{tx.mobile?.brand} {tx.mobile?.model}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{tx.mobile?.imei1 || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {tx.customer
                          ? `${tx.customer.firstName} ${tx.customer.lastName}`.trim()
                          : <span className="text-muted-foreground italic text-xs">{t('userDetail.noCustomer')}</span>}
                      </TableCell>
                      <TableCell className="font-semibold text-sm">{tx.price ? `$${tx.price}` : '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {tx.createdAt ? format(new Date(tx.createdAt), 'MMM dd, yyyy · HH:mm') : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <TablePagination page={txPage} totalPages={txTotalPages} total={txTotal} limit={LIMIT} onPageChange={setTxPage} />
        </div>
      )}
    </div>
  );
}
