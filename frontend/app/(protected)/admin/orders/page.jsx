'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Edit,
  Search,
  X,
  ShoppingCart,
  Eye,
  Info,
  Terminal,
  User,
  CalendarDays,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiFetch } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Container } from '@/components/common/container';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { RightDrawer } from '@/components/common/right-drawer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

export default function OrdersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Listing state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ordersSearchInput, setOrdersSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

  // Detail Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status mutation (manual overrides)
  const statusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      const res = await apiFetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Sipariş durumu güncellenemedi');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      // Update local state if drawer is open to show changes
      if (selectedOrder && selectedOrder.id === data.data.id) {
        setSelectedOrder(data.data);
      }
      toast.success('Sipariş durumu güncellendi.');
    },
    onError: (err) => {
      toast.error(err.message || 'Güncelleme hatası');
    },
  });

  // Fetch Orders
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', pagination, sorting, searchQuery, statusFilter, dateRange],
    queryFn: async () => {
      const sortField = sorting?.[0]?.id || 'id';
      const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        per_page: String(pagination.pageSize),
        sort: sortField,
        dir: sortDirection,
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(dateRange?.from ? { start_date: dateRange.from.toISOString() } : {}),
        ...(dateRange?.to ? { end_date: dateRange.to.toISOString() } : {}),
      });

      const res = await apiFetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Siparişler yüklenemedi');
      return res.json();
    },
  });

  const handleViewClick = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleStatusChange = (orderId, status) => {
    statusMutation.mutate({ orderId, status });
  };

  const handleExport = async () => {
    try {
      const sortField = sorting?.[0]?.id || 'id';
      const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
      const params = new URLSearchParams({
        page: '1',
        per_page: '5000',
        sort: sortField,
        dir: sortDirection,
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(dateRange?.from ? { start_date: dateRange.from.toISOString() } : {}),
        ...(dateRange?.to ? { end_date: dateRange.to.toISOString() } : {}),
      });

      const res = await apiFetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error('Dışa aktarma verisi yüklenemedi');
      const json = await res.json();
      const exportData = json.data || [];

      if (exportData.length === 0) {
        toast.error('Dışa aktarılacak veri bulunamadı.');
        return;
      }

      const headers = ['Sipariş ID', 'Kullanıcı', 'E-Posta', 'Tutar', 'Para Birimi', 'Durum', 'Ödeme Kanalı', 'Ödeme Referansı (OID)', 'Tarih'];
      const csvRows = [headers.join(',')];

      for (const order of exportData) {
        const row = [
          `#${order.id}`,
          `"${(order.user?.name || 'Misafir').replace(/"/g, '""')}"`,
          `"${(order.user?.email || '-').replace(/"/g, '""')}"`,
          order.amount,
          order.currency,
          `"${order.status}"`,
          `"${order.gateway || '-'}"`,
          `"${order.transaction_id || '-'}"`,
          order.created_at ? `"${new Date(order.created_at).toLocaleString('tr-TR')}"` : '-'
        ];
        csvRows.push(row.join(','));
      }

      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `siparisler_export_${new Date().toISOString().slice(0,10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Siparişler başarıyla dışa aktarıldı.');
    } catch (err) {
      toast.error('Dışa aktarma başarısız oldu: ' + err.message);
    }
  };

  // Columns definition
  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      id: 'id',
      header: "Sipariş ID",
      cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id}</span>,
      meta: {
        cellClassName: 'w-[110px] max-w-[110px]',
        headerClassName: 'w-[110px] max-w-[110px]',
        skeleton: <Skeleton className="w-12 h-6" />
      },
    },
    {
      accessorKey: 'user.name',
      id: 'user_name',
      header: "Kullanıcı",
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) {
          return <span className="text-muted-foreground">Misafir</span>;
        }
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <User className="size-4 text-muted-foreground shrink-0" />
            <div className="flex flex-col">
              <Link
                href={`/user-management/users/${user.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-foreground hover:text-primary transition-colors hover:underline decoration-primary/40 underline-offset-2"
              >
                {user.name}
              </Link>
              <span className="text-xs text-muted-foreground">{user.email || '-'}</span>
            </div>
          </div>
        );
      },
      meta: {
        cellClassName: 'min-w-[220px]',
        headerClassName: 'min-w-[220px]',
        skeleton: <Skeleton className="w-32 h-6" />
      },
    },
    {
      accessorKey: 'amount',
      id: 'amount',
      header: "Tutar",
      cell: ({ row }) => (
        <div className="font-semibold text-foreground">
          {Number(row.original.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {row.original.currency || 'TRY'}
        </div>
      ),
      meta: { skeleton: <Skeleton className="w-20 h-6" /> },
    },
    {
      accessorKey: 'status',
      id: 'status',
      header: "Durum",
      cell: ({ row }) => {
        const status = row.original.status;
        const colors = {
          paid: 'bg-green-500/10 text-green-500 border-green-500/20',
          pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          failed: 'bg-red-500/10 text-red-500 border-red-500/20',
          refunded: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
        };
        const labels = {
          paid: 'Ödendi',
          pending: 'Beklemede',
          failed: 'Hatalı / Başarısız',
          refunded: 'İade Edildi',
        };
        return (
          <Badge className={`border ${colors[status] || ''}`} variant="outline">
            {labels[status] || status}
          </Badge>
        );
      },
      meta: { skeleton: <Skeleton className="w-20 h-6" /> },
    },
    {
      accessorKey: 'gateway',
      id: 'gateway',
      header: "Ödeme Kanalı",
      cell: ({ row }) => {
        const gw = row.original.gateway;
        if (gw === 'halkbank') return <span className="text-xs font-semibold">Halkbank</span>;
        if (gw === 'paytr') return <span className="text-xs font-semibold">PayTR</span>;
        return <span className="text-xs font-semibold uppercase">{gw || 'PayTR'}</span>;
      },
      meta: { skeleton: <Skeleton className="w-16 h-6" /> },
    },
    {
      accessorKey: 'transaction_id',
      id: 'transaction_id',
      header: "Ödeme Referansı (OID)",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.transaction_id || '-'}</span>,
      meta: { skeleton: <Skeleton className="w-28 h-6" /> },
    },
    {
      accessorKey: 'created_at',
      id: 'created_at',
      header: "Tarih",
      cell: ({ row }) => row.original.created_at ? new Date(row.original.created_at).toLocaleString('tr-TR') : '-',
      meta: { skeleton: <Skeleton className="w-24 h-6" /> },
    },
    {
      id: 'actions',
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); handleViewClick(row.original); }}>
            <Eye className="size-4" />
          </Button>
        </div>
      ),
      meta: { skeleton: <Skeleton className="size-8" /> },
    }
  ], [selectedOrder]);

  const table = useReactTable({
    columns,
    data: data?.data || [],
    pageCount: Math.ceil((data?.meta?.total || 0) / pagination.pageSize),
    getRowId: (row) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const renderToolbar = () => {
    return (
      <CardHeader className="py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Referans no veya isim ara..."
              value={ordersSearchInput}
              onChange={(e) => setOrdersSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSearchQuery(ordersSearchInput)}
              className="ps-9 w-full md:w-64"
            />
            {searchQuery && (
              <Button variant="ghost" className="absolute end-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => { setSearchQuery(''); setOrdersSearchInput(''); }}>
                <X className="size-3.5" />
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPagination({ ...pagination, pageIndex: 0 }); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sipariş Durumu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="paid">Ödendi</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="failed">Başarısız</SelectItem>
              <SelectItem value="refunded">İade Edildi</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[250px] justify-start text-left font-normal h-10',
                  !dateRange?.from && 'text-muted-foreground'
                )}
              >
                <CalendarDays className="me-2 size-4 text-muted-foreground shrink-0" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd.MM.yyyy')} - {format(dateRange.to, 'dd.MM.yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd.MM.yyyy')
                  )
                ) : (
                  <span>Tarih Aralığı Seçin</span>
                )}
                {dateRange?.from && (
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateRange({ from: undefined, to: undefined });
                      setPagination({ ...pagination, pageIndex: 0 });
                    }}
                    className="ms-auto rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(val) => {
                  setDateRange(val || { from: undefined, to: undefined });
                  setPagination({ ...pagination, pageIndex: 0 });
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Excel Export Button */}
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="h-10 px-4">
            <Download className="me-2 size-4 text-muted-foreground" />
            Excel / CSV Dışa Aktar
          </Button>
        </div>
      </CardHeader>
    );
  };

  return (
    <Container className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Ana Sayfa</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Siparişler</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sipariş & Finans Yönetimi</h1>
        <p className="text-xs md:text-sm text-muted-foreground/80">
          Ödeme ve sipariş kayıtlarını listeleyebilir, manuel onay verebilir ve ödeme webhook payload loglarını inceleyebilirsiniz.
        </p>
      </div>

      <DataGrid
        table={table}
        recordCount={data?.meta?.total || 0}
        isLoading={isLoading}
        tableLayout={{ columnsResizable: true }}
        onRowClick={handleViewClick}
      >
        <Card>
          {renderToolbar()}
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      {/* Details Drawer */}
      <RightDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Sipariş Detayı">
        {selectedOrder && (
          <div className="space-y-5">
            {/* Summary Box */}
            <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Sipariş Bilgileri</span>
                <span className="font-mono text-xs">#{selectedOrder.id}</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kullanıcı:</span>
                  <span className="font-semibold">{selectedOrder.user?.name || 'Misafir'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-Posta:</span>
                  <span>{selectedOrder.user?.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tutar:</span>
                  <span className="font-semibold text-primary">
                    {Number(selectedOrder.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarih:</span>
                  <span>{selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('tr-TR') : '-'}</span>
                </div>
              </div>
            </div>

            {/* Error Message Box (If any failed transaction has error_message) */}
            {selectedOrder.transactions?.some((t) => t.error_message) && (
              <div className="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col gap-1">
                <span>Ödeme Sağlayıcı Hata Mesajı:</span>
                <span className="font-normal text-muted-foreground leading-relaxed">
                  {selectedOrder.transactions.find((t) => t.error_message)?.error_message}
                </span>
              </div>
            )}

            {/* Quick Status Control */}
            <div className="space-y-1.5">
              <Label>Durumu Güncelle (Manuel Müdahale)</Label>
              <Select value={selectedOrder.status} onValueChange={(val) => handleStatusChange(selectedOrder.id, val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="paid">Ödendi (Manuel)</SelectItem>
                  <SelectItem value="failed">Başarısız / İptal</SelectItem>
                  <SelectItem value="refunded">İade Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Purchased Items */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ShoppingCart className="size-3.5" /> Satın Alınan Kalemler ({selectedOrder.items?.length || 0})
              </h3>
              <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                {(selectedOrder.items || []).map((item, index) => {
                  const details = item.orderable;
                  return (
                    <div key={item.id || index} className="p-3 text-sm flex items-center justify-between">
                      <div>
                        {item.orderable_type?.includes('Registration') ? (
                          <>
                            <div className="font-semibold">Yarış Kaydı: {details?.race?.name || 'Yarış'}</div>
                            <div className="text-xs text-muted-foreground">
                              Katılımcı: {details?.participant?.name || 'Sporcu'} ({details?.participant?.identity_number})
                            </div>
                          </>
                        ) : (
                          <div className="font-semibold">Ürün ID: {item.orderable_id}</div>
                        )}
                      </div>
                      <div className="font-mono text-xs font-bold">
                        {Number(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedOrder.currency}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Gateway Webhook Payload Logs */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Terminal className="size-3.5" /> Ödeme Sağlayıcı Webhook Logları
              </h3>
              {(selectedOrder.transactions || []).length === 0 ? (
                <div className="text-xs text-muted-foreground border border-dashed rounded-xl p-4 text-center">
                  Henüz webhook log kaydı bulunamadı.
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-1.5">
                  {(selectedOrder.transactions || []).map((trans, index) => {
                    const parsedPayload = typeof trans.payload === 'string' 
                      ? JSON.parse(trans.payload) 
                      : trans.payload;
                    return (
                      <AccordionItem key={trans.id || index} value={`trans-${trans.id || index}`} className="border rounded-xl px-4">
                        <AccordionTrigger className="text-xs font-mono py-2.5 hover:no-underline flex justify-between w-full gap-2">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Info className="size-3 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground shrink-0">OID:</span>
                            <span className="truncate max-w-[130px]" title={trans.transaction_id || trans.merchant_oid}>
                              {trans.transaction_id || trans.merchant_oid || (trans.id ? '#' + trans.id : 'Bilinmeyen ID')}
                            </span>
                            {trans.status === 'failed' && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/10 shrink-0">
                                Başarısız
                              </Badge>
                            )}
                            {trans.status === 'success' && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/10 shrink-0">
                                Başarılı
                              </Badge>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(trans.created_at).toLocaleString('tr-TR')}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-3 space-y-3">
                          {trans.error_message && (
                            <div className="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                              Hata Detayı: {trans.error_message}
                            </div>
                          )}
                          <ScrollArea className="h-60 border bg-muted/65 rounded-lg p-2.5">
                            <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed">
                              {JSON.stringify(parsedPayload, null, 2)}
                            </pre>
                            <ScrollBar orientation="horizontal" />
                          </ScrollArea>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="outline" onClick={() => setDrawerOpen(false)} className="w-full">Kapat</Button>
            </div>
          </div>
        )}
      </RightDrawer>
    </Container>
  );
}
