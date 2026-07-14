'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '../components/user-context';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardTable } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Trophy, Calendar, Ticket, User, CreditCard, ShoppingCart, Terminal, Info, X } from 'lucide-react';
import { formatDateTime } from '@/lib/helpers';
import { Skeleton } from '@/components/ui/skeleton';
import { RightDrawer } from '@/components/common/right-drawer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

const getStatusBadgeProps = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
    case 'success':
    case 'completed':
      return { variant: 'success', label: 'Ödendi' };
    case 'pending':
    case 'waiting':
      return { variant: 'warning', label: 'Beklemede' };
    case 'cancelled':
    case 'refunded':
      return { variant: 'destructive', label: 'İptal Edildi' };
    default:
      return { variant: 'info', label: status || 'Bilinmiyor' };
  }
};

export default function UserRegistrationsPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useUser();
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: orderDetails, isLoading: isOrderLoading } = useQuery({
    queryKey: ['order-details', selectedPaymentId],
    queryFn: async () => {
      if (!selectedPaymentId) return null;
      const response = await apiFetch(`/api/admin/orders?search=${selectedPaymentId}`);
      if (!response.ok) {
        throw new Error('Order details could not be loaded.');
      }
      const json = await response.json();
      return json?.data?.[0] || null;
    },
    enabled: !!selectedPaymentId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-80 h-4 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-24" />
        </CardContent>
      </Card>
    );
  }

  const registrations = user?.registrations || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <div>
            <CardTitle>{t('users.details.registrations.title', 'Yarış Kayıtları')}</CardTitle>
            <CardDescription>
              {t(
                'users.details.registrations.description',
                'Bu kullanıcının ödemesini/kaydını yaptığı tüm yarış katılım detayları.'
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {registrations.length === 0 ? (
        <CardContent>
          <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-xl p-8">
            {t('users.details.registrations.empty', 'Kullanıcıya ait hiçbir yarış kaydı bulunamadı.')}
          </div>
        </CardContent>
      ) : (
        <CardTable>
          <ScrollArea>
            <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('registrations.fields.bib', 'Göğüs No / ID')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('registrations.fields.participant', 'Katılımcı')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('registrations.fields.race', 'Yarış')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('registrations.fields.category', 'Kategori')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('registrations.fields.price', 'Tutar')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('registrations.fields.status', 'Durum')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('registrations.fields.payment_id', 'Ödeme Ref')}</TableHead>
                    <TableHead className="font-bold text-xs uppercase text-muted-foreground">{t('registrations.fields.date', 'Kayıt Tarihi')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((r) => {
                    const statusProps = getStatusBadgeProps(r.status);
                    const raceTitle = r.race?.title?.tr || r.race?.title?.en || r.race?.title || '-';
                    const categoryName = r.category?.name?.tr || r.category?.name?.en || r.category?.name || '-';

                    return (
                      <TableRow key={r.id} className="hover:bg-muted/10">
                        <TableCell className="font-mono text-xs text-foreground font-bold whitespace-nowrap py-4">
                          {r.bib_number ? (
                            <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5 hover:bg-primary/5 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit">
                              <Ticket className="size-3" />
                              {r.bib_number}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/60">#{r.id}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <User className="size-3.5 text-muted-foreground shrink-0" />
                            {r.participant?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-foreground whitespace-nowrap max-w-[200px] truncate" title={raceTitle}>
                          {raceTitle}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary" className="hover:bg-secondary text-xs">
                            {categoryName}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-foreground whitespace-nowrap">
                          {r.price ? `${Number(r.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY` : '0.00 TRY'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={statusProps.variant} appearance="light" className="capitalize">
                            <BadgeDot />
                            {statusProps.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {r.payment_id ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPaymentId(r.payment_id);
                                setDrawerOpen(true);
                              }}
                              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer text-left font-mono"
                            >
                              <CreditCard className="size-3 text-muted-foreground/60 shrink-0" />
                              <span className="underline decoration-dotted underline-offset-2">{r.payment_id}</span>
                            </button>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5 text-muted-foreground/60 shrink-0" />
                            {r.created_at ? formatDateTime(new Date(r.created_at)) : '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
        )}

      {/* RightDrawer to view order details */}
      <RightDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            setSelectedPaymentId(null);
          }
        }}
        title="Sipariş Detayı"
        size="lg"
      >
        {isOrderLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-24" />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-32" />
          </div>
        ) : orderDetails ? (
          <div className="space-y-6">
            {/* Summary Box */}
            <div className="border border-border rounded-xl p-4 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Sipariş Bilgileri</span>
                <span className="font-mono text-xs">#{orderDetails.id}</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kullanıcı:</span>
                  <span className="font-semibold">{orderDetails.user?.name || 'Misafir'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">E-Posta:</span>
                  <span>{orderDetails.user?.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tutar:</span>
                  <span className="font-semibold text-primary">
                    {Number(orderDetails.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {orderDetails.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarih:</span>
                  <span>{orderDetails.created_at ? new Date(orderDetails.created_at).toLocaleString('tr-TR') : '-'}</span>
                </div>
              </div>
            </div>

            {/* Error Message Box (If any failed transaction has error_message) */}
            {orderDetails.transactions?.some((t) => t.error_message) && (
              <div className="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col gap-1">
                <span>Ödeme Sağlayıcı Hata Mesajı:</span>
                <span className="font-normal text-muted-foreground leading-relaxed">
                  {orderDetails.transactions.find((t) => t.error_message)?.error_message}
                </span>
              </div>
            )}

            {/* Purchased Items */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <ShoppingCart className="size-3.5" /> Satın Alınan Kalemler ({orderDetails.items?.length || 0})
              </h3>
              <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                {(orderDetails.items || []).map((item, index) => {
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
                      <div className="font-mono text-xs font-semibold">
                        {Number(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {orderDetails.currency}
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
              {(orderDetails.transactions || []).length === 0 ? (
                <div className="text-xs text-muted-foreground border border-dashed rounded-xl p-4 text-center">
                  Henüz webhook log kaydı bulunamadı.
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-1.5">
                  {(orderDetails.transactions || []).map((trans, index) => {
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
              <Button variant="outline" onClick={() => setDrawerOpen(false)} className="w-full">
                Kapat
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Sipariş bulunamadı veya silinmiş.
          </div>
        )}
      </RightDrawer>
    </Card>
  );
}
