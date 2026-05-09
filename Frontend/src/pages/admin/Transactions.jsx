import React, { useState, useEffect, useCallback } from 'react';
import { adminTransactionService } from '../../services';
import { SectionLoader } from '../../component/Loader';
import { Button } from '../../component/ui/button';
import { Input } from '../../component/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../component/ui/table';
import TablePagination from '../../component/ui/TablePagination';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const LIMIT = 7;

const Transactions = () => {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [total, setTotal]               = useState(0);
  const [draft, setDraft]               = useState('');
  const [applied, setApplied]           = useState('');

  const fetchTransactions = useCallback(async (currentPage = 1, imei = applied) => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, limit: LIMIT };
      if (imei) params.imei = imei;
      const response = await adminTransactionService.getAll(params);
      setTransactions(response.data.data?.transactions || []);
      setTotalPages(response.data.data?.pagination?.totalPages || 1);
      setTotal(response.data.data?.pagination?.total || 0);
    } catch (error) {
      toast.error(error.message || t('transactions.noTransactions'));
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [applied]);

  useEffect(() => { fetchTransactions(page, applied); }, [page]);

  const applyFilter = () => { setPage(1); setApplied(draft); fetchTransactions(1, draft); };
  const clearFilter = () => { setDraft(''); setApplied(''); setPage(1); fetchTransactions(1, ''); };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t('transactions.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('transactions.subtitle')} — {total} {t('common.total')}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('transactions.searchPlaceholder')}
            className="pl-9 w-64"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
          />
        </div>
        <Button size="sm" onClick={applyFilter} className="gap-1.5">
          <Filter className="h-3.5 w-3.5" /> {t('transactions.applyFilters')}
        </Button>
        {applied && (
          <Button variant="outline" size="sm" onClick={clearFilter} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> {t('transactions.clear')}
          </Button>
        )}
        {applied && (
          <span className="text-xs text-muted-foreground">{t('transactions.imei')}: "{applied}"</span>
        )}
      </div>

      <div className="border rounded-lg bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>{t('transactions.type')}</TableHead>
              <TableHead>{t('transactions.customer')}</TableHead>
              <TableHead>{t('transactions.mobile')}</TableHead>
              <TableHead>{t('transactions.price')}</TableHead>
              <TableHead>{t('transactions.date')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="p-0"><SectionLoader /></TableCell></TableRow>
            ) : transactions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('transactions.noTransactions')}</TableCell></TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs font-mono">{String(tx.id).substring(0, 8)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-[10px] font-bold uppercase',
                      tx.type === 'BUY'    ? 'bg-green-100 text-green-700' :
                      tx.type === 'SELL'   ? 'bg-blue-100 text-blue-700' :
                                            'bg-purple-100 text-purple-700'
                    )}>
                      {tx.type === 'BUY' ? t('transactions.buy') : tx.type === 'SELL' ? t('transactions.sell') : t('transactions.unlock')}
                    </span>
                  </TableCell>
                  <TableCell>{tx.customer ? `${tx.customer.firstName} ${tx.customer.lastName}` : '—'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{tx.mobile?.brand} {tx.mobile?.model}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{tx.mobile?.imei1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{tx.price ? `$${tx.price}` : '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tx.createdAt ? format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm') : '—'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
    </div>
  );
};

export default Transactions;
